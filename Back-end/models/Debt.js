import mongoose from "mongoose";

const debtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["Credit Card", "Student Loan", "Mortgage", "Personal Loan"],
    required: true,
  },
  initialAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  minimumPayment: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Debt", debtSchema);
