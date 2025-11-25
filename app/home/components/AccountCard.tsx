'use client';

import { useState } from 'react';
import { getNetwork } from '@/app/networkManage/lib/storage';


/** Identicon：根据地址生成渐变头像 */
const Identicon = ({ addr, size = 44 }: { addr?: string; size?: number }) => {
    const hash = (addr || '')
        .split('')
        .reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const hue = hash % 360;

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `conic-gradient(
          hsl(${hue} 70% 60%), 
          hsl(${(hue + 60) % 360} 70% 60%)
        )`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
        />
    );
};

const openExplorer = async (addr?: string) => {
    if (!addr) return;

    const currentNetworkName = localStorage.getItem("currentNetwork");
    if (!currentNetworkName) {
        alert("未选择网络");
        return;
    }

    const net = await getNetwork(currentNetworkName);

    if (!net || !net.explorer) {
        alert("当前网络没有配置区块链浏览器");
        return;
    }

    // 拼接成完整 URL
    const url = `${net.explorer}/address/${addr}`;

    // 新开标签页访问
    window.open(url, "_blank");
};


/** 整合版 AccountCard（包含：按钮 + 弹窗） */
export default function AccountCard({ address }: { address: string | undefined }) {
    const [accountPanelOpen, setAccountPanelOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    /** 复制方法 */
    const copyToClipboard = async (text?: string) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const short = (addr?: string) => {
        if (!addr) return '';
        if (addr.length <= 12) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };



    return (
        <>
            {/* 按钮（打开弹窗） */}
            <button
                onClick={() => setAccountPanelOpen(true)}
                className="flex items-center gap-3 bg-white px-3 py-1 rounded-lg border border-sky-200 shadow-sm hover:shadow-md"
                aria-label="账户"
            >
                <Identicon addr={address} size={36} />

                <div className="text-right">
                    <div className="text-sm font-medium text-sky-800">
                        {short(address)}
                    </div>
                </div>
            </button>

            {/* 账户详情弹窗 */}
            {accountPanelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">

                    <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-sky-200 shadow-lg">

                        {/* 顶部标题 + 关闭 */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Identicon addr={address} size={48} />
                                <div>
                                    <div className="text-lg font-semibold text-sky-800">账户详情</div>
                                    <div className="text-xs text-sky-500">点击复制按钮即可复制</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setAccountPanelOpen(false)}
                                className="text-sky-600 text-sm"
                            >
                                关闭
                            </button>
                        </div>

                        {/* 地址展示 */}
                        <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 mb-4">
                            <div className="text-xs text-sky-500">完整地址</div>
                            <div className="text-sm font-mono text-sky-800 mt-2 break-all">{address}</div>
                        </div>

                        {/* 按钮区 */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => copyToClipboard(address)}
                                className="py-3 rounded-lg bg-white border border-sky-200 text-sky-700"
                            >
                                复制地址
                            </button>

                            <button
                                onClick={() => openExplorer(address)}
                                className="py-3 rounded-lg bg-white border border-sky-200 text-sky-700"
                            >
                                在浏览器查看
                            </button>

                        </div>

                        {/* 导出私钥 */}
                        <div className="mt-3">
                            <button
                                onClick={() => alert('导出私钥（演示）')}
                                className="w-full py-3 rounded-lg border border-red-200 text-red-600"
                            >
                                导出私钥
                            </button>
                        </div>

                        {/* 复制提示 */}
                        {copied && (
                            <div className="mt-3 text-sm text-sky-600">已复制到剪贴板</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
