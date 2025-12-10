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
  name: string;
}

export async function countAddress() {
  return storage.count(TABLE_ADDRESSES);
}


/**
 * 保存地址记录（自动分配 key）
 *
 * WHY：使用 count 作为 key，可避免重复 key 并确保顺序一致
 *
 * @param addressRecord - 要保存的钱包记录
 * @param key - 要修改的键
 * @returns string - 新生成的 key
 */
export async function saveAddress(addressRecord: AddressRecord, key?: string): Promise<string | undefined> {
  if (!key) {
    const number = await countAddress();
    if (!number) {
      key = '0';
    }
  }
  if (key) {
    await storage.set(key, addressRecord, TABLE_ADDRESSES);
  }
  
  return key;
}

/**
 * 根据 key 获取地址记录
 *
 * @param key - 主键
 * @returns AddressRecord | undefined - 对应记录或 undefined
 */
export async function getAddress(key: string): Promise<AddressRecord | undefined> {
  return await storage.get(String(key), TABLE_ADDRESSES);
}

/**
 * 删除指定 key 的地址记录
 *
 * @param key - 主键
 */
export async function deleteAddress(key: string): Promise<void> {
  await storage.del(key, TABLE_ADDRESSES);
}

/**
 * 修改指定 key 的地址记录的名称
 *
 * @param key - 要修改的地址记录的唯一标识
 * @param name - 新的名称
 * @returns Promise<void> - 异步操作，无返回值
 *
 * 逻辑：
 * 1. 根据 key 获取已有的地址记录。
 * 2. 如果记录存在，更新其 name 字段。
 * 3. 调用 saveAddress 保存更新后的地址记录。
 */
export async function modifyAddressName(key: string, name: string): Promise<void> {
  // 获取指定 key 的地址记录
  let addressRecord: AddressRecord | undefined = await getAddress(key);

  if (addressRecord) {
    // 修改名称
    addressRecord.name = name;
    // 保存更新后的地址记录
    await saveAddress(addressRecord, key);
  }
}

/**
 * 获取所有钱包记录（带 key）
 *
 * WHY：
 *  - keys() 返回所有 key，例如 [0,1,2,3]
 *  - values() 返回所有对应值，例如 [record0, record1, ...]
 *  - 使用 map 将 key 和记录组合为一个对象数组
 *
 * @returns {Array<{ key: IDBValidKey; addressRecord: AddressRecord }>}
 */
export async function listAddresses(): Promise<Array<{ key: IDBValidKey; addressRecord: AddressRecord }>> {
  const keys = await storage.keys(TABLE_ADDRESSES);      // [0,1,2,3,...]
  const values = await storage.values<AddressRecord>(TABLE_ADDRESSES);  // [{...},{...},...]

  return keys.map((key, i) => ({
    key,
    addressRecord: values[i]
  }));
}
