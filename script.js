// הגדרת מצב התחלתי
const state = {
  currentPage: "dashboard", // יכול להיות "dashboard" או "settings"
  transactions: [],
};

const app = document.getElementById("app");

// פונקציית רינדור ראשית (בונה את ה-HTML)
function render() {
  // קובע אם להציג דאשבורד או הגדרות
  app.innerHTML =
    state.currentPage === "dashboard" ? renderDashboard() : renderSettings();
  // קשרי כפתורים
  bindEvents();
  // עדכון הגרף
  updateChart();
}

// פונקציית רינדור לתפריט צד
function renderSidebar() {
  return `
    <aside>
      <h1>התנהלות פיננסית</h1>
      <button class="sidebar-btn" id="quick-action">פעולה מהירה</button>
      <button class="sidebar-btn" id="open-settings">הגדרות</button>
      <button class="sidebar-btn back" id="go-home">חזרה</button>
    </aside>
  `;
}

// פונקציית רינדור לעמוד הראשי (דשבורד)
function renderDashboard() {
  // חישובי סיכומים
  const income = state.transactions
    .filter((t) => t.type === "הכנסה")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = state.transactions
    .filter((t) => t.type === "הוצאה")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  // שורות הטבלה
  const rows = state.transactions
    .map((t) => {
      return `
        <tr>
          <td>${t.date}</td>
          <td>${t.type}</td>
          <td>${t.category}</td>
          <td class="${
            t.type === "הוצאה" ? "text-red" : "text-green"
          }">₪${t.amount}</td>
          <td>${t.method}</td>
        </tr>
      `;
    })
    .join("");

  // אם אין נתונים
  const tableBody = rows || `<tr><td colspan="5">אין נתונים</td></tr>`;

  return `
    ${renderSidebar()}
    <main>
      <!-- כרטיסים (סיכום) -->
      <div class="card-grid">
        <div class="card">
          <h2>עובר ושב</h2>
          <div class="amount text-green">₪${balance}</div>
        </div>
        <div class="card">
          <h2>הוצאות חודשיות</h2>
          <div class="amount text-red">₪${expense}</div>
        </div>
        <div class="card">
          <h2>הכנסות חודשיות</h2>
          <div class="amount text-blue">₪${income}</div>
        </div>
      </div>

      <!-- גרף Chart.js -->
      <canvas id="chart" height="100"></canvas>

      <!-- טבלה -->
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>תאריך</th>
              <th>סוג</th>
              <th>קטגוריה</th>
              <th>סכום</th>
              <th>אמצעי תשלום</th>
            </tr>
          </thead>
          <tbody>
            ${tableBody}
          </tbody>
        </table>
      </div>
    </main>
  `;
}

// פונקציית רינדור לעמוד הגדרות
function renderSettings() {
  return `
    ${renderSidebar()}
    <main>
      <div class="settings-title">הגדרות</div>

      <div class="settings-table">
        <h2>חשבונות</h2>
        <table>
          <thead>
            <tr>
              <th>שם חשבון</th>
              <th>סוג</th>
              <th>סטטוס</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>בנק הפועלים</td><td>עובר ושב</td><td>פעיל</td></tr>
            <tr><td>בנק דיסקונט</td><td>עובר ושב</td><td>פעיל</td></tr>
          </tbody>
        </table>
      </div>

      <div class="settings-table">
        <h2>כרטיסי אשראי</h2>
        <table>
          <thead>
            <tr>
              <th>שם כרטיס</th>
              <th>משויך לחשבון</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>כאל</td><td>בנק הפועלים</td></tr>
            <tr><td>מקס</td><td>בנק הפועלים</td></tr>
          </tbody>
        </table>
      </div>
    </main>
  `;
}

/* אירועים */
function bindEvents() {
  // כפתור פעולה מהירה
  document.getElementById("quick-action")?.addEventListener("click", openModal);
  // מעבר להגדרות
  document.getElementById("open-settings")?.addEventListener("click", () => {
    state.currentPage = "settings";
    render();
  });
  // חזרה לעמוד הראשי
  document.getElementById("go-home")?.addEventListener("click", () => {
    state.currentPage = "dashboard";
    render();
  });
}

// פתיחת פופ-אפ
function openModal() {
  const modal = document.createElement("div");
  modal.className = "modal";
  
  modal.innerHTML = `
    <div class="modal-content">
      <h3>פעולה חדשה</h3>

      <select id="type">
        <option value="הוצאה">הוצאה</option>
        <option value="הכנסה">הכנסה</option>
      </select>

      <input id="description" type="text" placeholder="תיאור" />

      <select id="account">
        <option>בנק הפועלים</option>
        <option>בנק דיסקונט</option>
      </select>

      <select id="method"></select>

      <input id="amount" type="number" placeholder="סכום" />
      <input id="date" type="date" value="${new Date()
        .toISOString()
        .split("T")[0]}" />

      <button class="save">שמור</button>
      <button class="cancel">ביטול</button>
    </div>
  `;

  const methodSelect = modal.querySelector("#method");
  const accountSelect = modal.querySelector("#account");
  const accountMethodsMap = {
    "בנק הפועלים": [
      "עובר ושב",
      "שיק",
      "העברה בנקאית",
      "הרשאה לחיוב חשבון",
      "אשראי בנקאי",
      "אשראי חוץ בנקאי",
    ],
    "בנק דיסקונט": ["עובר ושב", "שיק", "העברה בנקאית", "מזומן"],
  };

  function updateMethods(account) {
    methodSelect.innerHTML = accountMethodsMap[account]
      .map((m) => `<option>${m}</option>`)
      .join("");
  }

  // עדכונים דינאמיים של אמצעי ביצוע לפי חשבון
  accountSelect.addEventListener("change", (e) => {
    updateMethods(e.target.value);
  });
  // ברירת מחדל - בנק הפועלים
  updateMethods("בנק הפועלים");

  // כפתור ביטול
  modal.querySelector(".cancel").addEventListener("click", () => {
    modal.remove();
  });

  // כפתור שמירה
  modal.querySelector(".save").addEventListener("click", () => {
    const tx = {
      type: modal.querySelector("#type").value,
      category: modal.querySelector("#description").value,
      account: modal.querySelector("#account").value,
      method: modal.querySelector("#method").value,
      amount: Number(modal.querySelector("#amount").value),
      date: modal.querySelector("#date").value,
    };

    // מוודאים שמילא לפחות את השדות החיוניים
    if (!tx.amount || !tx.category || !tx.method) {
      alert("אנא מלא/י את כל השדות הנדרשים");
      return;
    }

    // מוסיפים את הפעולה לתחילת הרשימה
    state.transactions.unshift(tx);

    modal.remove();
    render();
  });

  document.body.appendChild(modal);
}

// ניהול גרף
let chart;
function updateChart() {
  const ctx = document.getElementById("chart");
  if (!ctx) return;

  // תגיות = התאריכים הפוכים כדי שהאחרון יהיה מצד ימין
  const labels = state.transactions.map((t) => t.date).reverse();
  // נתוני הכנסות והוצאות בהתאמה
  const incomeData = state.transactions
    .map((t) => (t.type === "הכנסה" ? t.amount : 0))
    .reverse();
  const expenseData = state.transactions
    .map((t) => (t.type === "הוצאה" ? t.amount : 0))
    .reverse();

  // הורסים גרף קודם אם קיים, ויוצרים חדש
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "הכנסות",
          data: incomeData,
          borderColor: "#3b82f6",
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: "הוצאות",
          data: expenseData,
          borderColor: "#ef4444",
          borderDash: [3, 3],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// קריאה ראשונית
render();
