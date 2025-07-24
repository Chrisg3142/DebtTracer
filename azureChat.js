// askAI.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const endpoint = process.env.AZURE_ENDPOINT;
const apiKey = process.env.AZURE_API_KEY;
const deploymentName = process.env.AZURE_DEPLOYMENT_NAME;
const apiVersion = "2024-03-01-preview"; // or your version

export default async function askAI(chatHistory) {
  try {
    const response = await axios.post(
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
      {
        messages: chatHistory,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("AI API error:", error.response?.data || error.message);
    throw new Error("AI service error");
  }
}
