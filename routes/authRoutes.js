const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  getAllChildUsers,
  editUser,
  changePassword,
  deleteUser,
  getUserById,
  forgotPassword,
} = require("../controllers/authController.js");

const { auth } = require("../middlewares/auth.js");
const {
  sendOtp,
  resendOtp,
  verifyOtp,
  sendPhoneOtp,
  resendPhoneOtp,
  verifyPhoneOtp,
  sendUserOtp,
  resendUserOtp,
  verifyUserOtp,
} = require("../controllers/otp.js");
const {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} = require("../controllers/subscriptionController.js");
const { upload } = require("../middlewares/upload.js");

router.post(
  "/register",
  auth,
  upload.fields([
    { name: "profileLogo", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "cataloguePdf", maxCount: 10 },
    { name: "catalogueBanner", maxCount: 10 },
  ]), // ⬅️ allows profileLogo, bannerImage, catalogues
  registerUser,
);

router.put(
  "/edit-user/:userId",
  auth,
  upload.fields([
    { name: "profileLogo", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "cataloguePdf", maxCount: 10 },
    { name: "catalogueBanner", maxCount: 10 },
  ]),
  editUser,
);
router.post("/login", loginUser);
router.get("/get-user/:userId", getUserById);
router.post("/parent", auth, getAllChildUsers);
router.delete("/delete-user/:userId", auth, deleteUser);
router.put("/change-password", auth, changePassword);
router.put("/forgot-password", forgotPassword);
router.post("/logout", logoutUser);
router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/send-phone-otp", sendPhoneOtp);
router.post("/resend-phone-otp", resendPhoneOtp);
router.post("/verify-phone-otp", verifyPhoneOtp);
router.post("/send-user-otp", sendUserOtp);
router.post("/resend-user-otp", resendUserOtp);
router.post("/verify-user-otp", verifyUserOtp);

router.post("/create-plan", auth, createPlan);
router.get("/get-plan", auth, getPlans);
router.get("/get-plan/:id", auth, getPlanById);
router.put("/update-plan/:id", auth, updatePlan);
router.delete("/delete-plan/:id", auth, deletePlan);

module.exports = router;
