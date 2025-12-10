'use client';
import { useEffect, useState } from 'react';
import { getNetwork } from '@/app/networkManagement/lib/saveNetwork';
import SwitchAccount from './SwitchAccount';
import { useRouter } from 'next/navigation';
import { AddressRecord, modifyAddressName, getAddress } from '@/app/walletManagement/lib/saveAddress';
import WalletDetails from './walletDetails';

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

export default function AccountPanel({
    addressRecord,
    accountPanelOpen,
    setAccountPanelOpen,
    setAddressRecord
}: {
    addressRecord: AddressRecord,
    accountPanelOpen: boolean,
    setAccountPanelOpen: (value: boolean) => void,
    setAddressRecord: (addressRecord: AddressRecord) => void
}) {
    const [copied, setCopied] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(addressRecord.name);
    const [showDetails, setShowDetails] = useState(false);
    const router = useRouter();

    const handleCopy = async () => {
        if (!addressRecord) return;
        await navigator.clipboard.writeText(addressRecord.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 保存修改名字
    const handleSaveName = async () => {
        if (!addressRecord) return;
        const keyPath = localStorage.getItem('currentAddressKeyPath');
        if (keyPath !== null) {
            await modifyAddressName(keyPath, nameInput);
        }

        addressRecord.name = nameInput;
        setEditingName(false);
    };

    return (
        <>
            {accountPanelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-sky-100 shadow-lg shadow-sky-100/30">
                        {/* 头像和账户选择区域 */}
                        <div className="flex flex-col items-center">
                            {/* 账户选择器和名称编辑区域 */}
                            <div className="w-full mb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex">
                                        <div className="flex">
                                            {editingName ? (
                                                <div className="relative flex pl-2 items-center justify-center gap-3 text-center">
                                                    <i className="fa-regular fa-user"></i>
                                                    <input
                                                        value={nameInput}
                                                        onChange={(e) => setNameInput(e.target.value)}
                                                        className="w-30 border-b-2 border-sky-500 bg-transparent py-1 px-1 text-lg font-semibold text-sky-800 focus:outline-none focus:ring-0"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                                        autoFocus
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r from-sky-400 to-blue-400 transform scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100"></div>
                                                </div>
                                            ) : (
                                                <div className="flex pl-2 items-center justify-center gap-3 text-center">
                                                    <i className="fa-regular fa-user"></i>
                                                    <h2 className="text-xl font-bold text-sky-800">{addressRecord.name}</h2>

                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all }`}
                                            onClick={() => {
                                                if (editingName) {
                                                    handleSaveName();
                                                } else {
                                                    setEditingName(true);
                                                }
                                            }}
                                        >
                                            {editingName ? (
                                                <i className="fa-solid fa-check text-sm"></i>
                                            ) : (
                                                <i className="fa-regular fa-pen-to-square text-sm"></i>
                                            )}
                                        </button>
                                    </div>
                                    {/* 顶部关闭按钮 */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setAccountPanelOpen(false)}
                                            className="w-8 h-8 rounded-full text-sky-400 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                                        >
                                            <i className="fa-solid fa-xmark text-lg"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* 账户选择器 */}
                                <div className="relative">
                                    <SwitchAccount
                                        setAddressRecord={setAddressRecord}
                                        defaultAddressKey={localStorage.getItem('currentAddressKeyPath')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 地址显示区域 */}
                        <div className="bg-sky-50/50 rounded-xl p-4 mb-2 border border-sky-100">
                            <div className="flex items-start gap-2 mb-2">
                                <i className="fa-solid fa-address-card text-sky-400 mt-0.5"></i>
                                <span className="text-xs font-medium text-sky-600">钱包地址</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <code className="text-sm font-mono text-sky-800 break-all">
                                    {addressRecord.address}
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="shrink-0 ml-2 text-sky-500 hover:text-sky-700 transition-colors"
                                    title="复制地址"
                                >
                                    {copied ? (
                                        <i className="fa-solid fa-check text-emerald-500"></i>
                                    ) : (
                                        <i className="fa-regular fa-copy"></i>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 操作按钮区域 */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => openExplorer(addressRecord.address)}
                                className="py-3 px-4 rounded-xl bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2 hover:bg-sky-50 hover:border-sky-300 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                                    <i className="fa-solid fa-globe text-sky-500"></i>
                                </div>
                                <span className="text-sm font-medium">区块浏览器</span>
                            </button>

                            <button
                                onClick={() => router.replace('/walletManagement')}
                                className="py-3 px-4 rounded-xl bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2 hover:bg-sky-50 hover:border-sky-300 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                                    <i className="fa-solid fa-wallet text-sky-500"></i>
                                </div>
                                <span className="text-sm font-medium">管理钱包</span>
                            </button>

                            {/* 展示助记词/私钥按钮 - 占一整行 */}
                            <button
                                onClick={() => { setShowDetails(true) }}
                                className="py-3 px-4 rounded-xl bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2 hover:bg-sky-50 hover:border-sky-300 transition-all group col-span-2"
                            >
                                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                                    <i className="fa-solid fa-key text-sky-500"></i>
                                </div>
                                <span className="text-sm font-medium">展示助记词/私钥</span>
                            </button>
                        </div>
                        {showDetails &&
                            <WalletDetails setShowDetails={setShowDetails} />
                        }
                    </div>
                </div>
            )}
        </>
    );
}