const chatBox = document.getElementById("chat-box");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");

let chatHistory = [];

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    // Add user's message to chat box
    chatHistory.push({ sender: "user", text: userMessage });
    appendMessage("user", userMessage);
    input.value = "";

    try {
    const res = await fetch("/ask", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage })
    });

    const data = await res.json();
    const aiReply = data.response;
    chatHistory.push({ sender: "bot", text: aiReply });
    appendMessage("bot", aiReply);
    } catch (err) {
    appendMessage("bot", "⚠️ Error talking to AI");
    }
});

function appendMessage(sender, text) {
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

window.addEventListener("DOMContentLoaded", async () => {
    try {
      // Wake up backend/AI
      await fetch("/wake");
  
      // Now fetch welcome message
      const res = await fetch("/welcome");
      const data = await res.json();
      const welcomeMessage = data.response;
  
      chatHistory.push({ sender: "bot", text: welcomeMessage });
      appendMessage("bot", welcomeMessage);
    } catch (err) {
      appendMessage("bot", "⚠️ Failed to load welcome message.");
    }
  });
  