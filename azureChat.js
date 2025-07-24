// askAI.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const proxyUrl = process.env.PROXY_URL;
const proxyToken = process.env.PROXY_API_TOKEN;

export default async function askAI(chatHistory) {
  try {
    const response = await axios.post(
      proxyUrl,
      {
        messages: chatHistory,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-token": proxyToken,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("AI API error:", error.response?.data || error.message);
    throw new Error("AI service error");
  }
}
