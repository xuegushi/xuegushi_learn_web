/* eslint-disable @typescript-eslint/no-explicit-any */

const DB_NAME = 'poem_learn_db';
const DB_VERSION = 9;

export const STORES = {
  POEMS: 'poems',
  PINYIN: 'pinyin',
  POEM_STUDY: 'poem_study',
  POEM_STUDY_SUMMARY: 'poem_study_summary',
  USERS: 'users',
  RECITE_DETAIL: 'recite_detail',
  RECITE_SUMMARY: 'recite_summary',
  LEARNING_PROGRESS: 'learning_progress',
  RECITE_TIME_STATS: 'recite_time_stats',
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

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      // 检查版本是否正确
      if (db.version !== DB_VERSION) {
        db.close();
        dbPromise = null;
        // 重新打开以触发版本升级
        openDB().then(resolve).catch(reject);
        return;
      }
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

        // 学习进度表
        if (!db.objectStoreNames.contains(STORES.LEARNING_PROGRESS)) {
          const progressStore = db.createObjectStore(STORES.LEARNING_PROGRESS, { keyPath: 'id', autoIncrement: true });
          progressStore.createIndex('userId', 'user_id', { unique: false });
          progressStore.createIndex('poemId', 'poem_id', { unique: false });
          progressStore.createIndex('userPoem', ['user_id', 'poem_id'], { unique: true });
        }
      }

      // Version 7 to 8: 新增背诵时间统计表
      if (oldVersion < 8) {
        console.log('升级到版本 8，创建 recite_time_stats 表');
        if (!db.objectStoreNames.contains(STORES.RECITE_TIME_STATS)) {
          const timeStatsStore = db.createObjectStore(STORES.RECITE_TIME_STATS, { keyPath: 'id', autoIncrement: true });
          timeStatsStore.createIndex('userId', 'user_id', { unique: false });
          timeStatsStore.createIndex('poemId', 'poem_id', { unique: false });
          timeStatsStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('recite_time_stats 表创建成功');
        }
      }

      // 检查 recite_time_stats 表是否存在，如果不存在则创建
      if (!db.objectStoreNames.contains(STORES.RECITE_TIME_STATS)) {
        console.log('检测到 recite_time_stats 表不存在，正在创建...');
        const timeStatsStore = db.createObjectStore(STORES.RECITE_TIME_STATS, { keyPath: 'id', autoIncrement: true });
        timeStatsStore.createIndex('userId', 'user_id', { unique: false });
        timeStatsStore.createIndex('poemId', 'poem_id', { unique: false });
        timeStatsStore.createIndex('createdAt', 'createdAt', { unique: false });
        console.log('recite_time_stats 表创建成功');
      }
    };
  });

  // 检查并确保 recite_time_stats 表存在
  dbPromise.then(async (db) => {
    if (!db.objectStoreNames.contains(STORES.RECITE_TIME_STATS)) {
      console.log('数据库中不存在 recite_time_stats 表，需要关闭并重新打开以升级');
      db.close();
      dbPromise = null;
      const newDb = await openDB();
      console.log('数据库已升级，recite_time_stats 表应已创建', newDb.objectStoreNames);
    }
    try {
      const currentDb = await openDB();
      await migrateExistingData(currentDb);
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

// Patch 4H: Clear all recite-related records (recite_detail and recite_summary)
export async function clearReciteRecords(): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORES.RECITE_DETAIL, STORES.RECITE_SUMMARY], 'readwrite');
      tx.objectStore(STORES.RECITE_DETAIL).clear();
      tx.objectStore(STORES.RECITE_SUMMARY).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

// Patch 4H: Export recite records as JSON for download
export async function exportReciteRecordsJson(): Promise<void> {
  try {
    const details = await getAllFromDB<any>(STORES.RECITE_DETAIL);
    const summaries = await getAllFromDB<any>(STORES.RECITE_SUMMARY);
    const payload = { recite_detail: details, recite_summary: summaries };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recite_records.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

 // Patch 4H duplicates removed

// Patch 3: 背诵记录写入接口
export async function addReciteDetail(detail: any): Promise<void> {
  try {
    await setToDB<any>(STORES.RECITE_DETAIL, detail);
  } catch {
    // ignore
  }
}

export async function addReciteSummary(summary: any): Promise<void> {
  try {
    await setToDB<any>(STORES.RECITE_SUMMARY, summary);
  } catch {
    // ignore
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

// Learning Progress interfaces and functions
export interface LearningProgress {
  id?: number;
  user_id: string;
  poem_id: string;
  learn_count: number;
  correct_count: number;
  wrong_count: number;
  mastery_level: number;
  last_learned_at: string;
  createdAt: string;
  updatedAt: string;
}

export async function getLearningProgress(userId: string, poemId: string): Promise<LearningProgress | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.LEARNING_PROGRESS, 'readonly');
      const store = tx.objectStore(STORES.LEARNING_PROGRESS);
      const index = store.index('userPoem');
      const request = index.get([userId, poemId]);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function getAllLearningProgress(userId: string): Promise<LearningProgress[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.LEARNING_PROGRESS, 'readonly');
      const store = tx.objectStore(STORES.LEARNING_PROGRESS);
      const index = store.index('userId');
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function updateLearningProgress(
  userId: string,
  poemId: string,
  isCorrect: boolean
): Promise<void> {
  try {
    const existing = await getLearningProgress(userId, poemId);
    const now = new Date().toISOString();

    if (existing) {
      const updated: LearningProgress = {
        ...existing,
        learn_count: existing.learn_count + 1,
        correct_count: isCorrect ? existing.correct_count + 1 : existing.correct_count,
        wrong_count: !isCorrect ? existing.wrong_count + 1 : existing.wrong_count,
        mastery_level: Math.min(100, Math.round(((existing.correct_count + (isCorrect ? 1 : 0)) / (existing.learn_count + 1)) * 100)),
        last_learned_at: now,
        updatedAt: now,
      };
      await setToDB(STORES.LEARNING_PROGRESS, updated);
    } else {
      const newProgress: LearningProgress = {
        user_id: userId,
        poem_id: poemId,
        learn_count: 1,
        correct_count: isCorrect ? 1 : 0,
        wrong_count: isCorrect ? 0 : 1,
        mastery_level: isCorrect ? 100 : 0,
        last_learned_at: now,
        createdAt: now,
        updatedAt: now,
      };
      await setToDB(STORES.LEARNING_PROGRESS, newProgress);
    }
  } catch {
    // ignore
  }
}

// 背诵时间统计
export interface ReciteTimeStat {
  id?: number;
  user_id: number;
  user_name: string;
  poem_id: number;
  title: string;
  author: string;
  recite_spend: number; // 秒
  createdAt: string;
}

export async function addReciteTimeStat(stat: Omit<ReciteTimeStat, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const data = {
      ...stat,
      createdAt: new Date().toISOString(),
    };
    console.log('addReciteTimeStat 开始保存:', data);
    
    await setToDB<ReciteTimeStat>(STORES.RECITE_TIME_STATS, data);
    
    console.log('addReciteTimeStat 保存成功');
    return true;
  } catch (error) {
    console.error('addReciteTimeStat 失败:', error);
    return false;
  }
}

export async function getReciteTimeStatsByPoem(
  poemId: number,
  userId?: number | string
): Promise<ReciteTimeStat[]> {
  try {
    console.log('getReciteTimeStatsByPoem 查询:', { poemId, userId });
    const all = await getAllFromDB<ReciteTimeStat>(STORES.RECITE_TIME_STATS);
    console.log('getReciteTimeStatsByPoem 全部数据:', all);
    
    const filtered = all
      .filter(s => {
        const poemMatch = s.poem_id === poemId;
        if (!userId) return poemMatch;
        // 兼容 user_id 类型可能是 string 或 number
        const userMatch = String(s.user_id) === String(userId);
        return poemMatch && userMatch;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    console.log('getReciteTimeStatsByPoem 过滤后:', filtered);
    return filtered;
  } catch {
    return [];
  }
}
