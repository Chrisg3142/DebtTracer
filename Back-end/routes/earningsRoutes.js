import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import Income from "../models/Income.js";

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const earnings = await Income.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    res.render("earnings", {
      earnings, // Changed from 'incomes' to 'earnings'
      title: "Earnings",
      formData: {},
      user: req.user || null,
    });
  } catch (err) {
    res.status(500).render("error", { error: err.message });
  }
});

router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { source, amount, date, frequency } = req.body; // Add frequency here

    await Income.create({
      source,
      amount: parseFloat(amount),
      date,
      frequency, // Include frequency in the creation
      userId: req.session.userId,
    });

    res.redirect("/earnings?success=Earning+added+successfully");
  } catch (err) {
    const earnings = await Income.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    res.render("earnings", {
      earnings,
      error: "Failed to add earning: " + err.message,
      formData: req.body,
      title: "Earnings",
    });
  }
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.redirect("/earnings?success=Earning+deleted");
  } catch (err) {
    res.redirect("/earnings?error=Failed+to+delete+earning");
  }
});

export default router;
