// src/utils/email.js
const nodemailer = require('nodemailer');

// Create a test account if you don't have real credentials
const createTestAccount = async () => {
  return await nodemailer.createTestAccount();
};

// Development transporter (Ethereal email)
const createDevTransporter = async () => {
  const testAccount = await createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

// Production transporter (Gmail/real service)
const createProdTransporter = () => {
  return nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

module.exports = async ({ email, subject, message }) => {
  try {
    const transporter = process.env.NODE_ENV === 'production' 
      ? await createProdTransporter() 
      : await createDevTransporter();

    const mailOptions = {
      from: '"Chat Bot" <no-reply@chatapp.com>',
      to: email,
      subject,
      text: message,
      html: `<p>${message}</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (err) {
    console.error('Email sending error:', err);
    return false;
  }
};