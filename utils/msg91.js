const axios = require("axios");

const OTP_STORE = new Map(); // Replace with DB/Redis in production

const sendOtp = async () => {
  console.log("sendOtp API hit"); // <-- must appear in terminal

  try {
    const mobile = 8930995291;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    OTP_STORE.set(mobile, {
      otp,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    const response = await axios.post(
      "https://control.msg91.com/api/v5/flow",
      {
        mobile: `91${mobile}`,
        template_id: "69638f71064b0000581be2a4",
      },
      {
        headers: {
          authkey: "487602AtwhgoUS696390eeP1",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("MSG91 Response:", response.data);
  } catch (err) {
    console.error("MSG91 Error:", err?.response?.data || err.message);
  }
};

sendOtp();
