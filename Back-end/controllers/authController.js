import User from "../models/User.js";

// Render registration form
export const renderRegister = (req, res) => {
  res.render("auth/register", {
    title: "Register",
    formData: { name: "", email: "" },
    error: null, // Initialize error as null
  });
};

// Handle registration
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("auth/register", {
        title: "Register",
        error: "Email already in use",
        formData: { name, email },
      });
    }

    // Create new user
    const user = await User.create({ name, email, password });

    // Set session and redirect
    req.session.userId = user._id;
    res.redirect("/dashboard");
  } catch (err) {
    res.render("auth/register", {
      title: "Register",
      error: "Registration failed",
      formData: { name, email },
    });
  }
};

// Render login form
export const renderLogin = (req, res) => {
  res.render("auth/login", { title: "Login", formData: { email: "" } });
};

// Handle login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.render("auth/login", {
        title: "Login",
        error: "Invalid credentials",
        formData: { email },
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("auth/login", {
        title: "Login",
        error: "Invalid credentials",
        formData: { email },
      });
    }

    // Set session and redirect
    req.session.userId = user._id;
    res.redirect("/dashboard");
  } catch (err) {
    res.render("auth/login", {
      title: "Login",
      error: "Login failed",
      formData: { email: req.body.email },
    });
  }
};

// Handle logout
export const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
