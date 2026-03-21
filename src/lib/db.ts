const DB_NAME = 'poem_learn_db';
const DB_VERSION = 2;

export const STORES = {
  POEMS: 'poems',
  PINYIN: 'pinyin',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

// Migrate existing data to add timestamp fields
async function migrateExistingData(db: IDBDatabase): Promise<void> {
  const tx = db.transaction([STORES.POEMS, STORES.PINYIN], 'readwrite');
  const now = new Date().toISOString();

  // Migrate poems data
  try {
    const poemStore = tx.objectStore(STORES.POEMS);
    const poemRequest = poemStore.getAll();

    poemRequest.onsuccess = () => {
      const poems = poemRequest.result || [];
      poems.forEach((poem: any) => {
        // Only update if timestamp fields don't exist
        if (!('createdAt' in poem) || !('updatedAt' in poem)) {
          const updatedPoem = {
            ...poem,
            updatedAt: now,
            ...(!('createdAt' in poem) && { createdAt: now })
          };
          poemStore.put(updatedPoem);
        }
      });
    };
  } catch (e) {
    console.warn('Failed to migrate poems data:', e);
  }

  // Migrate pinyin data
  try {
    const pinyinStore = tx.objectStore(STORES.PINYIN);
    const pinyinRequest = pinyinStore.getAll();

    pinyinRequest.onsuccess = () => {
      const pinyinData = pinyinRequest.result || [];
      pinyinData.forEach((item: any) => {
        // Only update if timestamp fields don't exist
        if (!('createdAt' in item) || !('updatedAt' in item)) {
          const updatedItem = {
            ...item,
            updatedAt: now,
            ...(!('createdAt' in item) && { createdAt: now })
          };
          pinyinStore.put(updatedItem);
        }
      });
    };
  } catch (e) {
    console.warn('Failed to migrate pinyin data:', e);
  }
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;

      // Run migration if needed (when DB version is upgraded)
      if (db.version < DB_VERSION) {
        migrateExistingData(db).catch(console.error);
      }

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      const newVersion = event.newVersion;

      // Version 1 to 2 migration: add timestamp fields while preserving data
      if (oldVersion < 2) {
        // Handle POEMS store
        if (!db.objectStoreNames.contains(STORES.POEMS)) {
          // Store doesn't exist, create new one
          const poemStore = db.createObjectStore(STORES.POEMS, { keyPath: 'id' });
          poemStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          poemStore.createIndex('createdAt', 'createdAt', { unique: false });
        } else {
          // Store exists, add indexes if needed
          // In onupgradeneeded, we can't directly access objectStore, so we need to check if indexes exist differently
          // For now, we'll skip index addition in upgrade and rely on the migration function
          // The migration function will handle adding missing fields to existing data
        }

      // Handle PINYIN store
        if (!db.objectStoreNames.contains(STORES.PINYIN)) {
          // Store doesn't exist, create new one
          const pinyinStore = db.createObjectStore(STORES.PINYIN, { keyPath: 'poem_id' });
          pinyinStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          pinyinStore.createIndex('createdAt', 'createdAt', { unique: false });
        } else {
          // Store exists, add indexes if needed
          // Same as above - skip index addition in upgrade, rely on migration
        }
      }
    };
  });

  return dbPromise;
}

export async function getFromDB<T>(storeName: string, key: string | number): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

export async function getAllFromDB<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch {
    return [];
  }
}

export async function deleteFromDB(storeName: string, key: string | number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Silent fail for cache deletion
  }
}

export async function setToDB<T extends object>(storeName: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      // Add timestamps
      const timestamp = new Date().toISOString();
      const dataWithTimestamp = {
        ...data,
        updatedAt: timestamp,
        // Only set createdAt if it doesn't exist (for insert operations)
        ...(!('createdAt' in data) && { createdAt: timestamp })
      };

      const request = store.put(dataWithTimestamp);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Silent fail for cache writes
  }
}

export async function clearDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.POEMS, STORES.PINYIN], 'readwrite');
      tx.objectStore(STORES.POEMS).clear();
      tx.objectStore(STORES.PINYIN).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silent fail
  }
}

