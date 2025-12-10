//app/userManagement/components/Login.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { getUserRecord } from '../lib/savePassword';
import { countWallet } from '@/app/walletManagement/lib/saveWallet'
import { hashPassword } from '@/app/lib/transform';
import { getAddress, AddressRecord } from '@/app/walletManagement/lib/saveAddress';

/**
 * @file 用户登录组件（本地密码解锁钱包）
 * @description 用于已创建钱包的用户通过输入密码解锁本地加密数据，
 *              验证通过后写入登录态并跳转至首页
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

/**
 * Login 组件 - 本地钱包密码登录入口
 *
 * @remarks
 * 核心流程说明：
 * 1. 读取 IndexedDB 中保存的密码哈希（SHA-256 + Base64）
 * 2. 对用户输入的密码进行相同哈希计算并比对
 * 3. 验证成功 → 写入 localStorage 登录态（10分钟有效期）+ 当前地址 → 跳转 /home
 * 4. 验证失败 → 清除所有登录态，提示错误
 *
 * 为什么使用 localStorage 而非内存状态？
 * - Next.js Client Component 在页面切换时会重新 mount，需要持久化登录态
 * - 配合 AuthGuard 可快速判断是否已登录，避免重复解密
 */
export default function Login() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /** 实时检测密码复杂度（用于后续 UI 强度条扩展） */
  const categories = useMemo(() => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const count = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    return { hasLower, hasUpper, hasNumber, hasSpecial, count };
  }, [password]);

  /** 组件挂载时清除旧的消息提示 */
  useEffect(() => {
    setMessage('');
  }, []);

  /**
   * 处理登录逻辑（核心业务函数）
   *
   * 为什么不直接解密助记词？
   * - 密码哈希仅用于快速校验是否正确（轻量级）
   * - 真正解密助记词/私钥在 WalletProvider 中进行（需要完整 PBKDF2 + AES-GCM）
   */
  const handleLogin = async () => {
    const numberOfWallet = await countWallet();
    if (numberOfWallet === 0) {
      setMessage('当前无可用钱包，请先创建钱包');
      router.replace('/walletManagement');
      return;
    }

    setMessage('');
    if (!password) {
      setMessage('请输入密码！');
      return;
    }

    setLoading(true);
    try {
      const rec = await getUserRecord();
      if (!rec) {
        setMessage('未检测到已注册的密码，请先注册。');
        localStorage.setItem('isLoggedIn', '0');
        localStorage.removeItem('loginExpiresAt');
        setLoading(false);
        return;
      }

      const hashed = await hashPassword(password);
      if (hashed === rec.passwordHash) {
        setMessage('登录成功！');

        // 设置 10 分钟有效期的登录态（用于 AuthGuard 快速校验）
        localStorage.setItem('isLoggedIn', '1');
        localStorage.setItem('loginExpiresAt', (Date.now() + 10 * 60 * 1000).toString());

        // 若未缓存当前地址，则从 IndexedDB 读取第一个地址作为默认
        if (!localStorage.getItem('currentAddressKeyPath')) {

            localStorage.setItem('currentAddressKeyPath', '0');
          
        }

        setPassword('');
        router.replace('/home');
      } else {
        setMessage('密码错误，请重试。');
        localStorage.setItem('isLoggedIn', '0');
        localStorage.removeItem('loginExpiresAt');
      }
    } catch (err) {
      console.error(err);
      setMessage('验证失败，请重试。');
      localStorage.setItem('isLoggedIn', '0');
      localStorage.removeItem('loginExpiresAt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm m-auto">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">登录</h2>

      {/* 密码输入框 + 显示/隐藏切换 */}
      <div className="mb-4 relative">
        <label className="block mb-1 text-sm text-gray-700">密码</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            autoComplete="current-password"
            aria-label="password"
            className="w-full px-4 py-2 border border-blue-200 rounded pr-12 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-blue-500 px-2 py-1 bg-transparent rounded"
          >
            {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
          </button>
        </div>
      </div>

      {/* 登录按钮 */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className={`w-full py-2 text-white font-medium rounded transition-colors ${loading ? 'bg-blue-300 cursor-wait' : 'bg-blue-500 hover:bg-blue-600'
          }`}
      >
        {loading ? '验证中...' : '登录'}
      </button>

      {/* 提示信息 */}
      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
}