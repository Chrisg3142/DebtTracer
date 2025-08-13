(() => {
  // Tiny i18n accessor
  const I = (path, fallback = "") => {
    const src = window.I18N || {};
    return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), src) ?? fallback;
  };

  let actualsChart, whatIfChart;
  let actualIncome = [], actualExpenses = [];
  let editIncome = [], editExpenses = [];
  let years = 1;
  let basis = new Date();

  function getBasisParam() {
    const y = basis.getUTCFullYear();
    const m = String(basis.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`; // server expects YYYY-MM-01
  }

  function format(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const sumMonthly = (list) => list.reduce((s, x) => s + (x.monthly ?? x.amountMonthly ?? 0), 0);

  async function loadData() {
    const url = `/results/data?basis=${encodeURIComponent(getBasisParam())}&years=${years}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch-failed");
    const data = await res.json();

    // Build Actuals (monthly)
    actualIncome = data.income.map(i => ({ label: i.label, monthly: i.monthly }));
    actualExpenses = data.expenses.map(e => ({ label: e.label, monthly: e.monthly }));

    // What-If starts as a copy of actuals (monthly)
    editIncome = actualIncome.map(i => ({ label: i.label, amountMonthly: i.monthly }));
    editExpenses = actualExpenses.map(e => ({ label: e.label, amountMonthly: e.monthly }));

    drawActuals();
    buildEditors();
    drawWhatIf();
    updateSummaries();
  }

  function drawActuals() {
    const ctx = document.getElementById("actualsChart");
    if (!ctx) return;

    const labels = [
      ...actualIncome.map(i => `${I("income", "Income")}: ${i.label}`),
      ...actualExpenses.map(e => `${I("expenses", "Expense")}: ${e.label}`)
    ];
    const dataVals = [
      ...actualIncome.map(i => i.monthly),
      ...actualExpenses.map(e => e.monthly)
    ];

    if (actualsChart) actualsChart.destroy();
    actualsChart = new Chart(ctx, {
      type: "pie",
      data: { labels, datasets: [{ data: dataVals }] },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });

    // Fill tables
    const incomeBody = document.getElementById("incomeBody");
    const expenseBody = document.getElementById("expenseBody");
    if (incomeBody) {
      incomeBody.innerHTML = actualIncome.map(i =>
        `<tr><td>${i.label}</td><td class="right">$${format(i.monthly)}</td></tr>`
      ).join("");
    }
    if (expenseBody) {
      expenseBody.innerHTML = actualExpenses.map(e =>
        `<tr><td>${e.label}</td><td class="right">$${format(e.monthly)}</td></tr>`
      ).join("");
    }

    const inc = sumMonthly(actualIncome);
    const exp = sumMonthly(actualExpenses);
    const sumEl = document.getElementById("actuals-monthly-summary");
    if (sumEl) {
      sumEl.textContent = `${I("income","Income")}: $${format(inc)} · ${I("expenses","Expenses")}: $${format(exp)} · ${I("net","Net")}: $${format(inc - exp)} ${I("perMonthSuffix","/mo")}`;
    }
  }

  function buildEditors() {
    const editIncomeBody = document.getElementById("editIncomeBody");
    const editExpenseBody = document.getElementById("editExpenseBody");
    if (!editIncomeBody || !editExpenseBody) return;

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

    const editIncomeTable = document.getElementById("editIncomeTable");
    const editExpenseTable = document.getElementById("editExpenseTable");
    if (editIncomeTable) editIncomeTable.addEventListener("input", onEditChange);
    if (editExpenseTable) editExpenseTable.addEventListener("input", onEditChange);
  }

  function onEditChange(e) {
    const t = e.target;
    if (!t || t.tagName !== "INPUT") return;
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
    if (!ctx) return;

    const factor = 12 * years; // months in the selected horizon

    const labels = [
      ...editIncome.map(i => `${I("income","Income")}: ${i.label}`),
      ...editExpenses.map(e => `${I("expenses","Expense")}: ${e.label}`)
    ];
    const dataVals = [
      ...editIncome.map(i => i.amountMonthly * factor),
      ...editExpenses.map(e => e.amountMonthly * factor)
    ];

    if (whatIfChart) whatIfChart.destroy();
    whatIfChart = new Chart(ctx, {
      type: "pie",
      data: { labels, datasets: [{ data: dataVals }] },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: `${I("whatIf","What-If")} • ${years} ${years === 1 ? I("yearOne","year") : I("yearMany","years")} (${I("totals","totals")})`
          }
        }
      }
    });
  }

  function updateSummaries() {
    const incW = editIncome.reduce((s, x) => s + x.amountMonthly, 0);
    const expW = editExpenses.reduce((s, x) => s + x.amountMonthly, 0);
    const netW = incW - expW;

    const whatIfSum = document.getElementById("whatif-monthly-summary");
    if (whatIfSum) {
      whatIfSum.textContent = `${I("income","Income")}: $${format(incW)} · ${I("expenses","Expenses")}: $${format(expW)} · ${I("net","Net")}: $${format(netW)} ${I("perMonthSuffix","/mo")}`;
    }

    const horizonIncome  = incW * 12 * years;
    const horizonExpense = expW * 12 * years;
    const hz = document.getElementById("horizon-summary");
    if (hz) {
      hz.textContent = `${I("horizon","Horizon")}: ${years} ${years === 1 ? I("yearOne","year") : I("yearMany","years")} → ${I("income","Income")}: $${format(horizonIncome)} · ${I("expenses","Expenses")}: $${format(horizonExpense)} · ${I("net","Net")}: $${format(horizonIncome - horizonExpense)}`;
    }
  }

  // UI wiring
  function initControls() {
    // basis month default = current
    const basisEl = document.getElementById("basis");
    if (basisEl) {
      const now = new Date();
      const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
      basisEl.value = ym;
      basisEl.addEventListener("change", () => {
        const [y, m] = (basisEl.value || ym).split("-").map(Number);
        basis = new Date(Date.UTC(y, m - 1, 1));
        loadData().catch(err => {
          console.error(err);
          alert(I("errors.analyticsLoad","Failed to load analytics data."));
        });
      });
    }

    const yearsEl = document.getElementById("years");
    if (yearsEl) {
      yearsEl.addEventListener("input", () => {
        years = Math.max(1, parseInt(yearsEl.value || "1", 10));
        drawWhatIf();
        updateSummaries();
      });
    }

    const reloadBtn = document.getElementById("reload");
    if (reloadBtn) {
      reloadBtn.addEventListener("click", () => {
        loadData().catch(err => {
          console.error(err);
          alert(I("errors.analyticsLoad","Failed to load analytics data."));
        });
      });
    }
  }

  // Boot
  initControls();
  loadData().catch(err => {
    console.error(err);
    alert(I("errors.analyticsLoad","Failed to load analytics data."));
  });
})();
