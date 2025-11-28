/**
 * @file 加密钱包存储工具（IndexedDB 封装）
 * @description 负责在 IndexedDB 的 `Wallets` 表中保存、读取、删除和列出加密后的 HD 钱包数据。
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-28
 */

import { IEncryptedWallet } from './cryptoWallet';
import * as storage from '@/app/lib/storage';

const TABLE_WALLETS = 'Wallets';

/**
 * 获取 Wallets 表的下一个 key（自增序号）
 *
 * WHY：使用 storage.count() 获取当前表中已有记录数量，
 *      并将其当做下一条记录的 key，实现“自增主键”效果。
 *
 * @returns 下一个可用 key
 */
async function nextWalletKey() {
  return await storage.count(TABLE_WALLETS);
}

/**
 * 保存加密钱包记录（自动分配 key）
 *
 * WHY：以 count() 作为 key，确保 key 递增、不会覆盖旧数据。
 *
 * @param encryptedWallet - 加密后的钱包结构（IEncryptedWallet）
 * @returns 生成的 key（数字类型）
 */
export async function saveWallet(encryptedWallet: IEncryptedWallet): Promise<number> {
  const key = await nextWalletKey();
  await storage.set(String(key), encryptedWallet, TABLE_WALLETS);
  return key;
}

/**
 * 根据 key 获取钱包记录
 *
 * @param key - Wallets 表中的主键
 * @returns IEncryptedWallet | null | undefined - 对应钱包记录
 */
export async function getWallet(key: number): Promise<IEncryptedWallet | null | undefined> {
  return await storage.get(String(key), TABLE_WALLETS);
}

/**
 * 删除指定 key 的钱包
 *
 * @param key - 主键
 */
export async function deleteWallet(key: number): Promise<void> {
  await storage.del(String(key), TABLE_WALLETS);
}

/**
 * 列出所有钱包记录（包含 key）
 *
 * WHY：
 *  - keys() 获取所有 key，例如 [0,1,2,3]
 *  - values() 获取对应钱包值
 *  - 使用 map 将 key 与 wallet 组合为统一对象格式
 *
 * @returns Array<{ key: number; wallet: IEncryptedWallet }>
 */
export async function listWallets() {
  const keys = await storage.keys(TABLE_WALLETS);      // [0,1,2,3]
  const values = await storage.values(TABLE_WALLETS);  // [wallet0, wallet1, wallet2]

  return keys.map((key, i) => ({
    key,
    wallet: values[i]
  }));
}
