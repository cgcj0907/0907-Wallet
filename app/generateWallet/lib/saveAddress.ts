// app/lib/saveAddress.ts

import * as storage from '@/app/lib/storage';

const TABLE_ADDRESSES = 'Addresses';

/** 地址记录类型 */
export interface AddressRecord {
  wallet: {
    type: string;
    KeyPath: string;
  };
  address: string;
}

/** 获取 Addresses 表的下一个 key */
async function nextAddressKey() {
  return await storage.count(TABLE_ADDRESSES);
}

/** 保存地址（key = count） */
export async function saveAddress(addressRecord: AddressRecord): Promise<number> {
  const key = await nextAddressKey();
  await storage.set(String(key), addressRecord, TABLE_ADDRESSES);
  return key;
}

/** 根据 key 获取地址 */
export async function getAddress(key: number): Promise<AddressRecord> {
  return await storage.get(String(key), TABLE_ADDRESSES);
}

/** 删除地址 */
export async function deleteAddress(key: number): Promise<void> {
  await storage.del(String(key), TABLE_ADDRESSES);
}

/** 列出全部钱包（使用 getAll + getAllKeys） */
export async function listWallets() {
  const keys = await storage.keys(TABLE_ADDRESSES);      // [0,1,2,3]
  const values = await storage.values(TABLE_ADDRESSES);  // [wallet0, wallet1, wallet2]

  return keys.map((key, i) => ({
    key,
    wallet: values[i]
  }));
}