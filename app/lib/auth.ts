// app/lib/auth.ts
/**
 * @file 钱包认证与账户管理核心模块
 * @description 负责钱包连接、签名验证、登录状态持久化、登出等完整认证流程
 *              支持 MetaMask、WalletConnect、Coinbase Wallet 等主流钱包
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-08-16
 */

export const LOGIN_FLAG_KEY = 'isLoggedIn';
export const LOGIN_EXPIRES_KEY = 'loginExpiresAt';
const DEFAULT_EXPIRE_MINUTES = 10;

/**获取过期时间 */
export function getLoginExpiresAt(): number | null {
  const v = localStorage.getItem(LOGIN_EXPIRES_KEY);
  return v ? Number(v) : null;
}

/**检查登录状态是否合法 */
export function isLoggedInLocal(): boolean {
  const flag = localStorage.getItem(LOGIN_FLAG_KEY);
  const expires = getLoginExpiresAt();
  if (flag !== '1' || !expires) return false;
  if (Date.now() > expires) {
    // 已过期，清理
    localStorage.setItem(LOGIN_FLAG_KEY, '0');
    localStorage.removeItem(LOGIN_EXPIRES_KEY);
    return false;
  }
  return true;
}

/** 刷新过期时间（默认 +10 分钟）并确保 flag = '1' */
export function refreshLoginExpiry(minutes = DEFAULT_EXPIRE_MINUTES) {
  const expiresAt = Date.now() + minutes * 60 * 1000;
  localStorage.setItem(LOGIN_FLAG_KEY, '1');
  localStorage.setItem(LOGIN_EXPIRES_KEY, String(expiresAt));
}

/** 退出登录（本地清理） */
export function logoutLocal() {
  localStorage.setItem(LOGIN_FLAG_KEY, '0');
  localStorage.removeItem(LOGIN_EXPIRES_KEY);
}
