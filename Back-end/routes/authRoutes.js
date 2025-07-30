import express from "express";
import {
  renderRegister,
  registerUser,
  renderLogin,
  loginUser,
  logoutUser,
} from "../controllers/authController.js";

const router = express.Router();

// Registration routes
router.get("/register", isGuest, renderRegister);
router.post("/register", registerUser);

// In authRoutes.js
import { isGuest } from "../middleware/authMiddleware.js";

// Login routes
router.get("/login", isGuest, renderLogin);
router.post("/login", loginUser);

// Logout route
router.get("/logout", logoutUser);

export default router;
