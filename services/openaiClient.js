const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set this in your .env file
});

module.exports = { openai };
