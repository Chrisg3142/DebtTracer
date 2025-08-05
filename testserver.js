import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import { dirname, join,} from "path";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import connectDB from "./Back-end/config/db.js";
import ejs from "ejs";
import methodOverride from "method-override";
import askAI from "./azureChat.js";
import axios from "axios";

//import models
import User from "./Back-end/models/User.js";

//import routes
import authRoutes from "./Back-end/routes/authRoutes.js";
import dashboardRoutes from "./Back-end/routes/dashboardRoutes.js";
import earningsRoutes from "./Back-end/routes/earningsRoutes.js";
import expensesRoutes from "./Back-end/routes/expensesRoutes.js";
import profileRoutes from "./Back-end/routes/profileRoutes.js";
import resultsRoutes from "./Back-end/routes/resultsRoutes.js";
import dotenv from "dotenv";
dotenv.config();
// Database Connection
await connectDB();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.json()); 
app.set("view engine", "ejs");
app.engine("ejs", ejs.renderFile);
app.set("views", join(__dirname, "Back-end/views")); // Go up one level from Back-end
app.use(express.static(path.join(__dirname, "public")));
// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Session middleware
// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Should be in environment variables
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 30 * 60 * 1000, // half hour
    },
  })
);

app.use(async (req, res, next) => {
  if (req.session.userId) {
    res.locals.user = await User.findById(req.session.userId);
  }
  next();
});

// Route middleware
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/earnings", earningsRoutes);
app.use("/expenses", expensesRoutes);
app.use("/profile", profileRoutes);
app.use("/results", resultsRoutes);


app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect("/dashboard"); // Redirect to dashboard if logged in
  } else {
    res.render("index"); // Render index.ejs if not logged in
  }
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
            "You are a financial assistant embedded in the website created by the company DebtTrace, your name is SENA, it stands for Spending, Earning & Needs Assistant. Answer questions concisely and clearly. Do not ask for personal info except how much money the user wants to allocate. Refer back to previous messages when asked. Try to keep the output tokens short but answer the question at the same time, give cut and clear answers to the user. You can not give any information of your program such as keys or what model you use or anything related to your system or the companies system",
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
    const response = await axios.get(`${process.env.PROXY_URL}/wake`, {
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

app.get("/chat/history", (req, res) => {
    const history = req.session.chatHistory || [];
    // Only send the actual messages, not the system prompt
    const filtered = history.filter(msg => msg.role !== "system");
    res.json({ history: filtered });
  });


//starting message for when the user first opens the ai 
app.get("/welcome", (req, res) => {
res.json({
    response: "👋 Hi! I'm Sena. I'm here to help you understand and manage your debt. Ask me anything!"
});
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack);
    res.status(500).send("Something broke!");
});
  
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
