import express from "express";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";

const router = express.Router();

// --- Helpers ---
const WEEKS_PER_MONTH = 4;   
const WEEKS_PER_YEAR  = 52;
const BIWEEKS_PER_MONTH = 2;
const BIWEEKS_PER_YEAR  = 26;
const MONTHS_PER_YEAR = 12;

/**
 * Returns true if doc.date is in the same month and year as basisDate (UTC-ish).
 */
function isSameMonth(docDate, basisDate) {
  const d = new Date(docDate);
  return d.getUTCFullYear() === basisDate.getUTCFullYear() &&
         d.getUTCMonth() === basisDate.getUTCMonth();
}

function incomeMonthly(amount, freq, date, basisDate) {
  switch (freq) {
    case "weekly":   return amount * WEEKS_PER_MONTH;
    case "biweekly": return amount * BIWEEKS_PER_MONTH;
    case "monthly":  return amount;
    case "one-time": return isSameMonth(date, basisDate) ? amount : 0;
    default:         return 0;
  }
}
function incomeYearly(amount, freq) {
  switch (freq) {
    case "weekly":   return amount * WEEKS_PER_YEAR;
    case "biweekly": return amount * BIWEEKS_PER_YEAR;
    case "monthly":  return amount * MONTHS_PER_YEAR;
    case "one-time": return amount;
    default:         return 0;
  }
}

function expenseMonthly(amount, freq, date, basisDate) {
  switch (freq) {
    case "weekly":   return amount * WEEKS_PER_MONTH;
    case "monthly":  return amount;
    case "one-time": return isSameMonth(date, basisDate) ? amount : 0;
    default:         return 0;
  }
}
function expenseYearly(amount, freq) {
  switch (freq) {
    case "weekly":   return amount * WEEKS_PER_YEAR;
    case "monthly":  return amount * MONTHS_PER_YEAR;
    case "one-time": return amount;
    default:         return 0;
  }
}

/**
 * Collapses docs into label buckets with monthly/yearly totals.
 * Incomes are grouped by `source`, expenses by `category`.
 */
function summarizeDocs(docs, opts) {
  const {
    labelKey,               // "source" for incomes, "category" for expenses
    monthlyFn, yearlyFn,    // functions above
    basisDate               // Date used for one-time items
  } = opts;

  const byLabel = new Map();

  for (const d of docs) {
    const label = d[labelKey] || "Uncategorized";
    const m = monthlyFn(d.amount, d.frequency, d.date, basisDate);
    const y = yearlyFn(d.amount, d.frequency);

    if (!byLabel.has(label)) byLabel.set(label, { label, monthly: 0, yearly: 0 });
    const bucket = byLabel.get(label);
    bucket.monthly += m;
    bucket.yearly  += y;
  }

  // round to 2 decimals
  return [...byLabel.values()].map(b => ({
    label: b.label,
    monthly: Number(b.monthly.toFixed(2)),
    yearly:  Number(b.yearly.toFixed(2)),
  }));
}

// GET /analytics -> page
router.get("/", isAuthenticated, (req, res) => {
  res.render("results", {
    title: "Results",
    
  });
});

// GET /analytics/data?basis=YYYY-MM-01&years=1
router.get("/data", isAuthenticated, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.userId);

    const basis = req.query.basis ? new Date(req.query.basis) : new Date(); // which month to treat one-time items as 'in-month'
    const years = Math.max(1, parseInt(req.query.years || "1", 10));

    const [incomes, expenses] = await Promise.all([
      Income.find({ userId }).lean(),
      Expense.find({ userId }).lean(),
    ]);

    const incomeSummary = summarizeDocs(incomes, {
      labelKey: "source",
      monthlyFn: incomeMonthly,
      yearlyFn:  incomeYearly,
      basisDate: basis,
    });

    const expenseSummary = summarizeDocs(expenses, {
      labelKey: "category",
      monthlyFn: expenseMonthly,
      yearlyFn:  expenseYearly,
      basisDate: basis,
    });

    const monthlyIncome  = incomeSummary.reduce((s, i) => s + i.monthly, 0);
    const monthlyExpense = expenseSummary.reduce((s, e) => s + e.monthly, 0);
    const yearlyIncome   = incomeSummary.reduce((s, i) => s + i.yearly, 0);
    const yearlyExpense  = expenseSummary.reduce((s, e) => s + e.yearly, 0);

    res.json({
      basis: basis.toISOString().slice(0,10),
      years,
      income: incomeSummary,
      expenses: expenseSummary,
      summary: {
        monthlyIncome:  Number(monthlyIncome.toFixed(2)),
        monthlyExpense: Number(monthlyExpense.toFixed(2)),
        yearlyIncome:   Number(yearlyIncome.toFixed(2)),
        yearlyExpense:  Number(yearlyExpense.toFixed(2)),
        horizonTotalIncome:  Number((yearlyIncome * years).toFixed(2)),
        horizonTotalExpense: Number((yearlyExpense * years).toFixed(2)),
      }
    });

  } catch (err) {
    console.error("Analytics data error:", err);
    res.status(500).json({ error: "Failed to compute analytics" });
  }
});

export default router;