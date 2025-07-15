const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadImage = async (imageBuffer, filename) => {
  try {
    const result = await cloudinary.uploader.upload_stream({
      resource_type: 'image',
      public_id: `blog/${filename}`,
    });

    return result.secure_url;
  } catch (err) {
    console.error('[CLOUDINARY] Upload error:', err.message);
    throw new Error('Image upload failed');
  }
};

module.exports = { uploadImage };
