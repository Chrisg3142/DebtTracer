import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import Movie from "./models/Movie.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Database Connection
mongoose
  .connect(
    "mongodb+srv://debtTracer:Secret123@debttracer.n8eexb1.mongodb.net/",

    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    }
  )
  .then(() => console.log("Connected to MongoDB via Mongoose"))
  .catch((err) => console.error("Connection error:", err));

app.set("view engine", "ejs");
app.set("views", "./views");
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

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
