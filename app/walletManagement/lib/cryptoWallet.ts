// app/lib/cryptoWallet.ts

export interface EncryptedWallet {
  cipher: string;
  salt: string;
  iv: string;
}

function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function decode(buf: ArrayBuffer | Uint8Array): string {
  const view = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return new TextDecoder().decode(view);
}

// Base64 工具：优先使用浏览器的 btoa/atob，回退到 Node 的 Buffer
function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  // 浏览器环境
  if (typeof btoa !== 'undefined') {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // Node 环境回退
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(str: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node 回退
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return new Uint8Array(Buffer.from(str, 'base64'));
}

// 将 Uint8Array 或 ArrayBuffer 规范化为独立的 ArrayBuffer 副本
function toArrayBuffer(src: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (src instanceof ArrayBuffer) return src.slice(0);
  // src is Uint8Array — 创建独立副本以确保为 ArrayBuffer
  const copy = new Uint8Array(src.byteLength);
  copy.set(src);
  return copy.buffer;
}

// ---------------------------------------------------------
// 🔐 加密 HDNodeWallet
// ---------------------------------------------------------
export async function encryptWallet<T = unknown>(
  wallet: T,
  password: string
): Promise<EncryptedWallet> {
  const walletStr = JSON.stringify(wallet);
  const data = encode(walletStr);
  const passBytes = encode(password);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 1) Import password
  const baseKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(passBytes),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // 2) Derive AES-GCM key
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: 250000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 3) Encrypt
  const cipherArrayBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    toArrayBuffer(data)
  );

  return {
    cipher: toBase64(cipherArrayBuffer),
    salt: toBase64(salt),
    iv: toBase64(iv),
  };
}

// ---------------------------------------------------------
// 🔓 解密函数（反序列化回 HDNodeWallet JSON）
// ---------------------------------------------------------
export async function decryptWallet<T = unknown>(
  encrypted: EncryptedWallet,
  password: string
): Promise<T> {
  const salt = fromBase64(encrypted.salt);
  const iv = fromBase64(encrypted.iv);
  const cipherBytes = fromBase64(encrypted.cipher);
  const passBytes = encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(passBytes),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: 250000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const plainBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    aesKey,
    toArrayBuffer(cipherBytes)
  );

  return JSON.parse(decode(plainBuffer)) as T;
}
