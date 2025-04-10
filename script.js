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
const modalTitleEl = document.getElementById('modal-title');
const modalSubmitButton = document.getElementById('modal-submit-button');
const transactionIdInput = document.getElementById('transaction-id'); // Hidden input for edit

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
 * Formats a number as currency in ILS (without +/- sign).
 * @param {number} amount - The number to format.
 * @returns {string} Formatted currency string.
 */
function formatCurrencyAbsolute(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        amount = 0;
    }
    // Use Math.abs() to remove sign before formatting
    return `₪ ${Math.abs(amount).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        if (key === 'transactions_apple_style') {
             return data.map(tx => ({ ...tx, amount: parseFloat(tx.amount) || 0 }));
        }
        return data;
    } catch (e) {
        console.error(`Error loading ${key} from localStorage:`, e);
        return defaultValue;
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
    transactions = loadData('transactions_apple_style', []);
}

/** Saves all application data */
function saveAllData() {
    saveData('accounts_apple_style', accounts);
    saveData('creditCards_apple_style', creditCards);
    saveData('transactions_apple_style', transactions);
}

/** Adds or updates a transaction object */
function saveTransaction(txData) {
    const amount = parseFloat(txData.amount) || 0;
    const idToSave = txData.id ? parseInt(txData.id) : Date.now(); // Use existing ID if editing, else generate new

    const transaction = {
        id: idToSave,
        type: txData.type,
        amount: amount,
        description: txData.description.trim(),
        category: txData.category,
        date: txData.date,
        accountId: txData.accountId,
        paymentMethod: txData.paymentMethod
    };

    const existingIndex = transactions.findIndex(t => t.id === idToSave);

    if (existingIndex > -1) {
        // Update existing transaction
        transactions[existingIndex] = transaction;
        console.log("Transaction updated:", transaction);
    } else {
        // Add new transaction
        transactions.push(transaction);
         console.log("Transaction added:", transaction);
    }

    saveAllData();
    render();
}


/** Deletes a transaction by its ID */
function deleteTransaction(id) {
    const transactionId = parseInt(id); // Ensure ID is a number
    const initialLength = transactions.length;
    transactions = transactions.filter(tx => tx.id !== transactionId);

    if (transactions.length < initialLength) {
        console.log("Transaction deleted:", transactionId);
        saveAllData();
        render();
    } else {
        console.warn("Transaction not found for deletion:", transactionId);
    }
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
        item.dataset.id = tx.id; // Store ID on the element

        const isIncome = tx.type === 'income';
        const amountClass = isIncome ? 'income' : 'expense';
        const typeLabel = isIncome ? 'זכות' : 'חובה'; // Credit/Debit label
        const typeLabelClass = isIncome ? 'text-green-600' : 'text-red-600'; // Color for label

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

        // Removed +/- prefix, added typeLabel span
        item.innerHTML = `
            <div class="transaction-icon ${iconBg}">
               ${iconSvg}
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${tx.description || 'אין תיאור'}</div>
                <div class="transaction-category">${tx.category || 'ללא קטגוריה'} - ${formatDate(tx.date)}</div>
                <div class="text-xs text-gray-500">${tx.paymentMethod} (${accountName})</div>
            </div>
            <div class="transaction-amount-section">
                 <span class="transaction-type-label ${typeLabelClass}">${typeLabel}</span>
                 <span class="transaction-amount ${amountClass}">
                    ${formatCurrencyAbsolute(tx.amount)}
                 </span>
            </div>
            <div class="transaction-actions">
                <button class="action-link-button edit" data-id="${tx.id}" aria-label="ערוך תנועה">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                </button>
                 <button class="action-link-button delete" data-id="${tx.id}" aria-label="מחק תנועה">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
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

    summaryBalanceEl.textContent = formatCurrencyAbsolute(balance); // Use absolute format
    summaryIncomeEl.textContent = formatCurrencyAbsolute(monthlyIncome); // Use absolute format
    summaryExpensesEl.textContent = formatCurrencyAbsolute(monthlyExpenses); // Use absolute format
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
        // Sort methods alphabetically for better UX
        availableMethods.sort((a, b) => a.localeCompare(b, 'he'));

        availableMethods.forEach(method => {
            const option = document.createElement('option');
            option.value = method;
            option.textContent = method;
            paymentMethodSelect.appendChild(option);
        });
        paymentMethodSelect.disabled = false; // Enable the dropdown
    } else {
         paymentMethodSelect.innerHTML = '<option value="" disabled selected>אין אמצעי תשלום זמינים...</option>';
    }
}


