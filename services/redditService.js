const snoowrap = require('snoowrap');

function getRedditClient() {
  if (
    !process.env.REDDIT_USER_AGENT ||
    !process.env.REDDIT_CLIENT_ID ||
    !process.env.REDDIT_CLIENT_SECRET ||
    !process.env.REDDIT_USERNAME ||
    !process.env.REDDIT_PASSWORD
  ) {
    throw new Error('Missing Reddit credentials in environment');
  }

  return new snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });
}

const postToReddit = async (blog) => {
  try {
    const reddit = getRedditClient();
    const subreddit = 'your_subreddit_name'; // e.g. 'tech', 'marketing', etc.
    const title = blog.title;
    const content = blog.content_markdown || blog.content_html || blog.content;

    await reddit.getSubreddit(subreddit).submitSelfpost({
      title,
      text: content,
    });

    console.log(`[REDDIT] Blog "${title}" posted to r/${subreddit}`);
  } catch (err) {
    console.error(`[REDDIT] Error: ${err.message}`);
    throw err;
  }
};

module.exports = { postToReddit };
