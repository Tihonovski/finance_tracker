// --- Global Variables & DOM Elements ---
let transactions = []; // Array to hold transaction objects
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

// Tab elements
const mainTabs = document.getElementById('main-tabs');
const tabButtons = mainTabs.querySelectorAll('.segment-button');
const tabPanelsContainer = document.getElementById('tab-panels-container');
const tabPanels = tabPanelsContainer.querySelectorAll('.tab-panel-content');


// --- Utility Functions ---
/**
 * Formats a number as currency in ILS.
 * @param {number} amount - The number to format.
 * @returns {string} Formatted currency string.
 */
function formatCurrency(amount) {
    // Handle potential NaN or undefined values gracefully
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
        // Ensure dateString is treated as local date, not UTC
        const [year, month, day] = dateString.split('-');
        // Note: Month is 0-indexed in JS Date constructor (0=Jan, 1=Feb, etc.)
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
         return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; // Fallback
    }
}

// --- Data Handling ---
/**
 * Loads transactions from localStorage.
 */
function loadTransactions() {
    try {
        const stored = localStorage.getItem('transactions_apple_style');
        transactions = stored ? JSON.parse(stored) : [];
        // Basic validation after parsing
        if (!Array.isArray(transactions)) {
            transactions = [];
        }
        // Ensure amounts are numbers
        transactions = transactions.map(tx => ({ ...tx, amount: parseFloat(tx.amount) || 0 }));

    } catch (e) {
        console.error("Error loading transactions from localStorage:", e);
        transactions = []; // Reset to empty array on error
    }
}

/**
 * Saves the current transactions array to localStorage.
 */
function saveTransactions() {
    try {
        localStorage.setItem('transactions_apple_style', JSON.stringify(transactions));
    } catch (e) {
        console.error("Error saving transactions to localStorage:", e);
        // Optionally notify the user that data couldn't be saved
        alert("שגיאה בשמירת הנתונים. ייתכן שהאחסון מלא.");
    }
}

/**
 * Adds a new transaction object to the global array, saves, and re-renders.
 * @param {object} tx - The transaction data object from the form.
 */
function addTransaction(tx) {
    // Create a new transaction object with a unique ID
    const newTransaction = {
        id: Date.now(), // Simple unique ID using timestamp
        type: tx.type,
        amount: parseFloat(tx.amount) || 0, // Ensure amount is a number
        description: tx.description.trim(), // Trim whitespace
        category: tx.category,
        date: tx.date,
        paymentMethod: tx.paymentMethod.trim() || '' // Trim whitespace, default to empty
    };
    transactions.push(newTransaction);
    saveTransactions();
    render(); // Re-render everything
}

// --- Rendering ---

