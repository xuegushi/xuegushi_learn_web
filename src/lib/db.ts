/* eslint-disable @typescript-eslint/no-explicit-any */

const DB_NAME = 'poem_learn_db';
const DB_VERSION = 6;

export const STORES = {
  POEMS: 'poems',
  PINYIN: 'pinyin',
  POEM_STUDY: 'poem_study',
  POEM_STUDY_SUMMARY: 'poem_study_summary',
  USERS: 'users',
  RECITE_DETAIL: 'recite_detail',
  RECITE_SUMMARY: 'recite_summary',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

// Migrate existing data to add timestamp fields
async function migrateExistingData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.POEMS, STORES.PINYIN], 'readwrite');
    const now = new Date().toISOString();

    tx.onerror = () => reject(tx.error);

    // Migrate poems data
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

      // Migrate pinyin data after poems migration completes
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

        // Resolve after both migrations complete
        resolve();
      };

      pinyinRequest.onerror = () => reject(pinyinRequest.error);
    };

    poemRequest.onerror = () => reject(poemRequest.error);
  });
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const newVersion = event.newVersion;

      // Version 1 to 2 migration: add timestamp fields while preserving data
      if (oldVersion < 2) {
        // Handle POEMS store
        if (!db.objectStoreNames.contains(STORES.POEMS)) {
          // Store doesn't exist, create new one
          const poemStore = db.createObjectStore(STORES.POEMS, { keyPath: 'id' });
          poemStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          poemStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        // Note: If store already exists, we can't modify its structure in onupgradeneeded
        // The migration function will handle adding missing fields to existing data

        // Handle PINYIN store
        if (!db.objectStoreNames.contains(STORES.PINYIN)) {
          // Store doesn't exist, create new one
          const pinyinStore = db.createObjectStore(STORES.PINYIN, { keyPath: 'poem_id' });
          pinyinStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          pinyinStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        // Note: If store already exists, we can't modify its structure in onupgradeneeded
        // The migration function will handle adding missing fields to existing data
      }

      // Version 2 to 3 migration: add study and summary stores
      if (oldVersion < 3) {
        // 诗词学习打卡明细表
        if (!db.objectStoreNames.contains(STORES.POEM_STUDY)) {
          const studyStore = db.createObjectStore(STORES.POEM_STUDY, { keyPath: 'id', autoIncrement: true });
          studyStore.createIndex('userId', 'user_id', { unique: false });
          studyStore.createIndex('poemId', 'poem_id', { unique: false });
          studyStore.createIndex('checkInTime', 'check_in_time', { unique: false });
        }

        // 诗词学习打卡汇总表
        if (!db.objectStoreNames.contains(STORES.POEM_STUDY_SUMMARY)) {
          const summaryStore = db.createObjectStore(STORES.POEM_STUDY_SUMMARY, { keyPath: 'id', autoIncrement: true });
          summaryStore.createIndex('userId', 'user_id', { unique: false });
          summaryStore.createIndex('poemId', 'poem_id', { unique: false });
        }
      }

      // Version 3 to 4 migration: add users store
      if (oldVersion < 4) {
        // 用户表
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id', autoIncrement: true });
          userStore.createIndex('userName', 'user_name', { unique: false });
        }
      }

      // Version 4 to 5: poem_study_summary 新增 count 字段（打卡次数）
      // IndexedDB 为 schema-less，无需修改表结构，插入数据时包含 count 字段即可

      // Version 5 to 6: 新增背诵明细和汇总表
      if (oldVersion < 6) {
        // 背诵明细表
        if (!db.objectStoreNames.contains(STORES.RECITE_DETAIL)) {
          const detailStore = db.createObjectStore(STORES.RECITE_DETAIL, { keyPath: 'id', autoIncrement: true });
          detailStore.createIndex('userId', 'user_id', { unique: false });
          detailStore.createIndex('poemId', 'poem_id', { unique: false });
          detailStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 背诵汇总表
        if (!db.objectStoreNames.contains(STORES.RECITE_SUMMARY)) {
          const summaryStore = db.createObjectStore(STORES.RECITE_SUMMARY, { keyPath: 'id', autoIncrement: true });
          summaryStore.createIndex('userId', 'user_id', { unique: false });
          summaryStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      }
    };
  });

  // Always run migration to ensure existing data has timestamp fields
  dbPromise.then(async (db) => {
    try {
      await migrateExistingData(db);
    } catch (e) {
      console.warn('Migration failed:', e);
    }
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
      const tx = db.transaction([
        STORES.POEMS,
        STORES.PINYIN,
        STORES.POEM_STUDY,
        STORES.POEM_STUDY_SUMMARY,
        STORES.USERS,
        STORES.RECITE_DETAIL,
        STORES.RECITE_SUMMARY,
      ], 'readwrite');
      tx.objectStore(STORES.POEMS).clear();
      tx.objectStore(STORES.PINYIN).clear();
      tx.objectStore(STORES.POEM_STUDY).clear();
      tx.objectStore(STORES.POEM_STUDY_SUMMARY).clear();
      tx.objectStore(STORES.USERS).clear();
      tx.objectStore(STORES.RECITE_DETAIL).clear();
      tx.objectStore(STORES.RECITE_SUMMARY).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silent fail
  }
}

/**
 * 获取 IndexedDB 数据库大小（估算）
 */
export async function getDBSize(): Promise<{ bytes: number; mb: string }> {
  try {
    await openDB();
    let totalBytes = 0;

    // 获取所有数据并计算大小
    const stores = [STORES.POEMS, STORES.PINYIN, STORES.POEM_STUDY, STORES.POEM_STUDY_SUMMARY, STORES.USERS, STORES.RECITE_DETAIL, STORES.RECITE_SUMMARY];
    for (const storeName of stores) {
      const data = await getAllFromDB(storeName);
      const jsonString = JSON.stringify(data);
      totalBytes += new TextEncoder().encode(jsonString).length;
    }

    const mb = (totalBytes / (1024 * 1024)).toFixed(2);
    return { bytes: totalBytes, mb };
  } catch {
    return { bytes: 0, mb: '0.00' };
  }
}

