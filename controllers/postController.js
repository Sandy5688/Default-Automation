const { supabase } = require('../services/supabaseClient');
const { generateCaption } = require('../services/aiService');
const {
  generateVideoFromPrompt,
  waitForVideoCompletion,
} = require('../services/runwayService');
const logger = require('../utils/logger');

// 1. Schedule a post (AI caption + optional video + queue it)
exports.schedulePost = async (req, res) => {
  const { platform, media_prompt, media_url, scheduled_at } = req.body;

  if (!platform || !media_prompt) {
    return res.status(400).json({ error: 'Missing platform or media_prompt' });
  }

  try {
    // Generate caption
    const caption = await generateCaption(media_prompt, platform);
    logger.info(`[SCHEDULE_POST] Caption generated for ${platform}`);

    // Generate video if media_url not provided
   let finalMediaUrl = media_url;

logger.info(`[SCHEDULE_POST] DEBUG: finalMediaUrl = "${finalMediaUrl}", ENABLE_VIDEO_GEN = ${process.env.ENABLE_VIDEO_GEN}`);

if ((!finalMediaUrl || finalMediaUrl === '') && process.env.ENABLE_VIDEO_GEN === 'true') {
  try {
    logger.info(`[SCHEDULE_POST] Starting RunwayML video generation...`);
    const jobId = await generateVideoFromPrompt(media_prompt);
    logger.info(`[SCHEDULE_POST] RunwayML job started: ${jobId}`);
    finalMediaUrl = await waitForVideoCompletion(jobId, 90);
    logger.info(`[SCHEDULE_POST] RunwayML video ready: ${finalMediaUrl}`);
  } catch (videoErr) {
    logger.error(`[SCHEDULE_POST] RunwayML video generation failed: ${videoErr.message}`);
  }
}

    // Save to generated_posts
    await supabase.from('generated_posts').insert({
      platform,
      caption,
      media_prompt,
      queued: true,
    });

    // Save to post_queue
    const { error } = await supabase.from('post_queue').insert({
      platform,
      media_url: finalMediaUrl,
      caption,
      priority: 0,
      scheduled_at: scheduled_at || new Date(),
    });

    if (error) throw error;
    res.json({ message: 'Post scheduled successfully' });
  } catch (err) {
    logger.error(`[SCHEDULE_POST] ${err.stack}`);
    res.status(500).json({ error: 'Failed to schedule post', detail: err.message });
  }
};

// 2. Preview caption (no queue)
exports.previewCaption = async (req, res) => {
  const { platform, prompt } = req.body;
  if (!platform || !prompt) {
    return res.status(400).json({ error: 'Missing platform or prompt' });
  }

  try {
    const caption = await generateCaption(prompt, platform);
    res.json({ platform, prompt, caption });
  } catch (err) {
    logger.error(`[PREVIEW_CAPTION] ${err.stack}`);
    res.status(500).json({ error: 'Failed to generate caption' });
  }
};

// 3. Retry all failed posts manually
exports.retryFailedPosts = async (req, res) => {
  try {
    const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
    const now = new Date().toISOString();

    const { data: posts, error } = await supabase
      .from('post_queue')
      .select('*')
      .eq('status', 'failed')
      .lt('retries', MAX_RETRIES);

    if (error) return res.status(500).json({ error: error.message });
    if (!posts.length) return res.json({ message: 'No failed posts to retry' });

    const updates = posts.map((post) =>
      supabase.from('post_queue').update({
        status: 'pending',
        scheduled_at: now,
      }).eq('id', post.id)
    );

    await Promise.all(updates);
    res.json({ message: `${posts.length} post(s) marked for retry.` });
  } catch (err) {
    logger.error(`[RETRY_FAILED] ${err.stack}`);
    res.status(500).json({ error: 'Retry failed posts failed' });
  }
};

// 4. Retry posts by platform
exports.retryByPlatform = async (req, res) => {
  const { platform } = req.body;
  const now = new Date().toISOString();

  if (!platform) return res.status(400).json({ error: 'Missing platform' });

  try {
    const { data: posts, error } = await supabase
      .from('post_queue')
      .select('*')
      .eq('status', 'failed')
      .eq('platform', platform)
      .lt('retries', parseInt(process.env.MAX_RETRIES || '3'));

    if (error) return res.status(500).json({ error: error.message });
    if (!posts.length) return res.json({ message: `No failed posts for ${platform}` });

    const updates = posts.map((post) =>
      supabase.from('post_queue').update({
        status: 'pending',
        scheduled_at: now,
      }).eq('id', post.id)
    );

    await Promise.all(updates);
    res.json({ message: `${posts.length} post(s) on ${platform} requeued.` });
  } catch (err) {
    logger.error(`[RETRY_PLATFORM] ${err.stack}`);
    res.status(500).json({ error: 'Retry by platform failed' });
  }
};

// 5. View full post queue
exports.getPostQueue = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('post_queue')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    logger.error(`[GET_POST_QUEUE] ${err.stack}`);
    res.status(500).json({ error: 'Failed to load post queue' });
  }
};

// 6. View generated posts
exports.getGeneratedPosts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('generated_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    logger.error(`[GET_GENERATED_POSTS] ${err.stack}`);
    res.status(500).json({ error: 'Failed to fetch generated posts' });
  }
};

// 7. Delete a post (cleanup or admin UI)
exports.deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('post_queue').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    logger.error(`[DELETE_POST] ${err.stack}`);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};
