// @/app/lib/hash.ts
/**
 * @file 密码哈希与 ArrayBuffer/Base64 互转工具
 * @description 提供安全的密码 SHA-256 哈希（返回 Base64）和高性能的二进制 ↔ Base64 转换工具
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 *
 * 使用 Uint8Array + btoa 的经典写法，比 Buffer.toString('base64') 更兼容浏览器环境
 *
 * @param buffer 要转换的 ArrayBuffer
 * @returns Base64 编码字符串
 * @example
 * const b64 = arrayBufferToBase64(hashBuffer);
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  // 为什么不用 chunked 方式？
  // 对于密码哈希结果（仅 32 bytes），性能差距可忽略，且此写法最简洁稳定
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/**
 * 将 Base64 字符串转换为 Uint8Array
 *
 * @param base64 Base64 编码的字符串
 * @returns 对应的 Uint8Array
 * @example
 * const uint8 = base64ToUint8Array(storedHash);
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * 对明文密码进行安全的 SHA-256 哈希，并返回 Base64 编码结果
 *
 * 使用 Web Crypto API（crypto.subtle），在所有现代浏览器中均为原生实现，安全且高性能。
 *
 * @param password 明文密码
 * @returns SHA-256 哈希后的 Base64 字符串（固定 44 字符）
 * @example
 * const hashed = await hashPassword('mySecret123');
 * // → "iOcJ9qP3b...=="
 */
export async function hashPassword(password: string): Promise<string> {
  // 防御性检查：防止意外传入空字符串或非字符串
  if (typeof password !== 'string' || password === '') {
    throw new Error('Password must be a non-empty string');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToBase64(hashBuffer);
  } catch (error) {
    // 为什么 throw 而不是 swallow？
    // 密码哈希是安全关键路径，失败必须让调用方感知并处理
    console.error('[hashPassword] 哈希失败:', error);
    throw new Error('Failed to hash password');
  }
}