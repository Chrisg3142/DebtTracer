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

//Middleware
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

//this is a set up for the ai 
//this is for the messages between the user and the ai system set up within the website
app.post("/ask", async (req, res) => {
  const userMessage = req.body.message;
  //this is for the ai to go back to old messages and access them for future conversation 
  if (!req.session.chatHistory) {
    req.session.chatHistory = [
      {
        role: "system",
        content:
          "You are a financial assistant embedded in the website created by the company DebtTrace, your name is SENA, it stands for Spending, Earning & Needs Assistant. Answer questions concisely and clearly. Do not ask for personal info except how much money the user wants to allocate. Refer back to previous messages when asked.",
      },
    ];
  }
  //adding the messages to a array that the ai can access and talk about later on 
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
//wakes up the ai so we dont get an error after starting up the page
app.get("/wake", async (req, res) => {
  try {
    //call proxy server's /wake endpoint with the required token
    const response = await axios.get(`${process.env.PROXY_SERVER_URL}/wake`, {
      headers: {
        "x-api-token": process.env.PROXY_API_TOKEN, // your secret token
      },
    });

    res.json({ status: "AI service woken up via proxy" });
  } catch (error) {
    console.error("Backend wake error:", error.response?.data || error.message);
    res.status(500).json({ error: "Wake request failed." });
  }
});


//starting message for when the user first opens the ai 
app.get("/welcome", (req, res) => {
  res.json({
    response: "👋 Hi! I'm Sena. I'm here to help you understand and manage your debt. Ask me anything!"
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
