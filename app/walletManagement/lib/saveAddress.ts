//app/walletManagement/lib/saveAddress.ts
/**
 * @file 地址存储工具（IndexedDB 封装层）
 * @description 负责在 IndexedDB 的 `Addresses` 表中保存、读取、删除与列出钱包地址记录。
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-28
 */

import * as storage from '@/app/lib/storage';

const TABLE_ADDRESSES = 'Addresses';

/**
 * 地址记录类型
 *
 * @property wallet - 钱包元信息（如类型、KeyPath）
 * @property address - 钱包地址（0x...）
 */
export interface AddressRecord {
  wallet: {
    type: string;
    KeyPath: string;
  };
  address: string;
}

/**
 * 获取 Addresses 表中下一条记录应使用的 key（自增逻辑）
 *
 * WHY：storage.count() 统计当前条目数量，用作“自增主键”
 *      例如已有 0,1,2 → 下一个 key = 3
 *
 * @returns number - 下一个 key
 */
async function nextAddressKey() {
  return await storage.count(TABLE_ADDRESSES);
}

/**
 * 保存地址记录（自动分配 key）
 *
 * WHY：使用 count 作为 key，可避免重复 key 并确保顺序一致
 *
 * @param addressRecord - 要保存的钱包记录
 * @returns number - 新生成的 key
 */
export async function saveAddress(addressRecord: AddressRecord): Promise<number> {
  const key = await nextAddressKey();
  await storage.set(String(key), addressRecord, TABLE_ADDRESSES);
  return key;
}

/**
 * 根据 key 获取地址记录
 *
 * @param key - 主键
 * @returns AddressRecord | undefined - 对应记录或 undefined
 */
export async function getAddress(key: number): Promise<AddressRecord | undefined> {
  return await storage.get(String(key), TABLE_ADDRESSES);
}

/**
 * 删除指定 key 的地址记录
 *
 * @param key - 主键
 */
export async function deleteAddress(key: number): Promise<void> {
  await storage.del(String(key), TABLE_ADDRESSES);
}

/**
 * 获取所有钱包记录（带 key）
 *
 * WHY：
 *  - keys() 返回所有 key，例如 [0,1,2,3]
 *  - values() 返回所有对应值，例如 [record0, record1, ...]
 *  - 使用 map 将 key 和记录组合为一个对象数组
 *
 * @returns {Array<{ key: number; wallet: AddressRecord }>}
 */
export async function listWallets() {
  const keys = await storage.keys(TABLE_ADDRESSES);      // [0,1,2,3,...]
  const values = await storage.values(TABLE_ADDRESSES);  // [{...},{...},...]

  return keys.map((key, i) => ({
    key,
    wallet: values[i]
  }));
}
