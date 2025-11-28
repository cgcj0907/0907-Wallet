// app/components/AuthGuard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { count } from '@/app/lib/storage';

type Props = { children: React.ReactNode };

// 不需要守卫的页面
const PUBLIC_PATHS = ['/userLogin', '/generateWallet'];

export default function AuthGuard({ children }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function checkAuth() {
            try {
                if (!pathname) {
                    if (mounted) setChecking(false);
                    return;
                }

                const isPublic = PUBLIC_PATHS.includes(pathname);

                // 检查登录状态
                const isLoggedIn = localStorage.getItem('isLoggedIn');
                const expiresAtStr = localStorage.getItem('loginExpiresAt') || '0';
                const now = Date.now();
                const loginValid = isLoggedIn === '1' && parseInt(expiresAtStr) > now;

                if (!loginValid && !isPublic) {
                    router.replace('/userLogin');
                    if (mounted) setChecking(false);
                    return;
                }

                // 已登录则检查钱包
                const hdNodeWallet = await count('Wallets');

                if (!hdNodeWallet && pathname !== '/generateWallet') {
                    router.replace('/generateWallet');
                    if (mounted) setChecking(false);
                    return;
                }

                // 已登录 + 有钱包 → 放行
                if (mounted) {
                    // 刷新登录有效期
                    localStorage.setItem(
                        'loginExpiresAt',
                        (Date.now() + 10 * 60 * 1000).toString()
                    );
                    setChecking(false);
                }

            } catch (e) {
                console.error('AuthGuard 错误:', e);
                if (mounted) setChecking(false);
                router.replace('/userLogin');
            }
        }

        checkAuth();

        return () => {
            mounted = false;
        };
    }, [pathname, router]);


    return (
        <>
            {checking && (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <p className="text-gray-600 text-lg mb-4 animate-pulse">
                    正在验证授权...
                </p>
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>)}
            {!checking && children}
        </>

    );


}
