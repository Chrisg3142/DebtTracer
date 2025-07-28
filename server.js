import express from "express";
// import axios from "axios";
import bodyParser from "body-parser";
import { connectToDatabase } from "./db.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");
// Specify the views directory (default is './views')
app.set("views", "./views");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const movie = await db
      .collection("movies")
      .findOne({ title: "Back to the Future" });

    res.render("index.ejs", {
      title: "Movie Details",
      movie: movie || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { error: "Failed to load movie" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
