const User = require("../models/User");

exports.oauthLogin = async ({ email, name, picture, provider }) => {
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      username: name,
      email,
      avatar: picture || "",
      provider,
    });
  }

  return user;
};

const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.oauthSuccess = (req, res) => {
  if (!req.user) {
    return res.redirect("/login?error=oauth_failed");
  }

  const token = generateToken(req.user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(process.env.CLIENT_URL);
};

exports.logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  res.clearCookie("token", cookieOptions);
  return res.status(200).json({ message: "Logged out successfully" });
};
