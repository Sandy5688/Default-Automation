const axios = require('axios');

const MEDIUM_API_TOKEN = process.env.MEDIUM_API_TOKEN;
const USER_ID = process.env.MEDIUM_USER_ID;

const publishToMedium = async ({ title, content_html, tags }) => {
  try {
    const res = await axios.post(
      `https://api.medium.com/v1/users/${USER_ID}/posts`,
      {
        title,
        contentFormat: 'html',
        content: content_html,
        tags,
        publishStatus: 'public',
      },
      {
        headers: {
          Authorization: `Bearer ${MEDIUM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error('[MEDIUM] Error publishing:', err.response?.data || err.message);
    throw new Error('Failed to publish to Medium');
  }
};

module.exports = { publishToMedium };
