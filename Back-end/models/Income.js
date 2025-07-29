import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  source: { type: String, required: true },
  amount: { type: Number, required: true },
  frequency: {
    type: String,
    enum: ["weekly", "biweekly", "monthly"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Income", incomeSchema);
