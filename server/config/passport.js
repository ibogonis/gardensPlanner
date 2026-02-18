const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { oauthLogin } = require("../controllers/authController");

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// --- Google ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await oauthLogin({
          email: profile._json.email,
          name: profile._json.name,
          picture: profile._json.picture,
          provider: "google",
        });
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    },
  ),
);

// --- Facebook ---
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ["id", "emails", "name", "picture.type(large)"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await oauthLogin({
            email: profile.emails?.[0]?.value,
            name: `${profile.name?.givenName ?? ""} ${profile.name?.familyName ?? ""}`.trim(),
            picture: profile.photos?.[0]?.value,
            provider: "facebook",
          });

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      },
    ),
  );
} else {
  console.warn("⚠️ Facebook OAuth is disabled (missing env vars)");
}
module.exports = passport;
