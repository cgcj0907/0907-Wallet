'use client';

import { useEffect, useState } from 'react';
import { get } from '@/app/lib/storage';
import Register from './components/Register';
import Login from './components/Login';

export default function Page() {
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const user = await get('user:current');
      setHasUser(!!user);
    };
    checkStatus();
  }, []);

  // 加载状态
  if (hasUser === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        {/* 简单文字 */}
        <p className="text-gray-500 text-lg mb-4">正在检查账户状态...</p>

        {/* CSS旋转动画 */}
        <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {hasUser ? <Login /> : <Register />}
    </div>
  );
}
