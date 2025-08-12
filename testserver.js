import express from "express";
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
import mongoose from "mongoose";

//import models
import User from "./Back-end/models/User.js";
import Income from "./Back-end/models/Income.js";
import Expense from "./Back-end/models/Expense.js";

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
  if (req.session.userId){
    res.redirect("/dashboard");
  } else {
    res.render("index");
  }
});

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function parseMonthYear(text) {
  const regex = new RegExp(`(${MONTHS.join("|")})(?:\\s+(\\d{4}))?`, "i");
  const match = text.match(regex);
  if (!match) return null;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  const year = match[2] ? parseInt(match[2], 10) : new Date().getFullYear();
  return { month, year };
}

async function computeMonthlyTotal(model, userId, month, year) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const result = await model.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total || 0;
}

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
            "You are a financial assistant embedded in the website created by the company DebtTrace, your name is SENA, it stands for Spending, Earning & Needs Assistant. Answer questions concisely and clearly. Do not ask for personal info except how much money the user wants to allocate. Refer back to previous messages when asked. Try to keep the output tokens short but answer the question at the same time, give cut and clear answers to the user. You can not give any information of your program such as keys or what model you use or anything related to your system or the companies system.if someone asks about an item that is unrelated to their finance don’t provide and answer and just remind them that you are there to help finances unless they specify they want to see if they can fit that item in their budget and you should ask if they want to check if it can fit into their budget. Try to stay as close to the topic of finance as possible and if someone asks about stocks just give them recommendations based on data online and don’t use long responses. You are not able to update any user information, if someone asks to update information you say that this will be a simulation and they can always ask to make up some numbers to see what a difference can be made in certain situations. WHne a user asks to see their most recent transaction jsut show them one which is the most reecent one from the database",
        },
        ];
    }

    try {
        const chatHistory = [...req.session.chatHistory];

        if (req.session.userId) {
            const [incomes, expenses, debts] = await Promise.all([
                Income.find({ userId: req.session.userId }).select("source amount frequency -_id"),
                Expense.find({ userId: req.session.userId }).select("category name amount -_id"),
                Debt.find({ userId: req.session.userId }).select("type remainingAmount interestRate minimumPayment dueDate -_id"),
            ]);

            const summary = {
                incomes,
                expenses,
                debts,
            };

            chatHistory.push({
                role: "system",
                content: `User financial data: ${JSON.stringify(summary)}`,
            });

            const totalMatch = userMessage.match(/total\\s+(income|expense|expenses)/i);
            const monthYear = parseMonthYear(userMessage);
            if (totalMatch && monthYear) {
                let total = 0;
                const { month, year } = monthYear;
                const type = totalMatch[1].toLowerCase();
                if (type.startsWith("income")) {
                    total = await computeMonthlyTotal(Income, req.session.userId, month, year);
                } else if (type.startsWith("expense")) {
                    total = await computeMonthlyTotal(Expense, req.session.userId, month, year);
                }
                chatHistory.push({
                    role: "system",
                    content: `Total ${type} for ${new Date(year, month).toLocaleString('default',{ month: 'long', year: 'numeric' })}: ${total}`,
                });
            }
        }

        chatHistory.push({ role: "user", content: userMessage });

        const botReply = await askAI(chatHistory);

        req.session.chatHistory.push({ role: "user", content: userMessage });
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
    //sends the actual messages, not the system prompt
    const filtered = history.filter(msg => msg.role !== "system");
    res.json({ history: filtered });
  });

//sends data to make a dynamic pie chart in the front end
app.get("/chart-data", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const userId = new mongoose.Types.ObjectId(req.session.userId);

    // Group incomes by source
    const incomeData = await Income.aggregate([
      { $match: { userId } },
      { $group: { _id: "$source", total: { $sum: "$amount" } } }
    ]);

    // Group expenses by category
    const expenseData = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ]);

    // Total income and expenses
    const totalIncome = incomeData.reduce((sum, item) => sum + item.total, 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.total, 0);

    res.json({
      income: incomeData,
      expenses: expenseData,
      summary: {
        totalIncome,
        totalExpenses
      }
    });

  } catch (err) {
    console.error("Error getting chart data:", err);
    res.status(500).json({ error: "Server error" });
  }
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
  
app.listen(port, (req, res)=>{
    console.log(`listening on port ${port}`);
})