/** Opens the transaction modal for adding or editing */
function openModal(transactionToEdit = null) {
    transactionForm.reset(); // Clear form
    populateAccountDropdown(); // Populate accounts

    if (transactionToEdit) {
        // --- EDIT MODE ---
        modalTitleEl.textContent = 'עריכת תנועה';
        modalSubmitButton.textContent = 'עדכן תנועה';
        transactionIdInput.value = transactionToEdit.id; // Set the hidden ID field

        // Pre-fill form fields
        transactionForm.elements.transactionType.value = transactionToEdit.type;
        transactionForm.elements.amount.value = transactionToEdit.amount;
        transactionForm.elements.description.value = transactionToEdit.description;
        transactionForm.elements.category.value = transactionToEdit.category;
        transactionForm.elements.date.value = transactionToEdit.date; // Assumes date is YYYY-MM-DD
        transactionForm.elements.bankAccount.value = transactionToEdit.accountId;

        // Update payment methods based on the pre-filled account *then* set the value
        updatePaymentMethods(); // Populate payment methods for the account
        transactionForm.elements.paymentMethod.value = transactionToEdit.paymentMethod; // Set the specific method


    } else {
        // --- ADD MODE ---
        modalTitleEl.textContent = 'הוספת תנועה חדשה';
        modalSubmitButton.textContent = 'שמור תנועה';
        transactionIdInput.value = ''; // Clear the hidden ID field
        paymentMethodSelect.innerHTML = '<option value="" disabled selected>בחר קודם חשבון בנק...</option>';
        paymentMethodSelect.disabled = true;
        // Set default date to today
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        document.getElementById('date').value = `${year}-${month}-${day}`;
        transactionForm.elements.transactionType.value = 'expense'; // Default to expense
    }

    modal.style.display = 'flex';
    // Focus appropriate field
    if (transactionToEdit) {
         document.getElementById('amount').focus();
    } else {
         document.getElementById('bankAccount').focus();
    }
}

/** Closes the transaction modal */
function closeModal() {
    modal.style.display = 'none';
    transactionIdInput.value = ''; // Clear ID on close
}

// Event listeners for modal
openModalButtonHeader.addEventListener('click', () => openModal()); // Open in Add mode
closeModalButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
});

// Event listener for bank account change
bankAccountSelect.addEventListener('change', updatePaymentMethods);

// Form submission handling (Handles both Add and Edit)
transactionForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(transactionForm);
    const transactionData = {
        id: formData.get('transactionId') || null, // Get ID for editing, null for adding
        type: formData.get('transactionType'),
        amount: formData.get('amount'),
        description: formData.get('description'),
        category: formData.get('category'),
        date: formData.get('date'),
        accountId: formData.get('bankAccount'),
        paymentMethod: formData.get('paymentMethod')
    };

    // --- Basic Input Validation ---
    const amount = parseFloat(transactionData.amount);
    if (isNaN(amount) || amount <= 0) {
        alert('אנא הזן סכום חיובי תקין.');
        document.getElementById('amount').focus();
        return;
    }
     if (!transactionData.accountId) {
        alert('אנא בחר חשבון בנק.');
        document.getElementById('bankAccount').focus();
        return;
    }
     if (!transactionData.paymentMethod) {
        alert('אנא בחר אמצעי תשלום.');
        document.getElementById('paymentMethod').focus();
        return;
    }
    if (!transactionData.description || transactionData.description.trim() === '') {
        alert('אנא הזן תיאור לתנועה.');
         document.getElementById('description').focus();
        return;
    }
     if (!transactionData.category) {
        alert('אנא בחר קטגוריה.');
         document.getElementById('category').focus();
        return;
    }
     if (!transactionData.date) {
        alert('אנא בחר תאריך.');
         document.getElementById('date').focus();
        return;
    }
    // --- End Validation ---

    saveTransaction({ ...transactionData, amount: amount }); // Use saveTransaction for add/update
    closeModal();
});


// --- Event Delegation for Edit/Delete Buttons ---
transactionsListEl.addEventListener('click', (event) => {
    const target = event.target;
    const deleteButton = target.closest('.delete'); // Find closest delete button
    const editButton = target.closest('.edit'); // Find closest edit button

    if (deleteButton) {
        const id = deleteButton.dataset.id;
        if (id && confirm(`האם אתה בטוח שברצונך למחוק תנועה זו?`)) {
            deleteTransaction(id);
        }
    } else if (editButton) {
        const id = editButton.dataset.id;
        const transactionToEdit = transactions.find(tx => tx.id === parseInt(id));
        if (transactionToEdit) {
            openModal(transactionToEdit); // Open modal in Edit mode
        } else {
            console.error("Transaction not found for editing:", id);
        }
    }
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
    loadAllData();
    render();
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
