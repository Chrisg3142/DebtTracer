import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ make sure we target the real /public/uploads at the project root
const uploadDir = path.resolve(__dirname, "..", "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer (in-memory) + guards
const storage = multer.memoryStorage();
const allowedTypes = new Set(["image/jpeg", "image/png"]);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (allowedTypes.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPEG and PNG files are allowed"));
  },
});

// Surface Multer errors nicely
const handleUpload = (req, res, next) => {
  upload.single("profilePic")(req, res, (err) => {
    if (!err) return next();
    const msg =
      err.message === "File too large"
        ? "Image is too large (max 5MB)."
        : err.message || "Invalid image upload.";
    return res.status(400).render("error", { error: msg });
  });
};

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
router.post("/pic", isAuthenticated, handleUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).render("error", { error: "No file uploaded." });
  }

  try {
    const isPng = req.file.mimetype === "image/png";
    const ext = isPng ? ".png" : ".jpg";
    const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const absFilepath = path.join(uploadDir, filename);

    // Sharp pipeline (square crop, attention focus)
    let pipeline = sharp(req.file.buffer).resize({
      width: 512,
      height: 512,
      fit: "cover",
      position: "attention",
    });

    pipeline = isPng
      ? pipeline.png({ compressionLevel: 9 })
      : pipeline.jpeg({ quality: 80, mozjpeg: true });

    await pipeline.toFile(absFilepath);

    const newImagePath = `/uploads/${filename}`;

    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/auth/login");

    // Delete old file if it lives in /public/uploads
    if (user.profilePic && user.profilePic.startsWith("/uploads/")) {
      const oldRelative = user.profilePic.replace(/^\//, ""); // remove leading slash
      const oldAbs = path.resolve(path.join(__dirname, "..", "..", "public", oldRelative));
      if (oldAbs.startsWith(uploadDir) && fs.existsSync(oldAbs)) {
        try {
          fs.unlinkSync(oldAbs);
        } catch (e) {
          console.warn("Failed to delete old profile image:", e.message);
        }
      }
    }

    user.profilePic = newImagePath;
    await user.save();

    res.redirect(`/profile?v=${Date.now()}`); // cache-bust
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).render("error", { error: "Something went wrong while uploading." });
  }
});

// PATCH /profile/update  (name/email)
router.patch("/update", isAuthenticated, async (req, res) => {
  try {
    const { name, email } = req.body;

    const updates = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof email === "string" && email.trim())
      updates.email = email.trim().toLowerCase();

    if (!Object.keys(updates).length) {
      return res.status(400).render("error", { error: "Nothing to update." });
    }

    // Prevent duplicate emails
    if (updates.email) {
      const exists = await User.findOne({
        email: updates.email,
        _id: { $ne: req.session.userId },
      }).lean();
      if (exists) {
        return res.status(400).render("error", { error: "Email already in use." });
      }
    }

    await User.findByIdAndUpdate(
      req.session.userId,
      { $set: updates },
      { new: true, runValidators: true, context: "query" }
    );

    return res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).render("error", { error: "Failed to update profile." });
  }
});

// PATCH /profile/password
router.patch("/password", isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).render("error", { error: "All fields are required." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).render("error", { error: "New passwords do not match." });
    }
    if (newPassword.length < 8) {
      return res.status(400).render("error", { error: "Password must be at least 8 characters." });
    }

    // Load user with password field
    const user = await User.findById(req.session.userId).select("+password");
    if (!user) return res.redirect("/auth/login");

    // Verify current password
    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      return res.status(400).render("error", { error: "Current password is incorrect." });
    }

    // Update -> triggers pre('save') hash
    user.password = newPassword;
    await user.save();

    // End session and require re-login
    req.session.destroy(() => {
      res.redirect("/auth/login?passwordUpdated=1");
    });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).render("error", { error: "Failed to update password." });
  }
});

export default router;
