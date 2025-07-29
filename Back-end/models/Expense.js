import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: {
    type: String,
    enum: ["Housing", "Food", "Transportation", "Utilities", "Entertainment"],
    required: true,
  },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  isRecurring: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Expense", expenseSchema);
