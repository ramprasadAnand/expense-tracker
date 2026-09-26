const API_URL =
    "https://script.google.com/macros/s/AKfycbwi1wk_5LYnCVZLMLE67981LgmVxp-htonn2mVLyhys6LjC9tpb_NPgkhRVznvpHmxw/exec";

const CACHE_KEY = "expenseTrackerData";

let cachedData = null;
let fetchPromise = null;

function loadFromSessionStorage() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveToSessionStorage(data) {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

function clearCache() {
    cachedData = null;
    sessionStorage.removeItem(CACHE_KEY);
}

async function fetchFromApi() {
    const response = await fetch(API_URL);
    const data = await response.json();

    cachedData = {
        expenses: data.expenses || [],
        budgets: data.budgets || []
    };

    saveToSessionStorage(cachedData);
    return cachedData;
}

async function fetchAppData({ forceRefresh = false } = {}) {
    if (!forceRefresh) {
        if (cachedData) {
            return cachedData;
        }

        const stored = loadFromSessionStorage();
        if (stored) {
            cachedData = stored;
            return cachedData;
        }
    } else {
        clearCache();
    }

    if (!fetchPromise) {
        fetchPromise = fetchFromApi().finally(() => {
            fetchPromise = null;
        });
    }

    return fetchPromise;
}

async function fetchExpenses(options) {
    const data = await fetchAppData(options);
    return data.expenses;
}

function formatExpenseDate(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function createExpenseItem(expense) {
    const item = document.createElement("div");

    item.style.padding = "14px 0";
    item.style.borderBottom = "1px solid #eee";

    item.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
        ">
            <div>
                <div style="
                    font-size:17px;
                    font-weight:600;
                ">
                    ${expense.subCategory || expense.category || "Expense"}
                </div>

                <div style="
                    font-size:13px;
                    color:#777;
                    margin-top:4px;
                ">
                    ${formatExpenseDate(expense.date)} · ${expense.category}
                </div>

                ${expense.note
                    ? `
                <div style="
                    font-size:13px;
                    color:#777;
                    margin-top:4px;
                ">
                    ${expense.note}
                </div>
                `
                    : ""
                }
            </div>

            <div style="
                font-size:18px;
                font-weight:600;
            ">
                ₹${expense.amount}
            </div>
        </div>
    `;

    return item;
}
