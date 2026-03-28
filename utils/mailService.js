require("isomorphic-fetch");
const nodemailer = require("nodemailer");

async function sendMailFromGmail(to, subject, htmlContent) {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SENDER_EMAIL, // your GSuite email
        pass: process.env.PASSWORD, // App Password
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    let mailOptions = {
      from: `Archiworld <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Sent: %s", info.messageId);

    return info.messageId;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = sendMailFromGmail;
