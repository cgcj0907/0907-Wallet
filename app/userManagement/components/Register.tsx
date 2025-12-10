//app/userManagement/components/Register.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { savePasswordHash } from '../lib/savePassword';
import { initDefaultNetworks } from '@/app/networkManagement/lib/saveNetwork';
import { hashPassword } from '@/app/lib/transform';

/**
 * @file 用户注册/初始化密码组件（首次创建钱包时使用）
 * @description 负责引导用户设置高强度本地密码 → SHA-256 哈希后持久化存储，
 *              同时初始化默认网络配置，完成后跳转钱包管理页面
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

/**
 * Register 组件 - 首次使用时的密码初始化页面
 *
 * @remarks
 * 核心设计原则：
 * 1. 密码永不以明文形式存储或传输，仅保存 SHA-256 哈希（用于后续登录快速校验）
 * 2. 真正用于加密助记词/私钥的密钥由原始密码通过 PBKDF2 在运行时派生（不在此组件）
 * 3. 密码强度要求：≥8 位 + 至少 3 种字符类别（大小写、数字、符号）
 * 4. 注册成功后自动初始化默认网络（Ethereum Mainnet + Sepolia）并跳转钱包创建流程
 */
export default function Register() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 密码强度规则常量（便于后续统一调整）
  const MIN_LENGTH = 8;
  const REQUIRED_CATEGORY_COUNT = 3;

  /** 实时计算密码包含的字符类别数量 */
  const categories = useMemo(() => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const count = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    return { hasLower, hasUpper, hasNumber, hasSpecial, count };
  }, [password]);

  // 基础规则检查
  const isLengthOk = password.length >= MIN_LENGTH;
  const isCategoryOk = categories.count >= REQUIRED_CATEGORY_COUNT;
  const meetsBasicRules = isLengthOk && isCategoryOk;

  /** 计算密码强度分数与视觉表现 */
  const strength = useMemo(() => {
    let score = 0;
    score += categories.count; // 每种字符类别 +1
    if (password.length >= 12) score += 2;
    else if (password.length >= MIN_LENGTH) score += 1;

    const percent = Math.min(100, Math.round((score / 6) * 100));
    const label = percent >= 70 ? '强' : percent >= 40 ? '中' : '弱';
    return { score, percent, label };
  }, [categories.count, password.length]);

  /** 确认密码是否完全一致（非空时才判断） */
  const isMatch = password !== '' && password === confirmPassword;

  /**
   * 处理注册（密码设置）主流程
   *
   * 为什么这里只存哈希不存明文？
   * - 此密码哈希仅用于后续登录时的快速比对（Login 组件）
   * - 真正解密钱包时仍需原始密码参与 PBKDF2 派生加密密钥
   */
  const handleRegister = async () => {
    setMessage('');

    // 基础校验
    if (!password || !confirmPassword) {
      setMessage('请输入密码并确认密码！');
      return;
    }
    if (!isMatch) {
      setMessage('两次输入的密码不一致！');
      return;
    }
    if (!meetsBasicRules) {
      setMessage(`密码需至少 ${MIN_LENGTH} 位且包含 ${REQUIRED_CATEGORY_COUNT} 种字符类型（大小写、数字、符号）。`);
      return;
    }

    try {
      setLoading(true);
      setMessage('耐心等待,请勿刷新界面');

      // 1. 计算密码的 SHA-256 哈希值
      const hashedPassword = await hashPassword(password);

      // 2. 并行执行：持久化密码哈希 + 初始化默认支持的网络（Mainnet + Sepolia）
      await Promise.all([
        savePasswordHash(hashedPassword),
        initDefaultNetworks()
      ]);


      // 3. 清理状态并跳转至钱包创建页面
      setMessage('密码设置成功！正在进入钱包创建流程...');
      setPassword('');
      setConfirmPassword('');
      localStorage.setItem('isLoggedIn', '0'); // 标记为“未登录”状态，需后续完成钱包创建才真正登录

      router.replace('/walletManagement');
    } catch (err) {
      console.error('注册流程异常:', err);
      setMessage('设置失败，请重试！');
    } finally {
      setLoading(false);
    }
  };

  /** 输入框内容变化时自动清除错误提示 */
  useEffect(() => {
    setMessage('');
  }, [password, confirmPassword]);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full m-auto max-w-sm">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">
        初始化密码
      </h2>

      {/* 密码输入 + 显示/隐藏切换 */}
      <div className="mb-4">
        <label className="block mb-1 text-sm text-gray-700">密码</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            placeholder="请输入密码"
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-2 border border-blue-200 rounded pr-12 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-blue-500 px-2 py-1 bg-transparent rounded"
          >
            {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
          </button>
        </div>
      </div>

      {/* 密码强度进度条 */}
      <div className="mb-4 h-2 w-full bg-blue-100 rounded overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${strength.percent}%`,
            backgroundColor:
              strength.label === '强'
                ? '#3B82F6'
                : strength.label === '中'
                  ? '#60A5FA'
                  : '#93C5FD',
          }}
        />
      </div>
      <p className="text-sm text-blue-500 text-right mb-4">{strength.label}</p>

      {/* 确认密码输入 */}
      <div className="mb-6">
        <label className="block mb-1 text-sm text-gray-700">确认密码</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            placeholder="请再次输入密码"
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-4 py-2 border border-blue-200 rounded pr-12 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="confirm-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(prev => !prev)}
            aria-label={showConfirm ? '隐藏确认密码' : '显示确认密码'}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-blue-500 px-2 py-1 bg-transparent rounded"
          >
            {showConfirm ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
          </button>
        </div>
      </div>

      {/* 注册按钮 */}
      <button
        onClick={handleRegister}
        disabled={loading}
        aria-busy={loading}
        className={`w-full py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors flex items-center justify-center ${loading ? 'opacity-60 cursor-wait' : ''
          }`}
      >
        {loading && <span className="spinner mr-2" />}
        {loading ? '设置中...' : '完成设置'}
      </button>

      {/* 操作结果提示 */}
      {message && (
        <p className={`mt-4 text-center text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}