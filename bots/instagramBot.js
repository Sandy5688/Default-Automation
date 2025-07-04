const axios = require('axios');
const logger = require('../utils/logger');
const { logToMongo } = require('../utils/mongoLogger');

async function runInstagramBot() {
  logger.info('[InstagramBot] Starting (Graph API)');

  const token = process.env.FB_ACCESS_TOKEN;
  const pageId = process.env.FB_PAGE_ID;
  const igId = process.env.IG_BUSINESS_ID;

  if (!token || !pageId || !igId) {
    logger.error('[InstagramBot] Missing FB_ACCESS_TOKEN, FB_PAGE_ID, or IG_BUSINESS_ID');
    return;
  }

  try {
    // 1 Auto-post multiple images
    const mediaIds = await Promise.all([
      uploadImageToInstagram('https://example.com/image1.jpg', token, igId),
      uploadImageToInstagram('https://example.com/image2.jpg', token, igId),
    ]);
    const postResp = await createCarouselPost(mediaIds, 'Auto-posted from bot', token, igId);
    logger.info(`[InstagramBot] Carousel post created: ${postResp.id}`);
    await logToMongo('instagram', { action: 'post', id: postResp.id });

    // 2 Auto-comment on recent media
    const recent = await getRecentMedia(igId, token);
    for (let media of recent) {
      await axios.post(`https://graph.facebook.com/v18.0/${media.id}/comments`, {
        message: ' Awesome content!',
        access_token: token,
      });
      logger.info(`[InstagramBot] Commented on: ${media.id}`);
      await logToMongo('instagram', { action: 'comment', mediaId: media.id });
    }

    // 3 Auto-like recent posts
    for (let media of recent.slice(0, 3)) {
      await axios.post(`https://graph.facebook.com/v18.0/${media.id}/likes`, {
        access_token: token,
      });
      logger.info(`[InstagramBot] Liked: ${media.id}`);
      await logToMongo('instagram', { action: 'like', mediaId: media.id });
    }

    // 4️Auto-reply to comments
    for (let media of recent) {
      const comments = await getComments(media.id, token);
      for (let comment of comments.data) {
        await axios.post(`https://graph.facebook.com/v18.0/${comment.id}/replies`, {
          message: 'Thanks for engaging! ',
          access_token: token,
        });
        logger.info(`[InstagramBot] Replied to comment: ${comment.id}`);
        await logToMongo('instagram', { action: 'reply', commentId: comment.id });
      }
    }

    logger.info('[InstagramBot] Task complete ');
  } catch (err) {
    logger.error(`[InstagramBot] Error: ${err.response?.data?.error?.message || err.message}`);
  }
}

async function uploadImageToInstagram(imageUrl, token, igId) {
  const { data } = await axios.post(`https://graph.facebook.com/v18.0/${igId}/media`, {
    image_url: imageUrl,
    is_carousel_item: true,
    access_token: token,
  });
  return data.id;
}

async function createCarouselPost(mediaIds, caption, token, igId) {
  const { data } = await axios.post(`https://graph.facebook.com/v18.0/${igId}/media`, {
    children: mediaIds,
    caption,
    media_type: 'CAROUSEL',
    access_token: token,
  });
  const creationId = data.id;

  const publishResp = await axios.post(`https://graph.facebook.com/v18.0/${igId}/media_publish`, {
    creation_id: creationId,
    access_token: token,
  });
  return publishResp.data;
}

async function getRecentMedia(igId, token) {
  const { data } = await axios.get(`https://graph.facebook.com/v18.0/${igId}/media`, {
    params: {
      access_token: token,
      fields: 'id,caption,media_url,permalink',
    },
  });
  return data.data;
}

async function getComments(mediaId, token) {
  return axios.get(`https://graph.facebook.com/v18.0/${mediaId}/comments`, {
    params: { access_token: token },
  }).then(res => res.data);
}

module.exports = runInstagramBot;
