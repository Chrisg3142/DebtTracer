import express from "express";

app.get("/dashboard", async (req, res) => {
  try {
    const userId = req.session.userId; // Assuming you have authentication
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
