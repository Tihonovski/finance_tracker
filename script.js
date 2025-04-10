// --- Global Variables & DOM Elements ---
let transactions = []; // Array to hold transaction objects
let accounts = [];     // Array to hold bank account objects
let creditCards = [];  // Array to hold credit card objects

const transactionsListEl = document.getElementById('transactions-list');
const emptyListMessageEl = document.getElementById('empty-list-message');
const summaryBalanceEl = document.getElementById('summary-balance');
const summaryIncomeEl = document.getElementById('summary-income');
const summaryExpensesEl = document.getElementById('summary-expenses');

// Modal elements
const modal = document.getElementById('add-transaction-modal');
const openModalButtonHeader = document.getElementById('open-modal-button-header');
const closeModalButton = document.getElementById('modal-close-button');
const transactionForm = document.getElementById('transaction-form');
const bankAccountSelect = document.getElementById('bankAccount');
const paymentMethodSelect = document.getElementById('paymentMethod');

// Tab elements
const mainTabs = document.getElementById('main-tabs');
const tabButtons = mainTabs.querySelectorAll('.segment-button');
const tabPanelsContainer = document.getElementById('tab-panels-container');
const tabPanels = tabPanelsContainer.querySelectorAll('.tab-panel-content');

// --- Default Data (for initial setup and testing) ---
const DEFAULT_ACCOUNTS = [
    { id: 'acc-p', name: 'פועלים', methods: ['עו"ש ישיר', 'מזומן פועלים', 'שיק פועלים', 'העברה בנקאית פועלים', 'הרשאה לחיוב פועלים', 'אשראי בנקאי פועלים'] },
    { id: 'acc-d', name: 'דיסקונט', methods: ['עו"ש ישיר', 'מזומן דיסקונט', 'שיק דיסקונט', 'העברה בנקאית דיסקונט', 'הרשאה לחיוב דיסקונט', 'אשראי בנקאי דיסקונט'] }
];
const DEFAULT_CREDIT_CARDS = [
    { id: 'cc-cal', name: 'כאל', linkedAccountId: 'acc-p' }, // Linked to פועלים
    { id: 'cc-max', name: 'מקס', linkedAccountId: 'acc-p' }  // Linked to פועלים
];


// --- Utility Functions ---
/**
 * Formats a number as currency in ILS.
 * @param {number} amount - The number to format.
 * @returns {string} Formatted currency string.
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        amount = 0;
    }
    return `₪ ${amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a date string (YYYY-MM-DD) to DD/MM/YYYY.
 * @param {string} dateString - The date string in YYYY-MM-DD format.
 * @returns {string} Formatted date string or original if invalid.
 */
function formatDate(dateString) {
    try {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return dateString;
         return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString;
    }
}

// --- Data Handling (Accounts, Cards, Transactions) ---

/** Generic function to load data from localStorage */
function loadData(key, defaultValue = []) {
    try {
        const stored = localStorage.getItem(key);
        const data = stored ? JSON.parse(stored) : defaultValue;
        if (!Array.isArray(data)) {
            console.warn(`Data for key "${key}" was not an array, resetting to default.`);
            return defaultValue;
        }
        // Specific validation/parsing if needed can go here
        if (key === 'transactions_apple_style') {
             return data.map(tx => ({ ...tx, amount: parseFloat(tx.amount) || 0 }));
        }
        return data;
    } catch (e) {
        console.error(`Error loading ${key} from localStorage:`, e);
        return defaultValue; // Reset on error
    }
}

/** Generic function to save data to localStorage */
function saveData(key, data) {
     try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e);
        alert(`שגיאה בשמירת הנתונים (${key}). ייתכן שהאחסון מלא.`);
    }
}

/** Loads all application data */
function loadAllData() {
    accounts = loadData('accounts_apple_style', DEFAULT_ACCOUNTS);
    creditCards = loadData('creditCards_apple_style', DEFAULT_CREDIT_CARDS);
    transactions = loadData('transactions_apple_style', []); // Start empty if not found
}

/** Saves all application data */
function saveAllData() {
    saveData('accounts_apple_style', accounts);
    saveData('creditCards_apple_style', creditCards);
    saveData('transactions_apple_style', transactions);
}

