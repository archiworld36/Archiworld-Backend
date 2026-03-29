const EmailOtp = require("../models/emailOTP");
const phoneOTP = require("../models/phoneOtp");
const User = require("../models/user");
const sendMailFromGmail = require("../utils/mailService");
const sendOtpSMS = require("../utils/msg91Service");
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
      { upsert: true, new: true },
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
      htmlContent,
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

    const user = await EmailOtp.findOne({ email });

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

// 📌 Send OTP
const sendPhoneOtp = async (req, res) => {
  try {
    let { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Ensure country code (India)
    phoneNumber = "91" + phoneNumber;

    const otp = Math.floor(100000 + Math.random() * 900000);

    await phoneOTP.findOneAndUpdate(
      { phoneNumber },
      { otp, verified: false },
      { upsert: true, new: true },
    );

    await sendOtpSMS(phoneNumber, otp);

    res.json({ message: "OTP sent successfully on phone" });
  } catch (err) {
    console.error("Send Phone OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Resend OTP
const resendPhoneOtp = async (req, res) => {
  try {
    let { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    phoneNumber = "91" + phoneNumber;

    const user = await phoneOTP.findOne({ phoneNumber });

    if (!user || !user.otp) {
      return res.status(400).json({ message: "OTP not found" });
    }

    await sendOtpSMS(phoneNumber, user.otp);

    res.json({ message: "OTP re-sent successfully" });
  } catch (err) {
    console.error("Resend Phone OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Verify OTP
const verifyPhoneOtp = async (req, res) => {
  try {
    let { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: "Phone & OTP required" });
    }

    phoneNumber = "91" + phoneNumber;

    const record = await phoneOTP.findOne({ phoneNumber });

    if (!record || record.otp !== Number(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    record.verified = true;
    await record.save();

    res.json({ message: "Phone verified successfully" });
  } catch (err) {
    console.error("Verify Phone OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Send OTP
const sendUserOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Enter Email Id or Username" });
    }

    const query = email.includes("@") ? { email: email } : { username: email };

    const user = await User.findOne(query);
    if (!user)
      return res.status(401).json({ message: "Invalid Username or Email Id" });

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000);

      await EmailOtp.findOneAndUpdate(
        { email: user.email },
        { otp, verified: false },
        { upsert: true, new: true },
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
        user.email,
        "Your Password Reset Code",
        htmlContent,
      );
      console.log(user.email, otp, user.mobile);
      await sendOtpSMS(user.mobile, otp);
    }

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Resend OTP
const resendUserOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Enter Email Id or Username" });
    }

    const query = email.includes("@") ? { email: email } : { username: email };

    const user = await User.findOne(query);
    if (!user)
      return res.status(401).json({ message: "Invalid Username or Email Id" });

    const otp = await EmailOtp.findOne({ email: user.email });

    if (otp.otp) {
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
              ${otp.otp}
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
        user.email,
        `Your Password Reset Code`,
        htmlContent,
      );
      console.log(user.email, otp.otp, user.mobile);
      await sendOtpSMS(user.mobile, otp.otp);
    }
    res.json({ message: "OTP re-sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Verify OTP
const verifyUserOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Enter Email Id or Username" });
    }

    const query = email.includes("@") ? { email: email } : { username: email };

    const user = await User.findOne(query);
    if (!user)
      return res.status(401).json({ message: "Invalid Username or Email Id" });

    const record = await EmailOtp.findOne({ email: user.email });

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
  verifyOtp,
  sendPhoneOtp,
  resendPhoneOtp,
  verifyPhoneOtp,
  sendUserOtp,
  resendUserOtp,
  verifyUserOtp,
};
