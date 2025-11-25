// app/lib/saveWallet.ts

import { EncryptedWallet } from './cryptoWallet';
import * as storage from '@/app/lib/storage';

const TABLE_WALLETS = 'Wallets';

/** 获取 Wallets 表的下一个 key */
async function nextWalletKey() {
  return await storage.count(TABLE_WALLETS);
}

/** 保存钱包（key = count） */
export async function saveWallet(encryptedWallet: EncryptedWallet): Promise<number> {
  const key = await nextWalletKey();
  await storage.set(String(key), encryptedWallet, TABLE_WALLETS);
  return key;
}

/** 根据 key 获取钱包 */
export async function getWallet(key: number): Promise<EncryptedWallet | null> {
  return await storage.get(String(key), TABLE_WALLETS);
}

/** 删除钱包 */
export async function deleteWallet(key: number): Promise<void> {
  await storage.del(String(key), TABLE_WALLETS);
}

/** 列出全部钱包（使用 getAll + getAllKeys） */
export async function listWallets() {
  const keys = await storage.keys(TABLE_WALLETS);      // [0,1,2,3]
  const values = await storage.values(TABLE_WALLETS);  // [wallet0, wallet1, wallet2]

  return keys.map((key, i) => ({
    key,
    wallet: values[i]
  }));
}
