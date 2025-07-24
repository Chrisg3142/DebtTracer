import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Simple token auth middleware
app.use((req, res, next) => {
  const token = req.headers["x-api-token"];
  if (token !== process.env.PROXY_API_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
});

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await axios.post(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.DEPLOYMENT_NAME}/chat/completions?api-version=2024-03-01-preview`,
      {
        messages: messages,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
