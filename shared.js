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
    if (!response.ok) {
        throw new Error("Unable to reach the expense tracker API.");
    }

    const data = await response.json();

    if (data.success === false) {
        throw new Error(data.error || "Unable to load tracker data.");
    }

    cachedData = {
        expenses: data.expenses || [],
        budgets: data.budgets || [],
        sinkingFunds: data.sinkingFunds || [],
        investmentFunds: data.investmentFunds || []
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
            cachedData = {
                expenses: stored.expenses || [],
                budgets: stored.budgets || [],
                sinkingFunds: stored.sinkingFunds || [],
                investmentFunds: stored.investmentFunds || []
            };
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

function formatINR(amount) {
    return "₹" + (Number(amount) || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

async function postToApi(payload) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || "Unable to save data.");
    }

    return result;
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
                ₹${Number(expense.amount || 0).toLocaleString("en-IN")}
            </div>
        </div>
    `;

    return item;
}
