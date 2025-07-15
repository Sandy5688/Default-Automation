const { OpenAI } = require('openai');
const cloudinary = require('cloudinary').v2;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadImage = async (prompt) => {
  const imgRes = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    response_format: 'url',
  });

  const imageUrl = imgRes.data[0].url;
  const uploaded = await cloudinary.uploader.upload(imageUrl, {
    folder: 'blogs',
    use_filename: true,
    unique_filename: false,
  });

  return uploaded.secure_url;
};

module.exports = { uploadImage };
