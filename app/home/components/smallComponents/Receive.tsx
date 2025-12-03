'use client';

import QRCode from 'react-qr-code';
import { useEffect, useState } from 'react';

export default function Receive({
    address,
    setReceiveOpen
}: {
    address: string | undefined;
    setReceiveOpen: (value: boolean) => void;
}) {
    const [copied, setCopied] = useState(false);

    if (!address || !address.startsWith('0x')) {
        return <div className="text-red-500 font-medium">无效地址</div>;
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    // 点击外部关闭弹窗
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setReceiveOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [setReceiveOpen]);

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) setReceiveOpen(false);
            }}
        >
            {/* 模糊背景层 */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"></div>

            {/* 弹窗内容 */}
            <div className="relative flex flex-col items-center p-8 bg-linear-to-br from-white to-sky-50/50 rounded-3xl shadow-2xl w-full max-w-md border border-sky-100 animate-slideUp">
                {/* 装饰元素 */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-linear-to-r from-sky-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <i className="fa-solid fa-qrcode text-white text-xl"></i>
                </div>

                {/* 关闭按钮 */}
                <button
                    onClick={() => setReceiveOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-sky-100/80 transition-all duration-200 group"
                    aria-label="关闭"
                >
                    <i className="fa-solid fa-xmark text-sky-600 group-hover:text-sky-800 text-sm"></i>
                </button>

                {/* 标题 */}
                <div className="text-center mb-6 pt-4">
                    <h2 className="text-2xl font-bold bg-linear-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                        接收资产
                    </h2>
                </div>

                {/* 二维码容器 */}
                <div className="relative p-6 bg-linear-to-br from-white via-sky-50/50 to-white rounded-2xl shadow-lg border border-sky-100/50 mb-6 group">
                    {/* 二维码背景装饰 */}
                    <div className="absolute inset-4 rounded-xl bg-linear-to-br from-sky-50 to-blue-50 opacity-50"></div>

                    {/* 二维码 */}
                    <div className="relative p-4 bg-white rounded-xl shadow-inner border border-sky-100">
                        <QRCode
                            value={address}
                            size={220}
                            bgColor="#ffffff"
                            fgColor="#0ea5e9"
                            level="H"
                            className="transition-transform duration-300 group-hover:scale-[1.02]"
                        />

                        {/* 中间logo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-linear-to-br from-sky-500 to-blue-500 p-1.5 shadow-lg border-4 border-white">
                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                <img
                                    src="/logo.png"   
                                    alt="wallet"
                                    className="w-6 h-6"         
                                />
                            </div>
                        </div>
                    </div>

                    {/* 装饰角 */}
                    <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-sky-300 rounded-tl-xl"></div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-sky-300 rounded-tr-xl"></div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-sky-300 rounded-bl-xl"></div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-sky-300 rounded-br-xl"></div>
                </div>

            </div>

            {/* 添加自定义动画样式 */}
            <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
        </div>
    );
}