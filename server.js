import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import askAI from "./azureChat.js";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { response: null });
});

app.post("/ask", async (req, res) => {
  const question = req.body.question;
  const answer = await askAI(question);
  res.render("index", { response: answer });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
