//app/userManagement/page.tsx
/**
 * @file 登录/注册入口页面
 * @description 根据本地存储的用户状态决定展示 Login 或 Register 组件。
 *              初次渲染会检查 user:current 字段，并给出加载中的 UI。
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-28
 */

'use client';

import { useEffect, useState } from 'react';
import { get } from '@/app/lib/storage';
import Register from './components/Register';
import Login from './components/Login';

/**
 * 登录与注册入口页面组件。
 *
 * 根据本地存储的 "user:current" 判断用户是否已经注册：
 * - hasUser = null：正在加载用户状态
 * - hasUser = true：已有用户，展示 Login
 * - hasUser = false：无用户，展示 Register
 */
export default function Page() {
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    /**
     * 检查当前是否已存在本地用户数据。
     *
     * @returns void
     *
     * 说明：
     * - get('user:current') 可能查询 IndexedDB 或异步存储，因此必须使用 async。
     * - !!user 的作用是将结果转换为布尔值，确保状态类型一致。
     */
    const checkStatus = async () => {
      const user = await get('user:current');
      setHasUser(!!user);
    };

    checkStatus();
  }, []);

  // 加载状态：避免直接闪现 Login / Register，引发 UI 闪烁体验差
  if (hasUser === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        {/* 加载提示文案 */}
        <p className="text-gray-500 text-lg mb-4">正在检查账户状态...</p>

        {/* 简单 CSS 旋转动画，用于视觉反馈 */}
        <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 根据用户状态展示对应组件 */}
      {hasUser ? <Login /> : <Register />}
    </div>
  );
}
