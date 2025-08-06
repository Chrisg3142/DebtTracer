import express from "express";
import bodyParser from "body-parser";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";
import ejs from "ejs";
import methodOverride from "method-override";
import "dotenv/config";
import connectDB from "./config/db.js";
import resultsRoutes from "./routes/resultsRoutes.js";

//import models
import User from "./models/User.js";

//import routes
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import earningsRoutes from "./routes/earningsRoutes.js";
import expensesRoutes from "./routes/expensesRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Database Connection
await connectDB();

app.set("view engine", "ejs");
app.engine("ejs", ejs.renderFile);
app.set("views", join(__dirname, "views")); // Go up one level from Back-end
app.use(express.static(join(__dirname, "../public")));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Session store
const store = MongoStore.create({
  mongoUrl: process.env.SESSION_DB_URI || process.env.MONGO_URI,
});

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Should be in environment variables
    resave: false,
    saveUninitialized: false,
    store,
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
  res.redirect(req.session.userId ? "/dashboard" : "/auth/login");
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
