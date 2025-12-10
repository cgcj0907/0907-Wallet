// app/components/AuthGuard.tsx
/**
 * @file 全局路由权限守卫（客户端组件）
 * @description 
 *   1. 未登录 → 强制跳转 /userManagement（公开页除外）
 *   2. 已登录但无钱包 → 强制跳转 /walletManagement
 *   3. 全部通过 → 放行并自动刷新登录有效期
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { count } from '@/app/lib/storage';
import * as auth from '@/app/lib/auth';

interface AuthGuardProps {
  /** 要渲染的子内容（受保护的页面） */
  children: React.ReactNode;
}

// 公开路径：无需登录即可访问
const PUBLIC_PATHS = ['/userManagement', '/walletManagement'] as const;

// 钱包存储表名（避免魔法值）
const WALLETS_STORE_NAME = 'Wallets';

export default function AuthGuard({ children }: AuthGuardProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    /**
     * 核心鉴权逻辑
     * 为什么放在 useEffect 里单独执行？
     * - 避免阻塞渲染
     * - 需要 async/await 必须封装在函数内
     * - 配合 isMounted 防止内存泄漏
     */
    async function performAuthCheck(): Promise<void> {
      try {
        // pathname 可能为 null（Next.js 某些边缘情况）
        if (!pathname) {
          if (isMounted) setIsChecking(false);
          return;
        }

        const isPublicPath = PUBLIC_PATHS.includes(pathname as any);

        // Step 1: 检查本地登录态（同步快速）
        const isLoggedIn = auth.isLoggedInLocal();

        if (!isLoggedIn && !isPublicPath) {
          router.replace('/userManagement');
          if (isMounted) setIsChecking(false);
          return;
        }

        // Step 2: 已登录 → 检查是否已创建钱包
        if (isLoggedIn) {
          const walletCount = await count(WALLETS_STORE_NAME);

          // count 返回 number，0 表示无钱包
          const hasWallet = walletCount > 0;

          if (!hasWallet) {
            router.replace('/walletManagement');
            if (isMounted) setIsChecking(false);
            return;
          }
        }

        // Step 3: 全部通过 → 刷新登录有效期并放行
        if (isMounted) {
          if (localStorage.getItem('isLoggedIn') === '1') {
            auth.refreshLoginExpiry(); // 延长本地登录态过期时间
          }
          setIsChecking(false);
        }
      } catch (error) {
        // 为什么 catch 后直接跳转登录？
        // IndexedDB 异常、本地存储损坏等都视为“不安全状态”，必须重新登录
        console.error('[AuthGuard] 鉴权过程中发生异常:', error);
        if (isMounted) {
          setIsChecking(false);
          router.replace('/userManagement');
        }
      }
    }

    performAuthCheck();

    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  // Loading 状态：全屏居中动效
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg mb-4 animate-pulse">
          正在验证授权...
        </p>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 鉴权通过：渲染子内容
  return <>{children}</>;
}