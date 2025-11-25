'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { getUserRecord } from '../lib/storagePassword';
import { hashPassword } from '@/app/lib/hash';



export default function Login() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();



  // 密码字符类别检查（用于提示，可扩展）
  const categories = useMemo(() => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const count = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    return { hasLower, hasUpper, hasNumber, hasSpecial, count };
  }, [password]);

  useEffect(() => {
    setMessage('');
  }, []);

  const handleLogin = async () => {
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
        localStorage.setItem('isLogined', '0');
        localStorage.removeItem('loginExpiresAt');
        setLoading(false);
        return;
      }

      const hashed = await hashPassword(password);
      if (hashed === rec.passwordHash) {
        setMessage('登录成功！');

        // 保存登录状态 + 10分钟过期时间
        localStorage.setItem('isLogined', '1');
        localStorage.setItem('loginExpiresAt', (Date.now() + 10 * 60 * 1000).toString());
        setPassword('');
        router.replace('/home');
      } else {
        setMessage('密码错误，请重试。');
        localStorage.setItem('isLogined', '0');
        localStorage.removeItem('loginExpiresAt');
      }
    } catch (err) {
      console.error(err);
      setMessage('验证失败，请重试。');
      localStorage.setItem('isLogined', '0');
      localStorage.removeItem('loginExpiresAt');
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm m-auto">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">登录</h2>

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
            {showPassword ? '隐藏' : '显示'}
          </button>
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className={`w-full py-2 text-white font-medium rounded transition-colors ${loading ? 'bg-blue-300 cursor-wait' : 'bg-blue-500 hover:bg-blue-600'
          }`}
      >
        {loading ? '验证中...' : '登录'}
      </button>

      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
}
