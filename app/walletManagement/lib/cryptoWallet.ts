//app/walletManagement/lib/cryptoWallet.ts
/**
 * @file 钱包加密/解密工具（基于 Web Crypto API 的 AES-GCM + PBKDF2）
 * @description 使用 PBKDF2-SHA256 派生密钥 + AES-GCM 加密 HDNodeWallet JSON
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-04-05
 */

import type { HDNodeWallet } from 'ethers';

/** 加密后的钱包数据结构（全部 Base64 编码） */
export interface IEncryptedWallet {
  /** 密文（Base64） */
  cipher: string;
  /** PBKDF2 盐值（Base64） */
  salt: string;
  /** AES-GCM 初始化向量（Base64） */
  iv: string;
}

/** PBKDF2 迭代次数（安全与性能平衡） */
const PBKDF2_ITERATIONS = 250_000;

/** 盐长度 16 字节，IV 长度 12 字节（GCM 推荐） */
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * 将字符串转换为 Uint8Array
 */
function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * 将 ArrayBuffer 或 Uint8Array 转换为字符串
 */
function decode(buffer: ArrayBuffer | Uint8Array): string {
  const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return new TextDecoder().decode(view);
}

/**
 * 安全的 Base64 编码（浏览器优先 btoa/atob，回退 Buffer）
 */
function toBase64(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  // 浏览器环境
  if (typeof btoa !== 'undefined') {
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  // Node.js 环境回退（仅在构建时需要时才动态 require）
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Buffer = require('buffer').Buffer;
  return Buffer.from(bytes).toString('base64');
}

/**
 * 安全的 Base64 解码
 */
function fromBase64(str: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Node.js 回退
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Buffer = require('buffer').Buffer;
  return new Uint8Array(Buffer.from(str, 'base64'));
}

/**
 * 将 Uint8Array 或 ArrayBuffer 转换为独立的 ArrayBuffer 副本
 * 防止后续操作污染原始数据
 */
function toIndependentBuffer(src: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (src instanceof ArrayBuffer) {
    return src.slice(0);
  }
  return src.slice(0).buffer;
}

/**
 * 使用密码加密钱包（推荐用于 HDNodeWallet 或 PrivateKey）
 *
 * @param wallet - 要加密的钱包对象（会自动 JSON.stringify）
 * @param password - 用户设置的密码（明文）
 * @returns Base64 编码的加密数据
 *
 * @example
 * const encrypted = await encryptWallet(wallet, 'my-password-123');
 */
export async function encryptWallet<T = HDNodeWallet>(
  wallet: T,
  password: string
): Promise<IEncryptedWallet> {
  const walletJson = JSON.stringify(wallet);
  const dataBytes = encode(walletJson);
  const passwordBytes = encode(password);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // 1. 导入原始密码作为 PBKDF2 基础密钥
  const baseKey = await crypto.subtle.importKey(
    'raw',
    toIndependentBuffer(passwordBytes),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // 2. 使用 PBKDF2 派生 AES-GCM 256 位密钥
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toIndependentBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 3. 执行加密
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    toIndependentBuffer(dataBytes)
  );

  return {
    cipher: toBase64(ciphertext),
    salt: toBase64(salt),
    iv: toBase64(iv),
  };
}

/**
 * 使用密码解密钱包数据
 *
 * @param encrypted - 加密后的数据结构
 * @param password - 用户输入的密码
 * @returns 解密后的原始钱包对象
 *
 * @example
 * const wallet = await decryptWallet<HDNodeWallet>(encryptedData, 'my-password-123');
 */
export async function decryptWallet<T = HDNodeWallet>(
  encrypted: IEncryptedWallet,
  password: string
): Promise<T> {
  const salt = fromBase64(encrypted.salt);
  const iv = fromBase64(encrypted.iv);
  const ciphertext = fromBase64(encrypted.cipher);
  const passwordBytes = encode(password);

  try {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      toIndependentBuffer(passwordBytes),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: toIndependentBuffer(salt),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toIndependentBuffer(iv) },
      aesKey,
      toIndependentBuffer(ciphertext)
    );

    return JSON.parse(decode(plaintext)) as T;
  } catch (error) {
    // 密码错误或数据损坏时，Web Crypto 会抛 InvalidAccessError / OperationError
    throw new Error('解密失败：密码错误或数据已损坏');
  }
}