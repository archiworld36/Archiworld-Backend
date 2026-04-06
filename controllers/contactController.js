// controllers/contactController.js

const contactUs = require("../models/contactUs");
const sendMailFromGmail = require("../utils/mailService");

const submitContactForm = async (req, res) => {
  try {
    const { enquiryType, firstName, lastName, email, phone, message } =
      req.body;

    // ✅ Validation
    if (!enquiryType || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // ✅ Save to DB
    const newContact = await contactUs.create({
      enquiryType,
      firstName,
      lastName,
      email,
      phone,
      message,
    });

    // ✅ Email HTML Template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 10px;">
        <h2>Thank you for contacting Archiworld</h2>
        <p>Hi ${firstName} ${lastName},</p>
        <p>We have received your enquiry regarding <b>${enquiryType}</b>.</p>
        <p>Our team will get back to you shortly.</p>
        <hr/>
        <h3>Your Details:</h3>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b> ${
          message ? message.replace(/\n/g, "<br/>") : "N/A"
        }</p>
        <br/>
        <p>Regards,<br/>Archiworld Team</p>
        <hr/>
        <p style="font-size: 13px; color: #555;">
            <em>This is a system-generated email. Please do not reply to this email.<br/>
            For any support, feel free to reach us at <strong>sales@archiworld.in</strong>.</em>
        </p>
      </div>
    `;

    // ✅ Send Email
    await sendMailFromGmail(
      [email, "pranavsingh@archiworld.in"],
      "We received your enquiry - Archiworld",
      htmlContent,
    );

    return res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("Contact Form Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = { submitContactForm };
