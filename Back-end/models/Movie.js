// models/Movie.js
import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: Number,
  director: String,
  // Add other fields as needed
});

export default mongoose.model("Movie", movieSchema);
