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
    if (error.response) {
      console.error("AI API error status:", error.response.status);
      console.error("AI API error headers:", error.response.headers);
      console.error("AI API error data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    console.error(error.stack);
    throw new Error("AI service error");
  }
  
}

