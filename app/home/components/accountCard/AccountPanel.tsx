'use client';
import { useState } from 'react';
import { getNetwork } from '@/app/networkManagement/lib/saveNetwork';
import Avatar from 'boring-avatars';
import SwitchAccount from './SwitchAccount';
import { useRouter } from 'next/navigation';
import { AddressRecord, modifyAddressName } from '@/app/walletManagement/lib/saveAddress';

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
    const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(addressRecord.name);

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
            await modifyAddressName(keyPath, nameInput); // 调用你的修改函数
        }

        addressRecord.name = nameInput; // 本地立即更新显示
        setEditingName(false);
    };

    return (
        <>
            {accountPanelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-sky-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={addressRecord.address}
                                    size={48}
                                    variant="beam"
                                    colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        {editingName ? (
                                            <input
                                                value={nameInput}
                                                onChange={(e) => setNameInput(e.target.value)}
                                                className="border-b border-sky-400 text-lg font-semibold text-sky-800 focus:outline-none w-28"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                            />
                                        ) : (
                                            <span className="text-lg font-semibold text-sky-800">{addressRecord.name}</span>
                                        )}

                                        <button
                                            className="text-xs text-sky-600 px-1 py-0.5 rounded"
                                            onClick={() => {
                                                if (editingName) {
                                                    handleSaveName();
                                                } else {
                                                    setEditingName(true);
                                                }
                                            }}
                                        >
                                            {editingName ? <i className="fa-solid fa-check"></i> : <i className="fa-regular fa-pen-to-square"></i>}
                                        </button>
                                    </div>

                                </div>

                            </div>
                            <button
                                onClick={() => setAccountPanelOpen(false)}
                                className="text-sky-600 text-sm"
                            >
                               <i className="fa-regular fa-rectangle-xmark fa-2xl"></i>
                            </button>
                        </div>

                        <div className="bg-sky-50 p-1 rounded-lg border border-sky-100 mb-4">
                            <i className="fa-solid fa-address-card" style={{color: "#74C0FC"}}></i>
                            <div className="text-sm font-mono text-sky-800 mt-2">{addressRecord.address}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCopy}
                                className="py-3 px-4 rounded-lg bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2"
                            >
                                {copied ? (
                                    <i className="fa-solid fa-check"></i>
                                ) : (
                                    <i className="fa-regular fa-copy"></i>
                                )}
                                <span>{copied ? "已复制" : "复制"}</span>
                            </button>

                            <button
                                onClick={() => openExplorer(addressRecord.address)}
                                className="py-3 px-4 rounded-lg bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2"
                            >
                                <i className="fa-brands fa-internet-explorer fa-beat"></i>
                                <span>在浏览器查看</span>
                            </button>

                            <button
                                onClick={() => setSwitchAccountOpen(true)}
                                className="py-3 px-4 rounded-lg bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-repeat"></i>
                                <span>切换账户</span>
                            </button>

                            {switchAccountOpen && <SwitchAccount  setAddressRecord={setAddressRecord} setSwitchAccountOpen={setSwitchAccountOpen} />}

                            <button
                                onClick={() => router.replace('/walletManagement')}
                                className="py-3 px-4 rounded-lg bg-white border border-sky-200 text-sky-700 flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-plus"></i>
                                <span>生成/导入钱包</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