/** Renders the list of transactions */
function renderTransactionsList() {
    transactionsListEl.innerHTML = ''; // Clear list content first
    transactionsListEl.appendChild(emptyListMessageEl); // Re-add the empty message template

    if (!Array.isArray(transactions) || transactions.length === 0) {
        emptyListMessageEl.style.display = 'block'; // Show empty message
        return;
    }

    emptyListMessageEl.style.display = 'none'; // Hide empty message if we have transactions

    // Sort newest first based on date, then by ID (timestamp) as a tie-breaker
    const sorted = [...transactions].sort((a, b) => {
        const dateComparison = new Date(b.date) - new Date(a.date);
        if (dateComparison !== 0) {
            return dateComparison;
        }
        return b.id - a.id; // Newest ID first if dates are the same
    });


    sorted.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.dataset.id = tx.id; // Add ID for potential future actions (delete/edit)

        const isIncome = tx.type === 'income';
        const amountClass = isIncome ? 'income' : 'expense';
        const amountPrefix = isIncome ? '+' : '-';

        // Determine icon and background color based on type and category
        let iconBg = 'bg-gray-400'; // Default gray
        let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>`; // Tag icon default

        if (isIncome) {
            iconBg = 'bg-green-500'; // Apple Green
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.879A3 3 0 1 0 15 15.182l.879-.879M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" /></svg>`; // Income icon (e.g., coin)
        } else {
            // Expense category icons
            switch (tx.category) {
                case 'מזון':
                    iconBg = 'bg-orange-500';
                    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>`; // Food icon
                    break;
                case 'דיור':
                    iconBg = 'bg-blue-500';
                    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`; // Housing icon
                    break;
                case 'תחבורה':
                     iconBg = 'bg-purple-500';
                     iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0c-.566.058-.987.538-.987 1.106v.958m12.026 11.177h-12.026" /></svg>`; // Transport icon
                    break;
                case 'בילויים':
                    iconBg = 'bg-pink-500';
                    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`; // Placeholder - maybe popcorn/ticket/star
                    break;
                 case 'חשבונות ומנויים':
                     iconBg = 'bg-cyan-500';
                     iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>`; // Bill/Receipt icon
                    break;
                // Add more cases for other categories
                default:
                    iconBg = 'bg-red-500'; // Default expense color
                    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.75A.75.75 0 0 1 2.25 4.5h.75m0 0H21m-18.75 0H9.167a1.125 1.125 0 0 1 1.125 1.125v1.125c0 .621-.504 1.125-1.125 1.125H2.25v-2.25Z" /></svg>`; // Generic expense icon
            }
        }


        item.innerHTML = `
            <div class="transaction-icon ${iconBg}">
               ${iconSvg}
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${tx.description || 'אין תיאור'}</div>
                <div class="transaction-category">${tx.category || 'ללא קטגוריה'} - ${formatDate(tx.date)}</div>
                 ${tx.paymentMethod ? `<div class="text-xs text-gray-500">${tx.paymentMethod}</div>` : ''}
            </div>
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
    const currentMonth = now.getMonth(); // 0-indexed (0 = January)
    const currentYear = now.getFullYear();

    let totalIncome = 0;
    let totalExpenses = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    transactions.forEach(tx => {
         // Ensure amount is a number before calculations
         const amount = parseFloat(tx.amount);
         if (isNaN(amount)) return; // Skip if amount is not a valid number

         // Use UTC methods to avoid timezone pitfalls when comparing dates only
         const txDate = new Date(tx.date + 'T00:00:00Z'); // Treat date as UTC midnight
         const txMonth = txDate.getUTCMonth();
         const txYear = txDate.getUTCFullYear();

         if (tx.type === 'income') {
             totalIncome += amount;
             // Check if the transaction is from the current month and year
             if (txYear === currentYear && txMonth === currentMonth) {
                 monthlyIncome += amount;
             }
         } else if (tx.type === 'expense') {
             totalExpenses += amount;
             // Check if the transaction is from the current month and year
              if (txYear === currentYear && txMonth === currentMonth) {
                 monthlyExpenses += amount;
             }
         }
     });

    const balance = totalIncome - totalExpenses;

    // Update HTML elements using the formatting function
    summaryBalanceEl.textContent = formatCurrency(balance);
    summaryIncomeEl.textContent = formatCurrency(monthlyIncome);
    summaryExpensesEl.textContent = formatCurrency(monthlyExpenses);
}

/** Renders all parts of the UI that depend on transaction data */
function render() {
    renderTransactionsList();
    updateSummary();
    // Future: renderBudgets(); renderRecurring();
}


// --- Modal Handling ---
/** Opens the transaction modal */
function openModal() {
    transactionForm.reset(); // Clear form
    // Set default date to today in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Add 1 because month is 0-indexed, pad with 0
    const day = today.getDate().toString().padStart(2, '0');
    document.getElementById('date').value = `${year}-${month}-${day}`;
    // Set default type to expense
    transactionForm.elements.transactionType.value = 'expense';
    modal.style.display = 'flex'; // Use flex to enable centering
    // Optional: Focus the first relevant field
    document.getElementById('amount').focus();
}

/** Closes the transaction modal */
function closeModal() {
    modal.style.display = 'none';
}

// Event listeners for modal open/close
openModalButtonHeader.addEventListener('click', openModal);
closeModalButton.addEventListener('click', closeModal);
// Close modal if clicking the background overlay
modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

// --- Form Handling ---
transactionForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent default form submission (page reload)

    const formData = new FormData(transactionForm);
    const newTransactionData = {
        type: formData.get('transactionType'),
        amount: formData.get('amount'), // Keep as string initially for validation
        description: formData.get('description'),
        category: formData.get('category'),
        date: formData.get('date'),
        paymentMethod: formData.get('paymentMethod') || '' // Handle optional field
    };

    // --- Basic Input Validation ---
    const amount = parseFloat(newTransactionData.amount);
    if (isNaN(amount) || amount <= 0) {
        alert('אנא הזן סכום חיובי תקין.');
        document.getElementById('amount').focus(); // Focus the amount field
        return; // Stop processing
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


    // If validation passes, add the transaction (amount is already parsed)
    addTransaction({ ...newTransactionData, amount: amount }); // Pass validated data

    closeModal(); // Close modal after successful submission
});


// --- Tab/Segment Handling ---
 tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        // Update button active state
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update panel visibility
        tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${targetTab}-panel`);
        });
    });
});


// --- Initial Load ---
/**
 * Runs when the page content is fully loaded.
 * Loads data, renders the UI, and sets up initial state.
 */
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    render(); // Initial render of list and summary
     // Ensure the first tab is active visually and its panel is shown
     if(tabButtons.length > 0) {
         // Remove active class from all first, then add to the first one
         tabButtons.forEach(btn => btn.classList.remove('active'));
         tabPanels.forEach(panel => panel.classList.remove('active'));

         tabButtons[0].classList.add('active');
         const firstPanelId = `tab-${tabButtons[0].getAttribute('data-tab')}-panel`;
         const firstPanel = document.getElementById(firstPanelId);
         if (firstPanel) {
             firstPanel.classList.add('active');
         }
     }
});
