import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";

const router = express.Router();

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

    res.status(500).render("error", { error: err.message });
  }
});

export default router;