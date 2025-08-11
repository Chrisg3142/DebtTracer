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
    const userId = req.session.userId;

    // Pull both collections in parallel
    const [expenses, earnings] = await Promise.all([
      Expense.find({ userId }).sort({ date: -1 }).lean(),
      Income.find({ userId }).sort({ date: -1 }).lean(),
    ]);

    // Ensure expected fields are present with sane defaults (defensive)
    const safeExpenses = expenses.map(e => ({
      _id: e._id,
      category: e.category || "Uncategorized",
      name: e.name || "",
      amount: Number(e.amount) || 0,
      date: e.date ? new Date(e.date) : new Date(),
      isRecurring: !!e.isRecurring,
      frequency: (e.frequency || (e.isRecurring ? "monthly" : "one-time")).toLowerCase(),
      nextOccurrence: e.nextOccurrence ? new Date(e.nextOccurrence) : null,
    }));

    const safeEarnings = earnings.map(income => ({
      _id: income._id,
      source: income.source || "Income",
      amount: Number(income.amount) || 0,
      date: income.date ? new Date(income.date) : new Date(),
      frequency: (income.frequency || "monthly").toLowerCase(),
    }));

    res.render("results", {
      title: "Results",
      user: req.user || null,
      expenses: safeExpenses,
      earnings: safeEarnings,
    });
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