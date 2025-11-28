//app/userManagement/page.tsx
'use client';

import { useEffect, useState } from 'react';

import { get } from '@/app/lib/storage';
import Register from './components/Register';
import Login from './components/Login';

/**
 * @file 用户管理模块路由入口页（/user-manage）
 * @description 根据本地是否已初始化过密码，自动展示“首次设置密码（Register）”或“已有密码登录（Login）”
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

/**
 * UserManage 主页面（/user-manage）
 *
 * @remarks
 * 核心职责：
 * 1. 组件挂载时立即检查 IndexedDB 中是否存在 `user:current` 记录（即是否已完成过密码初始化）
 * 2. hasUser === null → 加载中（展示全屏 loading）
 * 3. hasUser === false → 首次使用 → 渲染 Register 组件（引导用户设置本地密码）
 * 4. hasUser === true  → 已设置过密码 → 渲染 Login 组件（输入密码解锁）
 *
 * 为什么放在 page.tsx 而不是更上层？
 * - 该页面是未登录状态下强制跳转的唯一入口，必须独立判断状态
 * - 与 AuthGuard 配合实现完整的登录保护闭环
 */
export default function Page() {
  /** null=检查中，true=已初始化密码，false=首次使用 */
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  /** 页面加载时立即检测本地用户记录是否存在 */
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const user = await get('user:current');
        setHasUser(!!user);
      } catch (err) {
        console.error('检查用户状态失败:', err);
        // 出错时保守视为“未初始化”，引导走注册流程
        setHasUser(false);
      }
    };

    checkStatus();
  }, []);

  // ──────────────────────────────────────────────────
  // 加载中状态（检查 IndexedDB 是否已有用户记录）
  // ──────────────────────────────────────────────────
  if (hasUser === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg mb-6 font-medium">正在检查账户状态...</p>
        {/* 简洁蓝色的圆形加载动画 */}
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────
  // 主内容渲染：根据检测结果展示 Register 或 Login
  // ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* 统一卡片容器，保持视觉一致性 */}
      <div className="w-full max-w-md">
        {hasUser ? <Login /> : <Register />}
      </div>
    </div>
  );
}