'use client';
import { useState } from 'react';
import { getNetwork } from '@/app/networkManagement/lib/saveNetwork';
import Avatar from 'boring-avatars';
/* 打开区块链浏览器 */
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
    const url = `${net.explorer}/address/${addr}`;
    window.open(url, "_blank");
};

export default function AccountPanel({ address, accountPanelOpen, setAccountPanelOpen }:
    { address: string | undefined, accountPanelOpen: boolean, setAccountPanelOpen: (value: boolean) => void }) {

  
    // 弹窗复制状态
    const [copied, setCopied] = useState(false);

    // 处理弹窗的地址复制
    const handleCopy = async () => {
        try {
            if (!address) return;
            await navigator.clipboard.writeText(address);
            setCopied(true);

            // 2 秒后恢复原来的图标
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("复制失败", err);
        }
    };


    return (
        <>
            {accountPanelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-sky-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={address}
                                    size={48}
                                    variant="beam"
                                    colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
                                />
                                <div>
                                    <div className="text-lg font-semibold text-sky-800">账户详情</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setAccountPanelOpen(false)}
                                className="text-sky-600 text-sm"
                            >
                                关闭
                            </button>
                        </div>
                        <div className="bg-sky-50 p-1 rounded-lg border border-sky-100 mb-4">
                            <div className="text-xs text-sky-500">完整地址</div>
                            <div className="text-sm font-mono text-sky-800 mt-2">{address}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCopy}
                                className="py-3 px-4 rounded-lg bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2"
                            >
                                {/* 切换图标 */}
                                {copied ? (
                                    <i className="fa-solid fa-check"></i>
                                ) : (
                                    <i className="fa-regular fa-copy"></i>
                                )}
                                <span>{copied ? "已复制" : "复制"}</span>
                            </button>

                            <button
                                onClick={() => openExplorer(address)}
                                className="py-3 px-4 rounded-lg bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2"
                            >
                                <i className="fa-brands fa-internet-explorer fa-beat"></i>
                                <span>在浏览器查看</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}