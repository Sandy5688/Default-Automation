const axios = require('axios');

const publishToGMB = async ({ title, content_html }) => {
  try {
    const response = await axios.post(
      `https://mybusiness.googleapis.com/v4/accounts/${process.env.GMB_ACCOUNT_ID}/locations/${process.env.GMB_LOCATION_ID}/localPosts`,
      {
        summary: title,
        languageCode: 'en',
        callToAction: {
          actionType: 'LEARN_MORE',
          url: process.env.SITE_URL,
        },
        media: [],
        topicType: 'STANDARD',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GMB_ACCESS_TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error('[GMB] Error:', err.message);
    throw new Error('Failed to publish to Google My Business');
  }
};

module.exports = { publishToGMB };
