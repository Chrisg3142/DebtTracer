import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    const incomes = await Income.find({ userId });
    const expenses = await Expense.find({ userId });

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const transactions = [
      ...incomes.map((i) => ({
        type: "income",
        description: i.source,
        amount: i.amount,
        date: i.createdAt,
      })),
      ...expenses.map((e) => ({
        type: "expense",
        description: e.name,
        amount: -e.amount,
        date: e.date,
      })),
    ]
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);

    res.render("dashboard", {
      user,
      totalIncome,
      totalExpenses,
      transactions,
    });
  } catch (err) {
    res.status(500).render("error", { error: err.message });
  }
});

export default router;
