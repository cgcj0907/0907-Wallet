// app/components/AuthGuard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { get, count } from '@/app/lib/storage';

type Props = { children: React.ReactNode };

// 哪些页面不需要守卫（避免死循环）
const PUBLIC_PATHS = ['/userLogin', '/generateWallet'];

export default function AuthGuard({ children }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function checkAuth() {
            try {
                const isPublic = PUBLIC_PATHS.includes(pathname || '');

                // 1. 检查 localStorage.isLogined
                const isLogined = localStorage.getItem('isLogined');
                const expiresAtStr = localStorage.getItem('loginExpiresAt');
                const now = Date.now();

                const loginValid = isLogined === '1' && expiresAtStr && parseInt(expiresAtStr) > now;

                // ① 未登录：去 /userLogin
                if (!loginValid || isLogined !== '1') {
                    if (!isPublic) router.replace('/userLogin');
                    if (mounted) setChecking(false);
                    return;
                }

                // 2. 已登录但要确认是否已有 HDNodeWallet
                const hdNodeWallet = await count('Wallets');

                // ② 已登录但没钱包：去 /generate-wallet
                if (!hdNodeWallet) {
                    if (pathname !== '/generateWallet') router.replace('/generateWallet');
                    if (mounted) setChecking(false);
                    return;
                }

                // ③ 已登录 + 有 HDNodeWallet → 放行
                if (mounted) {
                    // 刷新登录过期时间：当前时间 + 10 分钟
                    localStorage.setItem(
                        'loginExpiresAt',
                        (Date.now() + 10 * 60 * 1000).toString()
                    );

                    setChecking(false);
                }

            } catch (e) {
                console.error('AuthGuard 错误:', e);
                router.replace('/userLogin');
            }
        }

        checkAuth();

        return () => {
            mounted = false;
        };
    }, [pathname, router]);

    if (checking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                {/* 文案 */}
                <p className="text-gray-600 text-lg mb-4 animate-pulse">
                    正在验证授权...
                </p>

                {/* 旋转加载圈 */}
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }


    return <>{children}</>;
}
