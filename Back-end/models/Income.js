import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  source: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    set: (v) => parseFloat(v.toFixed(2)), // Ensures 2 decimal places
  },
  frequency: {
    type: String,
    enum: ["one-time", "weekly", "biweekly", "monthly"],
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true, // Cannot be changed after creation
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
incomeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Income", incomeSchema);
