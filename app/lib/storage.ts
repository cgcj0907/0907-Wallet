// app/lib/storage.ts
/**
 * @file IndexedDB 轻量封装工具（按需懒创建 objectStore）
 * @description 提供类似 localStorage 的简洁 API，支持自动升级版本创建表，避免预设 schema
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = '0907wallet-db';
const DEFAULT_STORE_NAME = 'users';

/**
 * 初始化（或打开）IndexedDB 数据库
 *
 * 数据库不存在时会自动创建版本 1，且不预创建任何 objectStore，
 * 所有表都通过 ensureStore 按需懒创建，保持最小的初始 schema。
 *
 * @returns IndexedDB 数据库实例
 * @example
 * const db = await initDB();
 */
export async function initDB(): Promise<IDBPDatabase> {
  let db: IDBPDatabase;

  try {
    // 优先尝试打开已有数据库（会自动使用当前最高版本）
    db = await openDB(DB_NAME);
  } catch {
    // 数据库完全不存在 → 创建版本 1（此时不创建任何表）
    db = await openDB(DB_NAME, 1, {
      upgrade(upgradeDb) {
        // 故意留空：所有 objectStore 都按需动态创建
      },
    });
  }

  return db;
}

/**
 * 确保指定名称的 objectStore 存在（内部私有函数）
 *
 * 如果表不存在，会关闭当前连接 → 版本 +1 → 在 upgrade 事务中创建表。
 * 这是 IndexedDB 的硬性限制：只有 versionchange 事务才能创建/删除 objectStore。
 *
 * @param db        当前数据库实例
 * @param storeName 要确保存在的表名
 * @returns 包含该表的最新数据库实例
 */
async function ensureObjectStoreExists(
  db: IDBPDatabase,
  storeName: string,
): Promise<IDBPDatabase> {
  if (db.objectStoreNames.contains(storeName)) {
    return db; // 表已存在，直接返回当前连接
  }

  // 为什么必须先 close？
  // IndexedDB 只有在 versionchange 事务中才能创建 objectStore，
  // 当前连接已处于普通事务，无法创建新表，必须关闭后以更高版本重新打开。
  db.close();

  const newVersion = db.version + 1;

  return openDB(DB_NAME, newVersion, {
    upgrade(upgradeDb) {
      if (!upgradeDb.objectStoreNames.contains(storeName)) {
        // 创建一个普通 key-value 表（key 为 string，value 任意结构化克隆对象）
        upgradeDb.createObjectStore(storeName);
      }
    },
  });
}

/**
 * 根据 key 从指定表中读取数据
 *
 * @param key       键名
 * @param table     表名，默认为 'users'
 * @returns         对应的值，若不存在返回 undefined
 * @example
 * const user = await get('currentUser');
 */
export async function get<T = unknown>(
  key: string,
  table: string = DEFAULT_STORE_NAME,
): Promise<T | undefined> {
  let db: IDBPDatabase;
  try {
    db = await initDB();
    db = await ensureObjectStoreExists(db, table);
    return await db.get(table, key);
  } catch (error) {
    console.error(`[Storage] get(${key}, ${table}) 失败:`, error);
    throw error;
  }
}

/**
 * 向指定表中写入或更新数据
 *
 * @param key       键名
 * @param value     要存储的值（必须支持结构化克隆）
 * @param table     表名，默认为 'users'
 * @example
 * await set('currentUser', { address: '0x...', name: 'Alice' });
 */
export async function set<T = unknown>(
  key: string,
  value: T,
  table: string = DEFAULT_STORE_NAME,
): Promise<void> {
  let db: IDBPDatabase;
  try {
    db = await initDB();
    db = await ensureObjectStoreExists(db, table);
    await db.put(table, value as any, key); // put 支持新增或覆盖
  } catch (error) {
    console.error(`[Storage] set(${key}, ${table}) 失败:`, error);
    throw error;
  }
}

/**
 * 根据 key 删除指定表中的记录
 *
 * @param key    键名
 * @param table  表名，默认为 'users'
 */
export async function del(
  key: string,
  table: string = DEFAULT_STORE_NAME,
): Promise<void> {
  let db: IDBPDatabase;
  try {
    db = await initDB();
    db = await ensureObjectStoreExists(db, table);
    await db.delete(table, key);
  } catch (error) {
    console.error(`[Storage] del(${key}, ${table}) 失败:`, error);
    throw error;
  }
}

/**
 * 清空指定表的所有记录
 *
 * @param table  表名，默认为 'users'
 */
export async function clear(table: string = DEFAULT_STORE_NAME): Promise<void> {
  let db: IDBPDatabase;
  try {
    db = await initDB();
    db = await ensureObjectStoreExists(db, table);
    await db.clear(table);
  } catch (error) {
    console.error(`[Storage] clear(${table}) 失败:`, error);
    throw error;
  }
}

/**
 * 获取指定表中所有 key
 *
 * @param table  表名，默认为 'users'
 * @returns      key 数组
 */
export async function keys(
  table: string = DEFAULT_STORE_NAME,
): Promise<IDBValidKey[]> {
  let db: IDBPDatabase;
  try {
    db = await initDB();
    db = await ensureObjectStoreExists(db, table);
    return await db.getAllKeys(table);
  } catch (error) {
    console.error(`[Storage] keys(${table}) 失败:`, error);
    throw error;
  }
}

/**
 * 获取指定表中所有值（不包含 key）
 *
 * @param table  表名，默认为 'users'
 * @returns      值数组
 */
export async function values<T = unknown>(
  table: string = DEFAULT_STORE_NAME,
): Promise<T[]> {
  let db: IDBPDatabase;
  try {
    db = await initDB();
    await ensureObjectStoreExists(db, table);
    return await db.getAll(table);
  } catch (error) {
    console.error(`[Storage] values(${table}) 失败:`, error);
    throw error;
  }
}

/**
 * 获取指定表的记录总数
 *
 * @param table  表名，默认为 'users'
 * @returns      记录数量
 */
export async function count(table: string = DEFAULT_STORE_NAME): Promise<number> {
  let db: IDBPDatabase;
  try {
    db = await initDB();
    db = await ensureObjectStoreExists(db, table);
    return await db.count(table);
  } catch (error) {
    console.error(`[Storage] count(${table}) 失败:`, error);
    throw error;
  }
}