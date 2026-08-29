// --- db.js ---
// IndexedDB-backed storage for manual per-transaction category overrides.
// Uses IndexedDB instead of localStorage because the number of transactions
// (and thus overrides) can grow into the thousands over time - far beyond
// what's comfortable to keep as one big JSON blob in localStorage.

const DB_NAME = 'moneyMoneyAnalyzer';
const DB_VERSION = 1;
const STORE = 'categoryOverrides';

let dbPromise = null;

function open_db() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE); // keyed by transaction id (see data.js#tx_id)
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

// Loads every stored override as a plain { txId: category } map, so
// classification can look overrides up synchronously per row.
export async function load_all_overrides() {
  const db = await open_db();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, 'readonly').objectStore(STORE);
    const overrides = {};
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        overrides[cursor.key] = cursor.value;
        cursor.continue();
      } else {
        resolve(overrides);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Persists one or more (txId, category) overrides in a single transaction -
// used for both single-row edits and bulk assignment to selected rows.
export async function save_overrides(idCategoryPairs) {
  const db = await open_db();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    idCategoryPairs.forEach(([id, category]) => store.put(category, id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
