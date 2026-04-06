const User = require("../models/user");
const SubscriptionPlan = require("../models/subscriptionPlan");
const bcrypt = require("bcryptjs");
const {
  matchPassword,
  generateToken,
  getUserAndDescendantNames,
} = require("../utils/utils");
const { uploadStreamToS3 } = require("../config/uploadToS3");
const emailOTP = require("../models/emailOTP");
// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      mobile,
      whatsappMobile,
      website,
      username,
      password,
      address,
      state,
      city,
      workingSchedule,
      serviceState,
      category,
      subCategories,
      about,
      emailVerified,
      phoneVerified,
      subscription,
    } = req.body;

    // Parse JSON fields (because sent via FormData)
    const parsedWorkingSchedule = workingSchedule
      ? JSON.parse(workingSchedule)
      : null;

    const parsedServiceState = serviceState ? JSON.parse(serviceState) : [];
    const parsedCategory = category ? JSON.parse(category) : [];
    const parsedSubCategory = subCategories ? JSON.parse(subCategories) : [];

    // ---- FILE HANDLING ----
    let profileLogo = null;
    let bannerImage = null;
    const catalogues = [];

    if (req.files?.profileLogo?.[0]) {
      profileLogo = await uploadStreamToS3(
        req.files.profileLogo[0],
        "profiles",
      );
    }

    if (req.files?.bannerImage?.[0]) {
      bannerImage = await uploadStreamToS3(req.files.bannerImage[0], "banners");
    }

    if (req.files?.cataloguePdf && req.files?.catalogueBanner) {
      for (let i = 0; i < req.files.cataloguePdf.length; i++) {
        catalogues.push({
          pdf: await uploadStreamToS3(req.files.cataloguePdf[i], "catalogues"),
          banner: await uploadStreamToS3(
            req.files.catalogueBanner[i],
            "catalogues",
          ),
        });
      }
    }

    let subscriptionId = null;

    if (subscription) {
      const plan = await SubscriptionPlan.findOne({
        _id: subscription,
      });

      if (!plan) {
        return res.status(400).json({
          message: "Invalid or inactive subscription plan",
        });
      }

      subscriptionId = plan._id;
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.JWT_SALT),
    );

    const newUser = await User.create({
      name,
      contactPerson,
      email,
      mobile,
      whatsappMobile,
      website,
      username,
      password: hashedPassword,
      address,
      state,
      city,
      serviceState: parsedServiceState,
      category: parsedCategory,
      subCategories: parsedSubCategory,
      workingSchedule: parsedWorkingSchedule,
      about,
      emailVerified,
      phoneVerified,
      subscription: subscriptionId,
      profileLogo,
      bannerImage,
      catalogues,
      parentId: req.userId || null,
      createdBy: req.username,
      modifiedBy: req.username,
    });

    const { password: _, ...userWithoutPassword } = newUser.toObject();

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// EDIT USER
const editUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {
      modifiedBy: req.username,
    };

    // -------- JSON FIELDS --------
    Object.keys(req.body).forEach((key) => {
      if (
        [
          "workingSchedule",
          "serviceState",
          "category",
          "subCategories",
        ].includes(key)
      ) {
        updateData[key] = JSON.parse(req.body[key]);
      } else {
        updateData[key] = req.body[key];
      }
    });

    // -------- PROFILE LOGO --------
    if (req.files?.profileLogo?.length) {
      const url = await uploadStreamToS3(req.files.profileLogo[0], "profiles");
      updateData.profileLogo = url;
    }

    // -------- BANNER IMAGE --------
    if (req.files?.bannerImage?.length) {
      const url = await uploadStreamToS3(req.files.bannerImage[0], "banners");
      updateData.bannerImage = url;
    }

    // -------- CATALOGUES --------
    const existingCatalogues = req.body.existingCatalogues
      ? JSON.parse(req.body.existingCatalogues)
      : [];

    const newCatalogues = [];

    if (req.files?.cataloguePdf && req.files?.catalogueBanner) {
      for (let i = 0; i < req.files.cataloguePdf.length; i++) {
        newCatalogues.push({
          pdf: await uploadStreamToS3(req.files.cataloguePdf[i], "catalogues"),
          banner: await uploadStreamToS3(
            req.files.catalogueBanner[i],
            "catalogues",
          ),
        });
      }
    }

    updateData.catalogues = [...existingCatalogues, ...newCatalogues];

    // -------- SUBSCRIPTION VALIDATION --------
    if (updateData.subscription) {
      const plan = await SubscriptionPlan.findOne({
        _id: updateData.subscription,
      });

      if (!plan) {
        return res.status(400).json({
          message: "Invalid or inactive subscription plan",
        });
      }

      updateData.subscription = plan._id;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    const { password, ...userWithoutPassword } = updatedUser.toObject();

    res.json({
      message: "User updated successfully",
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    let users = await User.findOne({
      _id: req.params.userId,
    })
      .select("-password")
      .populate("subscription");
    let parentName = null;
    const parent = await User.findById(users.parentId).select("name");
    parentName = parent?.name || null;
    const usersWithParent = { ...users.toObject(), parentName };

    res.json({ users: usersWithParent });
  } catch (err) {
    console.error("Error fetching users recursively:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;

    const query = loginIdentifier.includes("@")
      ? { email: loginIdentifier }
      : { username: loginIdentifier };

    const user = await User.findOne(query).populate("parent");
    if (!user)
      return res.status(401).json({ message: "Invalid Username or Email Id" });

    const isMatch = await matchPassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid Passowrd" });

    const token = generateToken(user);

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
      tokenExpDays: process.env.TOKEN_VALID_DAYS,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL CHILD USERS (RECURSIVE)
const getAllChildUsers = async (req, res) => {
  try {
    const parentId = req.userId;
    if (!parentId)
      return res.status(400).json({ message: "User ID is required" });
    const { search = "", skip = "0", take = "25" } = req.body;
    const parsedSkip = parseInt(skip, 10) || 0;
    const parsedTake = parseInt(take, 10) || 25;

    const descendantUsernames = await getUserAndDescendantNames(parentId);

    // 🔍 Search condition
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { contactPerson: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
            { whatsappMobile: { $regex: search, $options: "i" } },
            { website: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const filter = {
      username: { $in: descendantUsernames },
      ...searchQuery,
    };

    // ✅ Total count (important for paginator)
    const totalCount = await User.countDocuments(filter);

    const users = await User.find(filter, {
      name: 1,
      contactPerson: 1,
      email: 1,
      mobile: 1,
      username: 1,
      address: 1,
    })
      .populate({
        path: "subscription",
        select: "name",
      })
      .skip(parsedSkip)
      .limit(parsedTake)
      .sort({ createdAt: -1 });

    res.status(201).json({
      users,
      totalCount,
    });
  } catch (err) {
    console.error("Error fetching users recursively:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const userId = req.userId;
    const userEmail = req.userEmail;

    if (email !== userEmail)
      return res.status(403).json({ message: "Unauthorized" });
    if (!email || !oldPassword || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email, _id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await matchPassword(oldPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Old password is incorrect" });

    const hashedNewPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.JWT_SALT),
    );

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE USER (SOFT DELETE)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ id: userId, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT
const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Enter Email Id or Username" });
    }

    const query = email.includes("@") ? { email: email } : { username: email };

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    const record = await emailOTP.findOne({ email: user.email });
    if (!record || record.otp !== Number(otp)) {
      return res.status(400).json({ message: "Email id is not verified" });
    }

    const hashedNewPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.JWT_SALT),
    );

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllChildUsers,
  changePassword,
  deleteUser,
  editUser,
  logoutUser,
  getUserById,
  forgotPassword,
};
