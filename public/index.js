window.addEventListener("DOMContentLoaded", async () => {
    const chatBox = document.getElementById("chat-box");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("user-input");
    const openChat = document.getElementById("open-chat");
    const openChatContainer = document.getElementById("open-chat-container");
    const closeChat = document.getElementById("close-chat");
    const aiSection = document.getElementById("ai-section");
    //charts for pages
    const earningsChart = document.getElementById("myChartEarnings");
    const expensesChart = document.getElementById("myChartExpenses");
    const combinedChart = document.getElementById("myChartCombined");

    //button for nav bar
    const openNav = document.getElementById("open-nav");
    const navBar = document.getElementById("nav-Bar")
    const closeNav = document.getElementById("close-nav");
    //selector for the darkmode toggle and profile pic
    const darkSwitch = document.getElementById("darkModebar");


    //block code for dark mode and light mode
    //if css darkmode doesnt work for some components
    //make a dark mode class and add it in the second if statement 
    //then to toggle it set classlist.toggle("ex.") om the even listnener
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        openNav.classList.add("openNavDark");
        closeNav.classList.add("closeNavDark");
        openChatContainer.classList.add("circleDark");
        openChat.classList.add("circleDark");
        darkSwitch.classList.add("profileDM");
        themeToggle.checked = true;
      }
      themeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
        openNav.classList.toggle("openNavDark");
        closeNav.classList.toggle("closeNavDark");
        openChatContainer.classList.toggle("circleDark");
        openChat.classList.toggle("circleDark");
        darkSwitch.classList.toggle("profileDM");
        const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
        localStorage.setItem("theme", theme);
      });
    }

    //this code is to save what language someone selects 
    //this makes it so it is retrieved from session storage and lets 
    //the language load up when the user starts up the page
    const lang = document.getElementById("language-select");
    if (lang){
      const savedLang = localStorage.getItem("language");
      if (savedLang){
        lang.value = savedLang;
      }
      lang.addEventListener("change", () =>{
        const language = lang.value;
        localStorage.setItem("language", language);
      })
    }

    openNav.addEventListener("click", () => {
      navBar.classList.remove("collapsedx");
      openNav.classList.add("hidden");
    });
  
    // Toggle close
    closeNav.addEventListener("click", () => {
      navBar.classList.add("collapsedx");
      setTimeout(() => {
        openNav.classList.remove("hidden");
      }, 100);
    });  

    // Helper: run a callback after CSS transition finishes
    function onTransitionEndOnce(el, cb) {
      const handler = (e) => {
        if (e.target === el) {
          el.removeEventListener("transitionend", handler);
          cb();
        }
      };
      el.addEventListener("transitionend", handler);
    }

    function onTransitionEndOnce(el, cb){
      const handler = (e)=>{ if(e.target === el){ el.removeEventListener('transitionend', handler); cb(); } };
      el.addEventListener('transitionend', handler);
    }
    
    openNav.addEventListener("click", () => {
      // show + slide in
      navBar.classList.remove("collapsedx");
      navBar.setAttribute("aria-hidden","false");
      openNav.classList.add("hidden"); // hide hamburger while open
    });
    
    closeNav.addEventListener("click", () => {
      // slide out
      navBar.classList.add("collapsedx");
      onTransitionEndOnce(navBar, () => {
        // after slide completes
        navBar.setAttribute("aria-hidden","true");
        openNav.classList.remove("hidden");
      });
    });

    //this is to see the file name when someone 
    //chooses a file to change their profile picture
    document.getElementById('profilePic').addEventListener('change', function() {
      if (this.files && this.files[0]) {
        document.querySelector('.custom-file-label').textContent = this.files[0].name;
      }
    });

    fetch("/chart-data")
    .then(res => res.json())
    .then(data => {
      // Prepare income pie chart
      Chart.register(ChartDataLabels);
      const incomeLabels = data.income.map(i => i._id);
      const incomeValues = data.income.map(i => i.total);
  
      const incomeCtx = earningsChart.getContext("2d");
      new Chart(incomeCtx, {
        type: "pie",
        data: {
          labels: incomeLabels,
          datasets: [{
            label: "Income Sources",
            data: incomeValues,
            backgroundColor: [
              "#36a2eb", "#ff6384", "#ffcd56", "#4bc0c0", "#9966ff"
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            datalabels: {
              formatter: (value, context) => {
                const data = context.chart.data.datasets[0].data;
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${percentage}%`;
              },
              color: "#fff",
              font: {
                weight: "bold",
                size: 14
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
  
      // Prepare expenses pie chart
      const expenseLabels = data.expenses.map(e => e._id);
      const expenseValues = data.expenses.map(e => e.total);
  
      const expenseCtx = expensesChart.getContext("2d");
      new Chart(expenseCtx, {
        type: "pie",
        data: {
          labels: expenseLabels,
          datasets: [{
            label: "Expense Categories",
            data: expenseValues,
            backgroundColor: [
              "#ff9f40", "#9966ff", "#4bc0c0", "#ff6384", "#36a2eb"
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            datalabels: {
              formatter: (value, context) => {
                const data = context.chart.data.datasets[0].data;
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${percentage}%`;
              },
              color: "#fff",
              font: {
                weight: "bold",
                size: 14
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
  
      // Combined Bar Chart: Income vs Expenses
      const combinedCtx = combinedChart.getContext("2d");
      new Chart(combinedCtx, {
        type: "pie",
        data: {
          labels: ["Income", "Expenses"],
          datasets: [{
            label: "Income vs Expenses",
            data: [data.summary.totalIncome, data.summary.totalExpenses],
            backgroundColor: ["#36a2eb", "#ff6384"],
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            datalabels: {
              formatter: (value, context) => {
                const data = context.chart.data.datasets[0].data;
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${percentage}%`;
              },
              color: "#fff",
              font: {
                weight: "bold",
                size: 14
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    })
    .catch(err => {
      console.error("Failed to load chart data", err);
    });
  
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
  