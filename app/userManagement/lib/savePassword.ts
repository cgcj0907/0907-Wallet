//app/userManagement/lib/savePassword.ts
/**
 * @file 用户密码哈希存储工具（userManagement 模块专用）
 * @description 负责将用户密码的哈希值（而非明文）安全保存到 IndexedDB，
 *              采用不可逆 SHA-256 哈希 + Base64 编码存储，用于后续“验证密码是否正确”
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

import * as storage from '@/app/lib/storage';

/** 用户本地记录结构（仅存储密码哈希，不存储任何可恢复的明文信息） */
export interface UserRecord {
  /** Base64 编码的密码哈希值（SHA-256 计算后转 Base64） */
  passwordHash: string;
  /** 哈希算法名称，当前固定为 SHA-256，后续如升级可兼容 */
  hashAlgo: string;
  /** 记录创建时间戳（用于审计） */
  createdAt?: number;
  /** 最后更新时间戳 */
  updatedAt?: number;
  /** 数据结构版本号，便于后续平滑升级 */
  version?: number;
  /** 预留的用户个性化设置字段（主题、语言等） */
  settings?: Record<string, any>;
}

/** IndexedDB 中用户记录的固定 key（全局唯一） */
export const KEY_PATH = 'user:current';

/**
 * 保存密码哈希（首次设置密码或修改密码时调用）
 *
 * @param passwordHashBase64 - 使用 SHA-256 计算后并进行 Base64 编码的密码哈希字符串
 * @param opts - 可选参数
 *   - hashAlgo: 哈希算法（默认 SHA-256）
 *   - version: 数据版本号（默认 1）
 *
 * @remarks
 * 为什么不存盐？因为这里采用的是“纯哈希”而非加盐哈希。
 * 钱包核心助记词/私钥的加密密钥仍由用户原始密码通过 PBKDF2 派生（在 savePassword.ts 中实现），
 * 此处仅用于快速校验用户输入的密码是否与上次一致，属于“二次验证”机制。
 */
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
    // 保留旧的 settings，防止覆盖用户已有偏好设置
    settings: existing?.settings ?? {},
  };

  await storage.set(KEY_PATH, record);
}

/**
 * 获取当前用户记录
 *
 * @returns UserRecord 对象或 undefined（未设置过密码时）
 */
export async function getUserRecord(): Promise<UserRecord | undefined> {
  return storage.get(KEY_PATH);
}

/**
 * 删除本地用户记录
 *
 * @remarks
 * 用于“忘记密码”或“退出登录并清除本地数据”场景，
 * 删除后将触发 AuthGuard 重定向到 /user-manage 重新创建/导入钱包
 */
export async function deleteUserRecord(): Promise<void> {
  await storage.del(KEY_PATH);
}