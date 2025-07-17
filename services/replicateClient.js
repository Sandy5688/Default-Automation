const axios = require('axios');

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

const replicate = axios.create({
  baseURL: 'https://api.replicate.com/v1',
  headers: {
    Authorization: `Token ${REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

module.exports = replicate;
