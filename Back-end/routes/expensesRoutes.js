import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import Expense from "../models/Expense.js";

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    res.render("expenses", {
      expenses,
      title: "Expenses",
      formData: {},
      user: req.user || null,
    });
  } catch (err) {
    res.status(500).render("error", { error: err.message });
  }
});

router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { category, name, amount, date, isRecurring, frequency } = req.body;

    const expenseData = {
      category,
      name,
      amount: parseFloat(amount),
      date,
      isRecurring: isRecurring === "on",
      userId: req.session.userId,
      frequency: isRecurring === "on" ? frequency : "one-time",
    };

    // Set next occurrence if recurring
    if (expenseData.isRecurring) {
      expenseData.nextOccurrence = calculateNextDate(date, frequency);
    }

    await Expense.create(expenseData);
    res.redirect("/expenses?success=Expense+added+successfully");
  } catch (err) {
    // ... (keep existing error handling)
  }
});

// Helper function (add to top of file)
function calculateNextDate(currentDate, frequency) {
  const date = new Date(currentDate);
  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  return date;
}

router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.redirect("/expenses?success=Expense+deleted");
  } catch (err) {
    res.redirect("/expenses?error=Failed+to+delete+expense");
  }
});

export default router;
