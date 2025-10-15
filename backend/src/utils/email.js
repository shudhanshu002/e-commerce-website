import nodemailer from 'nodemailer'

const sendEmail = async (options) => {
  console.log('--- Attempting to send email ---');
  console.log('Email Host:', process.env.EMAIL_HOST);
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Pass:', process.env.EMAIL_PASS ? '********' : 'NOT FOUND'); // Hide password for security
  console.log('---------------------------------');

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `E-Commerce Store <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
}

export default sendEmail