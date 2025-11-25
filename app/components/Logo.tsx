'use client'

import { useState } from 'react';
import clsx from 'clsx';

export default function Logo() {
    const [hover, setHover] = useState(false);

    return (
        <div
            className="relative flex flex-col items-center"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* 图片 Logo */}
            <div
                className={clsx(
                    "z-[-1] w-86 h-86 rounded-full overflow-hidden cursor-pointer shadow-lg transition-transform duration-300",
                    hover ? "translate-y-0" : "translate-y-48" // 初始向下移动一半，半遮子组件
                )}
            >
                <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover"
                />
            </div>

            <div
                className={clsx(
                    "z-[-2] overflow-hidden transition-all duration-300 mt-2",
                    hover ? "max-h-40" : "max-h-0"
                )}
            >
                <div className="rounded-2xl p-3 w-40 text-center flex flex-col items-center gap-1 animate-bounce-slow">
                    <p className="text-sm font-semibold text-blue-500 flex items-center justify-center gap-1">
                         0907 Wallet
                    </p>
                    <p className="text-xs text-blue-300">Supported by SST</p>
                </div>

            </div>

        </div>
    );
}
