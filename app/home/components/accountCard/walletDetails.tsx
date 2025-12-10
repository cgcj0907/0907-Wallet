import React, { useState } from 'react';
import { getPrivateKey } from '@/app/walletManagement/lib/getPrivateKey';
import { getWallet } from '@/app/walletManagement/lib/saveWallet';
import { decryptWallet } from '@/app/walletManagement/lib/cryptoWallet';
import { HDNodeWallet } from 'ethers';
import * as bip39 from 'bip39';

export default function WalletDetails({ setShowDetails }: { setShowDetails: (value: boolean) => void }) {
    const [password, setPassword] = useState<string>('');
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [mnemonicEn, setMnemonicEn] = useState<string | null>(null);
    const [mnemonicZh, setMnemonicZh] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const wordlist_zh: string[] = bip39.wordlists.chinese_simplified;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPrivateKey(null);
        setMnemonicEn(null);
        setMnemonicZh(null);
        setLoading(true);

        try {
            // 从 localStorage 获取 keyPath
            const keyPath = localStorage.getItem('currentAddressKeyPath');
            if (!keyPath) {
                throw new Error('未找到当前地址的 keyPath');
            }

            // 获取私钥（内部会解密）
            const privKey = await getPrivateKey(keyPath, password);
            setPrivateKey(privKey);

            // 额外解密以获取助记词（因为 getPrivateKey 只返回私钥，我们需要完整 wallet）
            const encryptedWallet = await getWallet(keyPath);
            if (!encryptedWallet) {
                throw new Error('钱包读取异常');
            }
            const wallet = await decryptWallet<HDNodeWallet>(encryptedWallet, password);

            // 英文助记词
            const mnemonic_en = wallet.mnemonic!.phrase;
            setMnemonicEn(mnemonic_en);

            // 生成中文助记词
            const entropy_en = wallet.mnemonic!.entropy.slice(2); // 去掉 "0x"
            const mnemonic_zh = bip39.entropyToMnemonic(entropy_en, wordlist_zh);
            setMnemonicZh(mnemonic_zh);
        } catch (err) {
            setError((err as Error).message || '发生未知错误');
        } finally {
            setLoading(false);
        }
    };

    const copyPrivateKeyToClipboard = () => {
        if (!privateKey) return;
        
        navigator.clipboard.writeText(privateKey).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            alert('复制失败');
        });
    };

    const renderMnemonicGrid = (mnemonic: string) => {
        const words = mnemonic.split(' ');
        return (
            <div className="grid grid-cols-3 gap-3 mt-4">
                {words.map((word, index) => (
                    <div
                        key={index}
                        className="
              flex items-center justify-center
              rounded-xl px-3 py-2 text-sm
              bg-blue-50 text-blue-600 font-medium
              shadow-sm border border-blue-100
              animate-fadeIn
            "
                    >
                        <span className="font-semibold text-blue-400 mr-1">{index + 1}.</span>
                        {word}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-md relative max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* 标题栏 */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">恢复钱包信息</h2>
                        <button
                            onClick={() => setShowDetails(false)}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            <i className="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* 可滚动内容区域 */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* 密码输入区域 */}
                    {!privateKey ? (
                        <>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4 relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="请输入密码用于解密钱包"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        autoComplete="current-password"
                                    />
                                    {/* 显示/隐藏密码按钮 */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-blue-500 px-2 py-1 bg-transparent rounded"
                                    >
                                        {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors ${loading ? 'opacity-60 cursor-wait' : ''}`}
                                >
                                    {loading ? '解密中...' : '解密并显示'}
                                </button>
                            </form>
                            {/* 安全提示 */}
                            <div className="p-2 mt-3 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded">
                                安全提示：请妥善保管您的私钥和助记词，建议离线存储, 任何获取这些信息的人都可以完全控制您的资产
                            </div>
                        </>
                    ) : (
                        // 解密成功后的显示区域
                        <div>
                            {/* 安全提示 */}
                            <div className="p-2 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded mb-6">
                                ⚠️ 请务必用纸将助记词和私钥写下，并妥善保管，切勿泄露给他人！
                            </div>

                            {privateKey && (
                                <div className="mb-8 w-full bg-white shadow-md rounded-lg p-6 space-y-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-800">私钥</h3>
                                        <button
                                            onClick={copyPrivateKeyToClipboard}
                                            className="shrink-0 ml-2 text-sky-500 hover:text-sky-700 transition-colors"
                                            title="复制私钥"
                                        >
                                            {copied ? (
                                                <i className="fa-solid fa-check text-emerald-500"></i>
                                            ) : (
                                                <i className="fa-regular fa-copy"></i>
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-md font-mono text-sm break-all">
                                        {privateKey}
                                    </div>
                                </div>
                            )}

                            {mnemonicEn && (
                                <div className="mb-8 w-full bg-white shadow-md rounded-lg p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">英文助记词</h3>
                                    {renderMnemonicGrid(mnemonicEn)}
                                </div>
                            )}

                            {mnemonicZh && (
                                <div className="mb-8 w-full bg-white shadow-md rounded-lg p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">中文助记词</h3>
                                    {renderMnemonicGrid(mnemonicZh)}
                                </div>
                            )}

                            {/* 完成按钮 */}
                            <button
                                onClick={() => setShowDetails(false)}
                                className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                                完成
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};