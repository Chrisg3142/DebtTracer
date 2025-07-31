import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import Expense from "../models/Expense.js";

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.session.userId }).sort({
      date: -1,
    });
    res.render("expenses", { expenses });
  } catch (err) {
    res.status(500).render("error", { error: err.message });
  }
});

export default router;
