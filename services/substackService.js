const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SUBSTACK_EMAIL,
    pass: process.env.SUBSTACK_PASSWORD,
  },
});

const publishToSubstack = async ({ title, content_html }) => {
  const mailOptions = {
    from: process.env.SUBSTACK_EMAIL,
    to: process.env.SUBSTACK_POST_EMAIL, // your special Substack email
    subject: title,
    html: content_html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error('[SUBSTACK] Mail error:', err.message);
    throw new Error('Failed to publish to Substack');
  }
};

module.exports = { publishToSubstack };
