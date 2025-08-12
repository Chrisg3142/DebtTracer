
  (() => {
  let actualsChart, whatIfChart;
  let actualIncome = [], actualExpenses = [];
  let editIncome = [], editExpenses = [];
  let years = 1;
  let basis = new Date();

  function getBasisParam() {
    const y = basis.getUTCFullYear();
    const m = String(basis.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
    // server only requires YYYY-MM-01 to know the month
  }

  function format(n) {
    return Number(n).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function sumMonthly(list) {
    return list.reduce((s, x) => s + (x.monthly ?? x.amountMonthly ?? 0), 0);
  }

  async function loadData() {
    const res = await fetch(`/results/data?basis=${encodeURIComponent(getBasisParam())}&years=${years}`);
    if (!res.ok) throw new Error("Failed to fetch analytics data");
    const data = await res.json();

    // Build "Actuals" data (monthly)
    actualIncome = data.income.map(i => ({ label: i.label, monthly: i.monthly }));
    actualExpenses = data.expenses.map(e => ({ label: e.label, monthly: e.monthly }));

    // Initialize "What-If" as a copy of actuals (monthly)
    editIncome = actualIncome.map(i => ({ label: i.label, amountMonthly: i.monthly }));
    editExpenses = actualExpenses.map(e => ({ label: e.label, amountMonthly: e.monthly }));

    drawActuals();
    buildEditors();
    drawWhatIf();
    updateSummaries();
  }

  function drawActuals() {
    const ctx = document.getElementById("actualsChart");
    const labels = [
      ...actualIncome.map(i => `Income: ${i.label}`),
      ...actualExpenses.map(e => `Expense: ${e.label}`)
    ];
    const dataVals = [
      ...actualIncome.map(i => i.monthly),
      ...actualExpenses.map(e => e.monthly)
    ];

    if (actualsChart) actualsChart.destroy();
    actualsChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [{ data: dataVals }]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });

    // Fill tables
    const incomeBody = document.getElementById("incomeBody");
    incomeBody.innerHTML = actualIncome.map(i =>
      `<tr><td>${i.label}</td><td class="right">$${format(i.monthly)}</td></tr>`
    ).join("");

    const expenseBody = document.getElementById("expenseBody");
    expenseBody.innerHTML = actualExpenses.map(e =>
      `<tr><td>${e.label}</td><td class="right">$${format(e.monthly)}</td></tr>`
    ).join("");

    const inc = sumMonthly(actualIncome);
    const exp = sumMonthly(actualExpenses);
    document.getElementById("actuals-monthly-summary").textContent =
      `Income: $${format(inc)} · Expenses: $${format(exp)} · Net: $${format(inc - exp)} /mo`;
  }

  function buildEditors() {
    const editIncomeBody = document.getElementById("editIncomeBody");
    editIncomeBody.innerHTML = editIncome.map((i, idx) =>
      `<tr>
         <td>${i.label}</td>
         <td class="right">
            <input class="inline" type="number" min="0" step="0.01"
                   value="${i.amountMonthly}"
                   data-type="income" data-index="${idx}" />
         </td>
       </tr>`
    ).join("");

    const editExpenseBody = document.getElementById("editExpenseBody");
    editExpenseBody.innerHTML = editExpenses.map((e, idx) =>
      `<tr>
         <td>${e.label}</td>
         <td class="right">
            <input class="inline" type="number" min="0" step="0.01"
                   value="${e.amountMonthly}"
                   data-type="expense" data-index="${idx}" />
         </td>
       </tr>`
    ).join("");

    // delegate change events
    document.getElementById("editIncomeTable").addEventListener("input", onEditChange);
    document.getElementById("editExpenseTable").addEventListener("input", onEditChange);
  }

  function onEditChange(e) {
    const t = e.target;
    if (t.tagName !== "INPUT") return;
    const type = t.getAttribute("data-type");
    const index = Number(t.getAttribute("data-index"));
    const val = Number(t.value || 0);
    if (type === "income") editIncome[index].amountMonthly = val;
    if (type === "expense") editExpenses[index].amountMonthly = val;
    drawWhatIf();
    updateSummaries();
  }

  function drawWhatIf() {
    const ctx = document.getElementById("whatIfChart");
    const labels = [
      ...editIncome.map(i => `Income: ${i.label}`),
      ...editExpenses.map(e => `Expense: ${e.label}`)
    ];
    const dataVals = [
      ...editIncome.map(i => i.amountMonthly),
      ...editExpenses.map(e => e.amountMonthly)
    ];

    if (whatIfChart) whatIfChart.destroy();
    whatIfChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [{ data: dataVals }]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
  }

  function updateSummaries() {
    const incA = sumMonthly(actualIncome);
    const expA = sumMonthly(actualExpenses);
    const netA = incA - expA;

    const incW = editIncome.reduce((s, x) => s + x.amountMonthly, 0);
    const expW = editExpenses.reduce((s, x) => s + x.amountMonthly, 0);
    const netW = incW - expW;

    document.getElementById("whatif-monthly-summary").textContent =
      `Income: $${format(incW)} · Expenses: $${format(expW)} · Net: $${format(netW)} /mo`;

    const horizonIncome  = incW * 12 * years;
    const horizonExpense = expW * 12 * years;

    document.getElementById("horizon-summary").textContent =
      `Horizon: ${years} year(s) → Income: $${format(horizonIncome)} · Expenses: $${format(horizonExpense)} · Net: $${format(horizonIncome - horizonExpense)}`;
  }

  // UI wiring
  function initControls() {
    // default basis to current YYYY-MM
    const basisEl = document.getElementById("basis");
    const now = new Date();
    const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`;
    basisEl.value = ym;
    basisEl.addEventListener("change", () => {
      const [y,m] = basisEl.value.split("-").map(Number);
      basis = new Date(Date.UTC(y, m - 1, 1));
      loadData().catch(console.error);
    });

    const yearsEl = document.getElementById("years");
    yearsEl.addEventListener("input", () => {
      years = Math.max(1, parseInt(yearsEl.value || "1", 10));
      updateSummaries();
    });

    document.getElementById("reload").addEventListener("click", () => {
      loadData().catch(console.error);
    });
  }

  // Boot
  initControls();
  loadData().catch(err => {
    console.error(err);
    alert("Failed to load analytics data.");
  });
})();
