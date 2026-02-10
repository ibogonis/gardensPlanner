const express = require("express");
const passport = require("../config/passport");
const { oauthSuccess, logout } = require("../controllers/authController");
const router = express.Router();

router.post("/logout", logout);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  oauthSuccess,
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] }),
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  oauthSuccess,
);

module.exports = router;