/** Adds a new transaction object */
function addTransaction(tx) {
    const newTransaction = {
        id: Date.now(),
        type: tx.type,
        amount: parseFloat(tx.amount) || 0,
        description: tx.description.trim(),
        category: tx.category,
        date: tx.date,
        accountId: tx.accountId, // Store the selected account ID
        paymentMethod: tx.paymentMethod // Store the specific payment method chosen
    };
    transactions.push(newTransaction);
    saveAllData(); // Save everything just in case (can optimize later)
    render();
}

// --- Rendering ---

/** Renders the list of transactions */
function renderTransactionsList() {
    transactionsListEl.innerHTML = '';
    transactionsListEl.appendChild(emptyListMessageEl);

    if (!Array.isArray(transactions) || transactions.length === 0) {
        emptyListMessageEl.style.display = 'block';
        return;
    }

    emptyListMessageEl.style.display = 'none';

    const sorted = [...transactions].sort((a, b) => {
        const dateComparison = new Date(b.date) - new Date(a.date);
        if (dateComparison !== 0) return dateComparison;
        return b.id - a.id;
    });

    sorted.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.dataset.id = tx.id;

        const isIncome = tx.type === 'income';
        const amountClass = isIncome ? 'income' : 'expense';
        const amountPrefix = isIncome ? '+' : '-';

        // Find account name for display (optional)
        const account = accounts.find(acc => acc.id === tx.accountId);
        const accountName = account ? account.name : 'לא ידוע';

        // Determine icon and background color (simplified)
        let iconBg = 'bg-gray-400';
        let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>`; // Tag icon default

        if (isIncome) {
            iconBg = 'bg-green-500';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.879A3 3 0 1 0 15 15.182l.879-.879M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" /></svg>`;
        } else { // Expense - add more specific icons later if needed
             iconBg = 'bg-red-500';
             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.75A.75.75 0 0 1 2.25 4.5h.75m0 0H21m-18.75 0H9.167a1.125 1.125 0 0 1 1.125 1.125v1.125c0 .621-.504 1.125-1.125 1.125H2.25v-2.25Z" /></svg>`;
        }

        item.innerHTML = `
            <div class="transaction-icon ${iconBg}">
               ${iconSvg}
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${tx.description || 'אין תיאור'}</div>
                <div class="transaction-category">${tx.category || 'ללא קטגוריה'} - ${formatDate(tx.date)}</div>
                <div class="text-xs text-gray-500">${tx.paymentMethod} (${accountName})</div> </div>
            <div class="transaction-amount ${amountClass}">
                ${amountPrefix}${formatCurrency(tx.amount)}
            </div>
        `;
        transactionsListEl.appendChild(item);
    });
}

/** Updates the summary cards */
function updateSummary() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalIncome = 0;
    let totalExpenses = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    transactions.forEach(tx => {
         const amount = parseFloat(tx.amount);
         if (isNaN(amount)) return;

         const txDate = new Date(tx.date + 'T00:00:00Z');
         const txMonth = txDate.getUTCMonth();
         const txYear = txDate.getUTCFullYear();

         if (tx.type === 'income') {
             totalIncome += amount;
             if (txYear === currentYear && txMonth === currentMonth) {
                 monthlyIncome += amount;
             }
         } else if (tx.type === 'expense') {
             totalExpenses += amount;
              if (txYear === currentYear && txMonth === currentMonth) {
                 monthlyExpenses += amount;
             }
         }
     });

    const balance = totalIncome - totalExpenses;

    summaryBalanceEl.textContent = formatCurrency(balance);
    summaryIncomeEl.textContent = formatCurrency(monthlyIncome);
    summaryExpensesEl.textContent = formatCurrency(monthlyExpenses);
}

/** Renders all parts of the UI */
function render() {
    renderTransactionsList();
    updateSummary();
    // Future: renderBudgets(); renderRecurring(); renderSettings();
}


// --- Modal Handling & Form Logic ---

/** Populates the Bank Account dropdown in the modal */
function populateAccountDropdown() {
    bankAccountSelect.innerHTML = '<option value="" disabled selected>בחר חשבון...</option>'; // Reset
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = acc.name;
        bankAccountSelect.appendChild(option);
    });
}

