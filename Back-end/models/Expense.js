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
  frequency: {
    // NEW FIELD
    type: String,
    enum: ["one-time", "weekly", "monthly"],
    default: "one-time",
  },
  nextOccurrence: { type: Date }, // NEW FIELD
  date: { type: Date, default: Date.now },
});
export default mongoose.model("Expense", expenseSchema);
