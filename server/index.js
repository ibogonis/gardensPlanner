require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const planRoutes = require("./routes/planRoutes");

const app = express();

// Fail fast instead of buffering queries when MongoDB is down/unreachable.
mongoose.set("bufferCommands", false);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

// Passport (БЕЗ session)
app.use(passport.initialize());

app.use("/api/plans", planRoutes);
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5001;

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mydb";

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server started on ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB initial connection failed:", err);
    process.exit(1);
  });
