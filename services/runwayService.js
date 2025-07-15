// services/runwayService.js
const axios = require('axios');
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

//  Start video generation job
const generateVideoFromPrompt = async (prompt) => {
  try {
    const response = await axios.post(
      'https://api.runwayml.com/gen2', // ✅ this is what client provided
      {
        prompt: prompt,
        mode: 'text-to-video'
      },
      {
        headers: {
          Authorization: `Bearer ${RUNWAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const jobId = response.data?.id;
    if (!jobId) throw new Error('RunwayML job ID not returned');
    return jobId;
  } catch (err) {
    console.error('[RUNWAY_GEN2] Error starting job:', err.response?.data || err.message);
    throw new Error('Failed to start video generation job');
  }
};



//  Poll for job completion
const checkVideoStatus = async (jobId) => {
  try {
    const response = await axios.get(
      `https://api.runwayml.com/jobs/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${RUNWAY_API_KEY}`
        }
      }
    );

    return response.data; // includes status + outputs
  } catch (err) {
    console.error('[RUNWAY_GEN2] Error checking status:', err.response?.data || err.message);
    throw new Error('Failed to check video generation status');
  }
};

// Wait until job completes or fails
const waitForVideoCompletion = async (jobId, maxWaitSeconds = 60) => {
  const interval = 5000;
  const maxTries = Math.ceil(maxWaitSeconds * 1000 / interval);
  let tries = 0;

  while (tries < maxTries) {
    const status = await checkVideoStatus(jobId);
    if (status.status === 'succeeded') {
      return status.outputs?.video || status.outputs?.[0]?.url;
    }
    if (status.status === 'failed') {
      throw new Error('Video generation failed');
    }
    await new Promise((r) => setTimeout(r, interval));
    tries++;
  }

  throw new Error('Video generation timed out');
};

// const generateImageFromPrompt = async (prompt) => {
//   try {
//     const response = await axios.post(
//       'https://api.runwayml.com/v1/models/stable-diffusion-v1-5/infer',
//       {
//         prompt: prompt,
//         width: 512,
//         height: 512,
//         num_inference_steps: 30,
//         guidance_scale: 7.5
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${RUNWAY_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     const imageUrl =
//       response.data?.outputs?.[0]?.url || response.data?.image || null;

//     if (!imageUrl) throw new Error('Image generation failed or returned empty URL');

//     return imageUrl;
//   } catch (err) {
//     console.error('[RUNWAY_IMAGE_GEN] Error:', err.response?.data || err.message);
//     throw new Error('Image generation failed');
//   }
// };

module.exports = {
  generateVideoFromPrompt,
  checkVideoStatus,
  waitForVideoCompletion,
  // generateImageFromPrompt
};
