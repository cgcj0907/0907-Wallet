/**
 * @file 加密钱包存储工具（IndexedDB 封装）
 * @description 负责在 IndexedDB 的 `Wallets` 表中保存、读取、删除和列出加密后的 HD 钱包数据
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-28
 */

import { IEncryptedWallet } from './cryptoWallet';
import * as storage from '@/app/lib/storage';

const TABLE_WALLETS = 'Wallets';

/**
 * 
 * 说明：
 * - 每次 countWallet() 返回当前记录数，
 *
 * @returns Promise<number>
 */
export async function countWallet(): Promise<number> {
  return await storage.count(TABLE_WALLETS);
}

/**
 * 保存加密钱包记录（使用外部传入的 key）
 *
 * 注意：
 * - 不在内部生成 key，保证流程更灵活（如第一条可用 key=0）
 * - storage.set() 始终会覆盖同 key，所以 key 必须保证唯一
 *
 * @param key string - 存储键（调用方负责自增逻辑）
 * @param encryptedWallet IEncryptedWallet - 加密后的钱包对象
 */
export async function saveWallet(key: string, encryptedWallet: IEncryptedWallet): Promise<void> {
  await storage.set(String(key), encryptedWallet, TABLE_WALLETS);
}

/**
 * 读取指定 key 的钱包记录。
 *
 * @param key number - Wallets 表的主键
 * @returns Promise<IEncryptedWallet | null | undefined>
 *          - undefined 代表 key 不存在
 *          - null 代表值为空（通常不会出现，除非人为写入）
 */
export async function getWallet(key: string): Promise<IEncryptedWallet | null | undefined> {
  return await storage.get(key, TABLE_WALLETS);
}

/**
 * 删除指定 key 的钱包记录。
 *
 * @param key number - Wallets 表的主键
 * @returns Promise<void>
 */
export async function deleteWallet(key: string): Promise<void> {
  await storage.del(key, TABLE_WALLETS);
}

/**
 * 列出 Wallets 表内所有钱包记录（含 key）。
 *
 * 逻辑说明：
 * - storage.keys()   → 返回所有主键数组，例如 ["0", "1", "2"]
 * - storage.values() → 返回所有钱包值，顺序与 keys 对应
 * - map 组合为统一格式：{ key: number, wallet: IEncryptedWallet }
 *
 * 返回格式示例：
 * [
 *   { key: 0, wallet: { ... } },
 *   { key: 1, wallet: { ... } }
 * ]
 */
export async function listWallets() {
  const keys = await storage.keys(TABLE_WALLETS);      // e.g. ["0", "1", "2"]
  const values = await storage.values(TABLE_WALLETS);  // e.g. [wallet0, wallet1, wallet2]

  return keys.map((key, i) => ({
    key,
    wallet: values[i]
  }));
}
