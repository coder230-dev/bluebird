// website/accounts/databaseInfo.js
// Supabase configuration and simple database helpers.
// Replace these values with your Supabase project URL and anon key.


const SUPABASE_URL = 'https://akypcbfljgwhzjryztzo.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_CbSkAPp5Chs5JfAgTLRNpw_q_z9Nd6N'

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Local Account

function openLocalDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("bluebird_local_accounts", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("local_accounts")) {
                db.createObjectStore("local_accounts", { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function openLocalDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("bluebird_local_accounts", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("local_accounts")) {
                db.createObjectStore("local_accounts", { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function createLocalAccount({ username, name, password }) {
    const db = await openLocalDB();
    const password_hash = await hashPassword(password);

    return new Promise((resolve, reject) => {
        const tx = db.transaction("local_accounts", "readwrite");
        const store = tx.objectStore("local_accounts");

        const id = crypto.randomUUID();
        const data = {
            id,
            username,
            name,
            password_hash,
            settings: {},
            saved_data: {},
            created_at: Date.now()
        };

        const request = store.add(data);

        request.onsuccess = () => resolve(data);
        request.onerror = () => reject(request.error);
    });
}

async function loginLocalAccount(username, password) {
    const db = await openLocalDB();
    const password_hash = await hashPassword(password);

    return new Promise((resolve, reject) => {
        const tx = db.transaction("local_accounts", "readonly");
        const store = tx.objectStore("local_accounts");

        const request = store.getAll();

        request.onsuccess = () => {
            const accounts = request.result;
            const user = accounts.find(acc => acc.username === username);

            if (!user) return resolve(null);

            if (user.password_hash === password_hash) {
                resolve(user);
            } else {
                resolve(null);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

async function updateLocalAccount(id, updates) {
    const db = await openLocalDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("local_accounts", "readwrite");
        const store = tx.objectStore("local_accounts");

        const getReq = store.get(id);

        getReq.onsuccess = () => {
            const data = { ...getReq.result, ...updates };
            const putReq = store.put(data);

            putReq.onsuccess = () => resolve(data);
            putReq.onerror = () => reject(putReq.error);
        };

        getReq.onerror = () => reject(getReq.error);
    });
}

async function deleteLocalAccountSecure(username, password) {
    const db = await openLocalDB();
    const password_hash = await hashPassword(password);

    return new Promise((resolve, reject) => {
        const tx = db.transaction("local_accounts", "readwrite");
        const store = tx.objectStore("local_accounts");

        const request = store.getAll();

        request.onsuccess = () => {
            const accounts = request.result;
            const user = accounts.find(acc => acc.username === username);

            if (!user) return resolve({ success: false, reason: "not_found" });
            if (user.password_hash !== password_hash)
                return resolve({ success: false, reason: "invalid_password" });

            const deleteReq = store.delete(user.id);

            deleteReq.onsuccess = () => resolve({ success: true });
            deleteReq.onerror = () => reject(deleteReq.error);
        };

        request.onerror = () => reject(request.error);
    });
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getLocalAccountByUsername(username) {
    const db = await openLocalDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("local_accounts", "readonly");
        const store = tx.objectStore("local_accounts");

        const request = store.getAll();

        request.onsuccess = () => {
            const accounts = request.result;
            const match = accounts.find(acc => acc.username === username);
            resolve(match || null);
        };

        request.onerror = () => reject(request.error);
    });
}

async function verifyLocalAccount(username, password) {
    const db = await openLocalDB();
    const password_hash = await hashPassword(password);

    return new Promise((resolve, reject) => {
        const tx = db.transaction("local_accounts", "readonly");
        const store = tx.objectStore("local_accounts");

        const request = store.getAll();

        request.onsuccess = () => {
            const accounts = request.result;
            const user = accounts.find(acc => acc.username === username);

            if (!user) {
                return resolve({
                    success: false,
                    reason: "username_not_found"
                });
            }

            if (user.password_hash !== password_hash) {
                return resolve({
                    success: false,
                    reason: "invalid_password"
                });
            }

            resolve({
                success: true,
                user
            });
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Fetch rows from a Supabase table.
 * @param {string} table
 * @param {string} columns
 * @returns {Promise<any[]|[]>}
 */
async function fetchTable(table, columns = '*') {
    const { data, error } = await supabaseClient
        .from(table)
        .select(columns)

    if (error) {
        console.error(`Supabase fetch error for ${table}:`, error)
        return []
    }

    return data
}

/**
 * Insert a row into a Supabase table.
 * @param {string} table
 * @param {Object} row
 * @returns {Promise<any|null>}
 */
async function insertRow(table, row) {
    const { data, error } = await supabaseClient
        .from(table)
        .insert(row)
        .select()

    if (error) {
        console.error(`Supabase insert error for ${table}:`, error)
        return null
    }

    return data ? data[0] : null
}

/**
 * Fetch a single row by equality match.
 * @param {string} table
 * @param {string} column
 * @param {any} value
 * @returns {Promise<any|null>}
 */
async function fetchRowBy(table, column, value) {
    const { data, error } = await supabaseClient
        .from(table)
        .select('*')
        .eq(column, value)
        .single()

    if (error) {
        console.error(`Supabase fetchRowBy error for ${table}.${column}:`, error)
        return null
    }

    return data
}


const notificationQueue = [];
let isDisplaying = false;
let currentTimeout = ''

function displayNotification(message, icon = '', timeout = 5000, priority = 1) {
    const newNote = { message, icon, timeout, priority };
    notificationQueue.push(newNote);
    processQueue();
}

function processQueue() {
    if (isDisplaying || notificationQueue.length === 0) return;

    const next = notificationQueue.shift();
    const { message, icon, timeout } = next;

    const notification = document.createElement('notification');
    document.body.appendChild(notification);
    notification.classList.add('notification');
    notification.innerHTML = icon + message;
    requestAnimationFrame(() => {
        notification.style.transform = 'translate(-50%, -25px)';
    });

    isDisplaying = true;

    currentTimeout = setTimeout(() => {
        notification.style.transform = 'translate(-50%, 100%)';
        setTimeout(() => {
            isDisplaying = false;
            processQueue();
            notification.remove();
        }, 300);
    }, timeout);
}

async function logOutUser() {
    const { error } = await supabaseClient.auth.signOut();
    localStorage.removeItem('currentUser');
    if (error) console.error("Logout error:", error);

    return true;
}