/** Updates the Payment Method dropdown based on the selected Bank Account */
function updatePaymentMethods() {
    const selectedAccountId = bankAccountSelect.value;
    paymentMethodSelect.innerHTML = '<option value="" disabled selected>בחר אמצעי תשלום...</option>'; // Reset
    paymentMethodSelect.disabled = true; // Disable initially

    if (!selectedAccountId) return; // No account selected

    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
    if (!selectedAccount) return; // Account not found

    let availableMethods = [];

    // Add direct methods from the account
    if (selectedAccount.methods && Array.isArray(selectedAccount.methods)) {
        availableMethods = [...selectedAccount.methods];
    }

    // Add linked credit cards
    const linkedCards = creditCards.filter(card => card.linkedAccountId === selectedAccountId);
    linkedCards.forEach(card => {
        availableMethods.push(card.name); // Add card name as a payment method
    });

    // Populate the dropdown
    if (availableMethods.length > 0) {
        availableMethods.forEach(method => {
            const option = document.createElement('option');
            option.value = method;
            option.textContent = method;
            paymentMethodSelect.appendChild(option);
        });
        paymentMethodSelect.disabled = false; // Enable the dropdown
    } else {
         // Keep disabled and maybe show a different placeholder
         paymentMethodSelect.innerHTML = '<option value="" disabled selected>אין אמצעי תשלום זמינים...</option>';
    }
}


/** Opens the transaction modal */
function openModal() {
    transactionForm.reset();
    populateAccountDropdown(); // Populate accounts when opening
    paymentMethodSelect.innerHTML = '<option value="" disabled selected>בחר קודם חשבון בנק...</option>'; // Reset payment methods
    paymentMethodSelect.disabled = true;

    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    document.getElementById('date').value = `${year}-${month}-${day}`;
    transactionForm.elements.transactionType.value = 'expense';
    modal.style.display = 'flex';
    document.getElementById('bankAccount').focus(); // Focus account first
}

/** Closes the transaction modal */
function closeModal() {
    modal.style.display = 'none';
}

// Event listeners for modal
openModalButtonHeader.addEventListener('click', openModal);
closeModalButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
});

// Event listener for bank account change
bankAccountSelect.addEventListener('change', updatePaymentMethods);

// Form submission handling
transactionForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(transactionForm);
    const newTransactionData = {
        type: formData.get('transactionType'),
        amount: formData.get('amount'),
        description: formData.get('description'),
        category: formData.get('category'),
        date: formData.get('date'),
        accountId: formData.get('bankAccount'), // Get selected account ID
        paymentMethod: formData.get('paymentMethod') // Get selected payment method
    };

    // --- Basic Input Validation ---
    const amount = parseFloat(newTransactionData.amount);
    if (isNaN(amount) || amount <= 0) {
        alert('אנא הזן סכום חיובי תקין.');
        document.getElementById('amount').focus();
        return;
    }
     if (!newTransactionData.accountId) {
        alert('אנא בחר חשבון בנק.');
        document.getElementById('bankAccount').focus();
        return;
    }
     if (!newTransactionData.paymentMethod) {
        alert('אנא בחר אמצעי תשלום.');
        document.getElementById('paymentMethod').focus();
        return;
    }
    if (!newTransactionData.description || newTransactionData.description.trim() === '') {
        alert('אנא הזן תיאור לתנועה.');
         document.getElementById('description').focus();
        return;
    }
     if (!newTransactionData.category) {
        alert('אנא בחר קטגוריה.');
         document.getElementById('category').focus();
        return;
    }
     if (!newTransactionData.date) {
        alert('אנא בחר תאריך.');
         document.getElementById('date').focus();
        return;
    }
    // --- End Validation ---

    addTransaction({ ...newTransactionData, amount: amount });
    closeModal();
});


// --- Tab/Segment Handling ---
 tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${targetTab}-panel`);
        });
        // Potentially load specific data or refresh view when tab changes
        // if (targetTab === 'settings') { renderSettings(); }
    });
});


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadAllData(); // Load accounts, cards, and transactions
    render(); // Initial render
     // Activate the first tab
     if(tabButtons.length > 0) {
         tabButtons.forEach(btn => btn.classList.remove('active'));
         tabPanels.forEach(panel => panel.classList.remove('active'));
         tabButtons[0].classList.add('active');
         const firstPanelId = `tab-${tabButtons[0].getAttribute('data-tab')}-panel`;
         const firstPanel = document.getElementById(firstPanelId);
         if (firstPanel) firstPanel.classList.add('active');
     }
});
