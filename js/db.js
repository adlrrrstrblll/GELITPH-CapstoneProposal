import { validateRecord, assertPairing } from './validation.js';

let databasePromise;
export function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error('This browser does not support IndexedDB.'));
    const request = indexedDB.open('balikbayan-box', 1);
    request.onupgradeneeded = () => {
      const stories = request.result.createObjectStore('stories', { keyPath: 'id' });
      stories.createIndex('pairId', 'pairId', { unique: false });
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other exhibit tabs, then reload to open local storage.'));
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => { database.close(); databasePromise = undefined; };
      resolve(database);
    };
  });
  return databasePromise;
}

export async function getStories() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('stories', 'readonly');
    const request = transaction.objectStore('stories').getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Completion of the transaction, not just of a request, confirms the write.
// Pair checks and writes share one transaction, including across browser tabs.
async function writeStories(records, merging) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('stories', 'readwrite');
    const store = transaction.objectStore('stories');
    let failure;
    let result = { added: 0, skipped: 0 };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(failure || transaction.error);
    transaction.onabort = () => reject(failure || transaction.error || new Error('The save was cancelled.'));
    const request = store.getAll();
    request.onsuccess = () => {
      try {
        const existing = request.result;
        const byId = new Map(existing.map(story => [story.id, story]));
        const incomingIds = new Set();
        const toWrite = [];
        for (const record of records) {
          const story = validateRecord(record);
          if (incomingIds.has(story.id)) throw new Error('The backup contains duplicate story IDs.');
          incomingIds.add(story.id);
          if (merging && byId.has(story.id)) { result.skipped++; continue; }
          byId.set(story.id, story);
          toWrite.push(story);
        }
        assertPairing([...byId.values()]);
        for (const story of toWrite) store.put(story);
        result.added = toWrite.length;
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };
  });
}

export const saveStory = story => writeStories([story], false);
export const mergeStories = stories => writeStories(stories, true);

export async function deleteStory(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('stories', 'readwrite');
    transaction.objectStore('stories').delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
