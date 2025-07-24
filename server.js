import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import askAI from "./azureChat.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_change_me",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", (req, res) => {
  res.render("index", { messages: [] });
});

//this is for the messages between the user and the ai system set up within the website
app.post("/ask", async (req, res) => {
  const userMessage = req.body.message;
  if (!req.session.chatHistory) {
    req.session.chatHistory = [
      {
        role: "system",
        content:
          "You are a financial assistant embedded in the website created by the company DebtTracer. Answer questions concisely and clearly. Do not ask for personal info except how much money the user wants to allocate. Refer back to previous messages when asked.",
      },
    ];
  }
  req.session.chatHistory.push({ role: "user", content: userMessage });

  try {
    const botReply = await askAI(req.session.chatHistory);
    req.session.chatHistory.push({ role: "assistant", content: botReply });

    res.json({ response: botReply });
  } catch (error) {
    console.error("AI API error:", error);
    res.status(500).json({ response: "Sorry, something went wrong." });
  }
  
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
