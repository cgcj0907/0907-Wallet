// @/app/userLogin/lib/storage.ts
import * as storage from '@/app/lib/storage';

export interface UserRecord {
  passwordHash: string; // base64 编码
  hashAlgo: string; // e.g. "SHA-256"
  createdAt?: number;
  updatedAt?: number;
  version?: number;
  settings?: Record<string, any>;
}


export const KEY_PATH = 'user:current';


// ===== 用户记录操作 =====
export async function savePasswordHash(
  passwordHashBase64: string,
  opts?: { hashAlgo?: string; version?: number }
) {
  const now = Date.now();
  const existing: UserRecord | undefined = await storage.get(KEY_PATH);
  const record: UserRecord = {
    passwordHash: passwordHashBase64,
    hashAlgo: opts?.hashAlgo ?? 'SHA-256',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    version: opts?.version ?? 1,
    settings: existing?.settings ?? {},
  };
  await storage.set(KEY_PATH, record);
}

/**
 * 获取用户记录（返回 UserRecord | undefined）
 */
export async function getUserRecord(): Promise<UserRecord | undefined> {
  return storage.get(KEY_PATH);
}

/**
 * 删除用户记录（例如重置场景）
 */
export async function deleteUserRecord(): Promise<void> {
  await storage.del(KEY_PATH);
}
