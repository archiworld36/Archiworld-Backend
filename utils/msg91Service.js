const axios = require("axios");

const sendOtpSMS = async (mobile, otp) => {
  try {
    const response = await axios.post(
      "https://control.msg91.com/api/v5/flow",
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        recipients: [
          {
            mobiles: mobile,
            OTP: otp,
          },
        ],
      },
      {
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authkey: process.env.MSG91_AUTH_KEY,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("MSG91 Error:", error?.response?.data || error.message);
    throw new Error("SMS sending failed");
  }
};

module.exports = sendOtpSMS;
