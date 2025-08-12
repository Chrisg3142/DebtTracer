import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = "public/uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG and PNG files are allowed"), false);
};
const upload = multer({ storage, fileFilter });

// GET /profile
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/auth/login");
    res.render("profile", { user });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.status(500).render("error", { error: "Failed to load profile." });
  }
});

// POST /profile/pic
router.post("/pic", isAuthenticated, upload.single("profilePic"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  try {
    const ext = req.file.mimetype === "image/png" ? ".png" : ".jpg";
    const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await sharp(req.file.buffer).resize(150, 150).jpeg({ quality: 80 }).toFile(filepath);
    const newImagePath = `/uploads/${filename}`;

    const user = await User.findById(req.session.userId);
    if (user.profilePic) {
      const oldPath = path.join("public", user.profilePic);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profilePic = newImagePath;
    await user.save();
    res.redirect("/profile");
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Something went wrong while uploading.");
  }
});

export default router;
