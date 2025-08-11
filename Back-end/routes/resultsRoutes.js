// routes/results.js
import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";

const router = express.Router();

/**
 * GET /results
 * Renders the results page with earnings and expenses for the current user.
 * The EJS handles all scaling/visuals on the client side.
 */
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    const income = await Income.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    // Assuming you want to render both expenses and income in the same view
    res.render("results", { expenses, income });
  } catch (err) {
    console.error("Failed to load results:", err);
    res.status(500).render("error", { error: err.message });
  }
});

/**
 * Optional: GET /results/data
 * Returns the same data as JSON. Handy if you later add a “refresh” button.
 */
router.get("/data", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const [expenses, earnings] = await Promise.all([
      Expense.find({ userId }).sort({ date: -1 }).lean(),
      Income.find({ userId }).sort({ date: -1 }).lean(),
    ]);

    res.json({
      success: true,
      expenses,
      earnings,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;