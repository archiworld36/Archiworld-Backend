const EmailOtp = require("../models/emailOTP");
const sendMailFromGmail = require("../utils/mailService");

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    await EmailOtp.findOneAndUpdate(
      { email },
      { otp, verified: false },
      { upsert: true, new: true }
    );

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color:#333;">Code for Email Verification</h2>

        <p>Dear Customer,</p>
        <p>Please use the Code below to verify your email ID:</p>

        <div style="
          margin: 20px 0;
          padding: 15px;
          background: #f4f4f4;
          border-left: 4px solid #0d6efd;
          font-size: 22px;
          font-weight: bold;
          letter-spacing: 4px;
          width: fit-content;
        ">
          ${otp}
        </div>

        <p>For help, contact <strong>sales@archiworld.in</strong></p>
        <p>Thank you,<br/>Archiworld</p>
      </div>
    `;

    await sendMailFromGmail(
      email,
      "Your Code to verify your email",
      htmlContent
    );

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const resendOtp = async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await EmailOtp.findOne(
        { email },
      );
  
      if (user.otp) {
          const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <h2 style="color:#333;">OTP for Email Verification</h2>
  
            <p>Dear Customer,</p>
            <p>Please use the Code below or share it with the Archiworld team to verify your email ID:</p>
  
            <div style="
              margin: 20px 0;
              padding: 15px;
              background: #f4f4f4;
              border-left: 4px solid #0d6efd;
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 4px;
              width: fit-content;
            ">
              ${user.otp}
            </div>
  
            <p>For any issues, feedback, or further help, please feel free to reach out at  
              <strong>sales@archiworld.in</strong>.
            </p>
  
            <p>Thank you for your cooperation.<br/>Archiworld</p>
  
            <hr/>
            <p style="font-size: 13px; color: #555;">
              <em>This is a system-generated email. Please do not reply.
              </em>
            </p>
          </div>
        `;
         // 5️⃣ Send Email
         await sendMailFromGmail(
          email,
          `Your Code to verify your email ID`,
          htmlContent,
        );
      }
      res.json({ message: "OTP re-sent successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
};

const verifyOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      const record = await EmailOtp.findOne({ email });
  
      if (!record || record.otp !== Number(otp)) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
  
      record.verified = true;
      await record.save();
  
      res.json({ message: "Email verified successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    sendOtp,
    resendOtp,
    verifyOtp
}