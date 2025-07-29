import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";
import Income from "./models/Income.js";
import Expense from "./models/Expense.js";
import Movie from "./models/Movie.js";
import Debt from "./models/Debt.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Database Connection
mongoose
  .connect(
    "mongodb+srv://debtTracer:Secret123@debttracer.n8eexb1.mongodb.net/debtTracer?retryWrites=true&w=majority&appName=debtTracer"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error:", err));

app.set("views", join(__dirname, "../views")); // Go up one level from Back-end
app.use(express.static(join(__dirname, "../public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Updated route using Mongoose
app.get("/", async (req, res) => {
  try {
    const movie = await Movie.findOne({ title: "Back to the Future" });
    console.log(movie);

    res.render("index.ejs", {
      title: "Movie Details",
      movie: movie || null, // movie will be null if not found
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", {
      error: "Failed to load movie",
      message: err.message, // More detailed error
    });
  }
});
app.get("/dashboard", async (req, res) => {
  try {
    const userId = "65a1b2c3d4e5f6a7b8c9d001"; // Assuming you have authentication
    const user = await User.findById(userId);

    const incomes = await Income.find({ userId });
    const expenses = await Expense.find({ userId });

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Combine recent transactions
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

    res.render("dashboard.ejs", {
      user,
      totalIncome,
      totalExpenses,
      transactions,
    });
  } catch (err) {
    res.status(500).render("error", { error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
