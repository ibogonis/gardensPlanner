require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API is running"));

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/mydb")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
