// routes/contactRoutes.js
const express = require("express");
const router = express.Router();
const { submitContactForm } = require("../controllers/contactController.js");

router.post("/contact-us", submitContactForm);

module.exports = router;
