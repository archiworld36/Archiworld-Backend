const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Mongoose model

// Compare entered password with hashed password
async function matchPassword(enteredPassword, hashedPassword) {
  return await bcrypt.compare(enteredPassword, hashedPassword);
}

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.username,
      parent: user.parent,
      parentId: user.parentId,
      profileLogo: user.profileLogo,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: `${process.env.TOKEN_VALID_DAYS}d`,
    }
  );
};

// Get user + all descendant usernames recursively
const getUserAndDescendantNames = async (parentId) => {
  const result = [];

  // include self
  const parentUser = await User.findById(parentId).select("username");
  if (parentUser) {
    result.push(parentUser.username);
  }

  const fetchChildren = async (currentParentId) => {
    const children = await User.find(
      { parentId: currentParentId },
      { _id: 1, username: 1 }
    );

    for (const child of children) {
      result.push(child.username);
      await fetchChildren(child._id);
    }
  };

  await fetchChildren(parentId);

  return result;
};

module.exports = { generateToken, matchPassword, getUserAndDescendantNames };
