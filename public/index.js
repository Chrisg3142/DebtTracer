window.addEventListener("DOMContentLoaded", async () => {
    const chatBox = document.getElementById("chat-box");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("user-input");
    const openChat = document.getElementById("open-chat");
    const openChatContainer = document.getElementById("open-chat-container");
    const closeChat = document.getElementById("close-chat");
    const aiSection = document.getElementById("ai-section");
  
    let chatHistory = [];
  
    // Toggle open
    openChat.addEventListener("click", () => {
      aiSection.classList.remove("collapsed");
      openChatContainer.classList.add("hidden");
    });
  
    // Toggle close
    closeChat.addEventListener("click", () => {
      aiSection.classList.add("collapsed");
      setTimeout(() => {
        openChatContainer.classList.remove("hidden");
      }, 400);
    });
  
    // Submit chat message
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userMessage = input.value.trim();
      if (!userMessage) return;
  
      chatHistory.push({ sender: "user", text: userMessage });
      appendMessage("user", userMessage);
      input.value = "";
  
      try {
        const res = await fetch("/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: userMessage }),
        });
  
        const data = await res.json();
        const aiReply = data.response;
        chatHistory.push({ sender: "bot", text: aiReply });
        appendMessage("bot", aiReply);
      } catch (err) {
        appendMessage("bot", "⚠️ Error talking to AI");
      }
    });
  
    // Append message to chat box
    function appendMessage(sender, text) {
      const div = document.createElement("div");
      div.className = `message ${sender}`;
      div.textContent = text;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
    // Load previous chat history
    async function loadChatHistory() {
        try {
        const res = await fetch("/chat/history");
        const data = await res.json();
        data.history.forEach((msg) => {
            appendMessage(msg.role === "user" ? "user" : "bot", msg.content);
        });
        } catch (err) {
        console.error("Failed to load chat history:", err);
        }
    }
  
    // Wake + Load welcome message
    try {  
      console.log("Fetching welcome message...");
      const res = await fetch("/welcome");
      const data = await res.json();
      const welcomeMessage = data.response;
  
      chatHistory.push({ sender: "bot", text: welcomeMessage });
      appendMessage("bot", welcomeMessage);
    } catch (err) {
      console.error("Error loading welcome message:", err);
      appendMessage("bot", "⚠️ Failed to load welcome message.");
    }
    await loadChatHistory();

  });
  