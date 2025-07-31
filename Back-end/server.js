import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import ejs from "ejs";
import methodOverride from "method-override";

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
mongoose
  .connect(
    "mongodb+srv://debtTracer:Secret123@debttracer.n8eexb1.mongodb.net/debtTracer?retryWrites=true&w=majority&appName=debtTracer"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error:", err));

app.set("view engine", "ejs");
app.engine("ejs", ejs.renderFile);
app.set("views", join(__dirname, "views")); // Go up one level from Back-end
app.use(express.static(join(__dirname, "../public")));
// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Session middleware
app.use(
  session({
    secret: "your-secret-key", // Should be in environment variables
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
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

app.get("/", (req, res) => {
  res.redirect(req.session.userId ? "/dashboard" : "/auth/login");
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
