import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import Income from "../models/Income.js";

const router = express.Router();

// Helper function for ownership verification
const verifyOwnership = async (incomeId, userId) => {
  const income = await Income.findOne({ _id: incomeId, userId });
  return income !== null;
};

// GET all earnings
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const earnings = await Income.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    const alert = req.session.alert;

    // Clear the alert after showing it
    if (req.session.alert) {
      delete req.session.alert;
    }

    res.render("earningss", {
      earnings,
      title: "Earnings",
      formData: {},
      user: req.user || null,
      alert, // Pass the alert to the template
    });
  } catch (err) {
    res.status(500).render("error", {
      error: err.message,
      alert: {
        type: "danger",
        message: "Failed to load earnings: " + err.message,
      },
    });
  }
});

// POST new earning
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { source, amount, date, frequency } = req.body;

    // Basic validation
    if (!source || !amount || !date || !frequency) {
      throw new Error("All fields are required");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Amount must be a positive number");
    }

    await Income.create({
      source,
      amount: parsedAmount,
      date,
      frequency,
      userId: req.session.userId,
    });

    req.session.alert = {
      type: "success",
      message: "Earning added successfully",
    };
    res.redirect("/earnings");
  } catch (err) {
    const earnings = await Income.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    res.render("earningss", {
      earnings,
      alert: {
        type: "danger",
        message: "Failed to add earning: " + err.message,
      },
      formData: req.body,
      title: "Earnings",
    });
  }
});

// PUT update earning
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { source, amount, frequency } = req.body;

    // Validate input
    if (!source || !amount) {
      return res.status(400).json({
        success: false,
        error: "Source and amount are required",
        alert: {
          type: "danger",
          message: "Source and amount are required",
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

    const updatedIncome = await Income.findByIdAndUpdate(
      req.params.id,
      {
        source,
        amount: parsedAmount,
        frequency: frequency || undefined,
      },
      { new: true }
    );

    res.json({
      success: true,
      updatedIncome,
      alert: {
        type: "success",
        message: "Income updated successfully",
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


// DELETE earning
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    // Verify ownership before deleting
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        error: "Income not found or you don't have permission",
      });
    }

    res.json({ 
      success: true,
      alert: {
        type: "success",
        message: "Income deleted successfully"
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
