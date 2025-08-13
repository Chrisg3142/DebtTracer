import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import Expense from "../models/Expense.js";

const router = express.Router();

// Helper function for ownership verification
const verifyOwnership = async (expenseId, userId) => {
  const expense = await Expense.findOne({ _id: expenseId, userId });
  return expense !== null;
};

// Helper function for calculating next occurrence date
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

// GET all expenses
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    const alert = req.session.alert;

    // Clear the alert after showing it
    if (req.session.alert) {
      delete req.session.alert;
    }

    res.render("expenses", {
      expenses,
      title: "Expenses",
      formData: {},
      // user: req.user || null,
      alert,
    });
  } catch (err) {
    res.status(500).render("error", {
      error: err.message,
      alert: {
        type: "danger",
        message: "Failed to load expenses: " + err.message,
      },
    });
  }
});

// POST new expense
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { category, name, amount, date, isRecurring, frequency } = req.body;

    // Basic validation
    if (!category || !name || !amount || !date) {
      throw new Error("All required fields must be filled");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      throw new Error("Amount must be a valid number");
    }

    const [year, month, day] = date.split("-");
    const localDate = new Date(year, month - 1, day);

    const expenseData = {
      category,
      name,
      amount: parsedAmount,
      date: localDate,
      isRecurring: isRecurring === "on",
      userId: req.session.userId,
      frequency: isRecurring === "on" ? frequency : "one-time",
    };

    // Set next occurrence if recurring
    if (expenseData.isRecurring) {
      expenseData.nextOccurrence = calculateNextDate(localDate, frequency);
    }

    await Expense.create(expenseData);

    req.session.alert = {
      type: "success",
      message: "Expense added successfully",
    };
    res.redirect("/expenses");
  } catch (err) {
    const expenses = await Expense.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    res.render("expenses", {
      expenses,
      alert: {
        type: "danger",
        message: "Failed to add expense: " + err.message,
      },
      formData: req.body,
      title: "Expenses",
    });
  }
});

// PUT update expense
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { category, name, amount, isRecurring, frequency } = req.body;

    // Validate input
    if (!category || !name || !amount) {
      return res.status(400).json({
        success: false,
        error: "Category, name and amount are required",
        alert: {
          type: "danger",
          message: "Category, name and amount are required",
        },
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount format",
        alert: {
          type: "danger",
          message: "Invalid amount format",
        },
      });
    }

    // Verify ownership
    const isOwner = await verifyOwnership(req.params.id, req.session.userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to edit this record",
        alert: {
          type: "danger",
          message: "You don't have permission to edit this record",
        },
      });
    }

    const updateData = {
      category,
      name,
      amount: parsedAmount,
      isRecurring: isRecurring === "on",
      frequency: isRecurring === "on" ? frequency : "one-time",
    };

    // Update next occurrence if recurring
    if (updateData.isRecurring) {
      const expense = await Expense.findById(req.params.id);
      updateData.nextOccurrence = calculateNextDate(expense.date, frequency);
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      updatedExpense,
      alert: {
        type: "success",
        message: "Expense updated successfully",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      alert: {
        type: "danger",
        message: error.message,
      },
    });
  }
});

// DELETE expense
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    // Verify ownership before deleting
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found or you don't have permission",
      });
    }

    res.json({ 
      success: true,
      alert: {
        type: "success",
        message: "Expense deleted successfully"
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      alert: {
        type: "danger",
        message: error.message
      }
    });
  }
});

export default router;