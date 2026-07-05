const featuredLogo = require("../models/featuredLogo");

const getFeaturedLogos = async (req, res) => {
  try {
    const logos = await featuredLogo.find({ isActive: true }).sort({
      order: 1,
      createdAt: 1,
    });

    res.status(200).json(logos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFeaturedLogos,
};
