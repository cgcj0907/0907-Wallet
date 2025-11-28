// app/lib/storage.ts
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = '0907wallet-db';

// ======================
// 初始化数据库
// ======================
export async function initDB(): Promise<IDBPDatabase> {
  let db: IDBPDatabase;

  try {
    // 尝试打开已有数据库
    db = await openDB(DB_NAME);
  } catch {
    // 数据库不存在 → 创建初始版本
    db = await openDB(DB_NAME, 1, {
      upgrade(upgradeDb) {
        // 初始逻辑，动态创建表交给 ensureStore
      }
    });
  }

  return db;
}
// ======================
// ArrayBuffer <-> base64 工具
// ======================
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ======================
// 预处理表：不存在则自动创建
// ======================
async function ensureStore(db: any, storeName: string) {
  if (!db.objectStoreNames.contains(storeName)) {
    // 关闭数据库重新升级版本创建表
    db.close();
    const newVersion = db.version + 1;
    return openDB(DB_NAME, newVersion, {
      upgrade(upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains(storeName)) {
          upgradeDb.createObjectStore(storeName);
        }
      }
    });
  }
  return db;
}

// ======================
// 通用 Key-Value API（带表名）
// ======================
export async function get(key: string, table = 'users'): Promise<any> {
  let db = await initDB();
  db = await ensureStore(db, table);
  return db.get(table, key);
}

export async function set(key: string, value: any, table = 'users'): Promise<void> {
  let db = await initDB();
  db = await ensureStore(db, table);
  await db.put(table, value, key);
}

export async function del(key: string, table = 'users'): Promise<void> {
  let db = await initDB();
  db = await ensureStore(db, table);
  await db.delete(table, key);
}

export async function clear(table = 'users'): Promise<void> {
  let db = await initDB();
  db = await ensureStore(db, table);
  await db.clear(table);
}

export async function keys(table = 'users'): Promise<IDBValidKey[]> {
  let db = await initDB();
  db = await ensureStore(db, table);
  return db.getAllKeys(table);
}

export async function values(table = 'users'): Promise<any[]> {
  const db = await initDB();
  await ensureStore(db, table);
  return db.getAll(table); // 返回所有实体
}

// 获取某个表的记录数量
export async function count(table = 'users'): Promise<number> {
  let db = await initDB();
  db = await ensureStore(db, table);
  return db.count(table);
}

