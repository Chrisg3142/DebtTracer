import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render("profile", { user });
  } catch (err) {
    res.status(500).render("error", { error: err.message });
  }
});

export default router;