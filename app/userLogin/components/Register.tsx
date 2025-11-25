'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { savePasswordHash } from '../lib/storagePassword';
import { initDefaultNetworks } from '@/app/networkManage/lib/storage'
import { hashPassword } from '@/app/lib/hash';


export default function Register() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const MIN_LENGTH = 8;
  const REQUIRED_CATEGORY_COUNT = 3;


  const categories = useMemo(() => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const count = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    return { hasLower, hasUpper, hasNumber, hasSpecial, count };
  }, [password]);

  const isLengthOk = password.length >= MIN_LENGTH;
  const isCategoryOk = categories.count >= REQUIRED_CATEGORY_COUNT;
  const meetsBasicRules = isLengthOk && isCategoryOk;

  const strength = useMemo(() => {
    let score = 0;
    score += categories.count;
    if (password.length >= 12) score += 2;
    else if (password.length >= MIN_LENGTH) score += 1;
    const percent = Math.min(100, Math.round((score / 6) * 100));
    const label = percent >= 70 ? '强' : percent >= 40 ? '中' : '弱';
    return { score, percent, label };
  }, [categories, password.length]);

  const isMatch = password !== '' && password === confirmPassword;

  const handleRegister = async () => {
    setMessage('');
    if (!password || !confirmPassword) {
      setMessage('请输入密码并确认密码！');
      return;
    }
    if (!isMatch) {
      setMessage('两次输入的密码不一致！');
      return;
    }
    if (!meetsBasicRules) {
      setMessage(`密码需至少 ${MIN_LENGTH} 位且包含 ${REQUIRED_CATEGORY_COUNT} 种字符类型。`);
      return;
    }

    try {
      setLoading(true);
      const hashedPassword = await hashPassword(password);
      await savePasswordHash(hashedPassword);
      setMessage('密码已加密保存成功！');
      setPassword('');
      setConfirmPassword('');
      localStorage.setItem('isLogined', '0');
      await initDefaultNetworks();
      router.push('/generateWallet');
    } catch (err) {
      console.error(err);
      setMessage('存储失败，请重试！');
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMessage('');
  }, [password, confirmPassword]);

  return (

    <div className="bg-white p-8 rounded-lg shadow-md w-full m-auto max-w-sm">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">
        初始化密码
      </h2>

      {/* 密码输入 */}
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
            {showPassword ? '隐藏' : '显示'}
          </button>
        </div>

      </div>

      {/* 强度条 */}
      <div className="mb-4 h-2 w-full bg-blue-100 rounded">
        <div
          className="h-2 rounded"
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
      <p className="text-sm text-blue-500 text-right">{strength.label}</p>

      {/* 确认密码输入 */}
      <div className="mb-4">
        <label className="block mb-1 text-sm text-gray-700">确认密码</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            placeholder="确认密码"
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-2 border border-blue-200 rounded pr-12 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="confirm-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(prev => !prev)}
            aria-label={showConfirm ? '隐藏确认密码' : '显示确认密码'}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-blue-500 px-2 py-1 bg-transparent rounded"
          >
            {showConfirm ? '隐藏' : '显示'}
          </button>
        </div>
      </div>



      {/* 注册按钮 */}
      <button
        onClick={handleRegister}
        disabled={loading}
        aria-busy={loading}
        className={`w-full py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors ${loading ? 'opacity-60 cursor-wait' : ''}`}
      >
        {loading && <span className="spinner mr-2" />}
        {loading ? '注册中...' : '注册'}
      </button>

      {/* 提示信息 */}
      {message && <p className="mt-4 text-center text-sm text-red-500">{message}</p>}
    </div>

  );
}
