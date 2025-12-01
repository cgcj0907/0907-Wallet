'use client';

import { useState, useEffect, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';

import * as bip39 from 'bip39';
import { HDNodeWallet } from 'ethers';

import { importWallet_en, importWallet_zh } from '@/app/walletManagement/lib/importWallet';

import { getUserRecord } from '@/app/userManagement/lib/savePassword';
import { hashPassword } from '@/app/lib/transform';
import { saveAddress } from '../lib/saveAddress';
import { saveWallet, countWallet } from '../lib/saveWallet';
import { encryptWallet } from '../lib/cryptoWallet';
import { AddressRecord, countAddress } from '../lib/saveAddress';
import { isLoggedInLocal } from '@/app/lib/auth';


type LanguageOption = 'auto' | 'en' | 'zh';

type WalletImportResult = {
    wallet: HDNodeWallet;
    mnemonic_en?: string;
    mnemonic_zh?: string;
};

/**
 * @file 导入钱包组件（ImportWallet）
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-30
 *
 * @description
 *   完整的前端 HD 钱包导入流程，支持以下核心功能：
 *   • 支持英文 / 中文助记词输入（12 或 24 词）
 *   • 自动识别语言（auto 模式）或手动指定
 *   • 支持整段粘贴自动填充词格 + 智能切换 12/24 词模式
 *   • 中英文助记词互转（基于 bip39 熵转换，保证 100% 等价）
 *   • 验证用户本地密码 → 解锁加密权限
 *   • 使用 bip39 + ethers 正确还原 HDNodeWallet 实例
 *   • 调用 encryptWallet() 用用户密码加密钱包（AES-256-GCM + PBKDF2）
 *   • 并行执行加密 + 查询已有钱包数量 → 决定 keyPath（首个为 '0'，其余为 UUID）
 *   • 并行写入 IndexedDB（Wallets 表 + Addresses 表）
 *   • 成功后展示钱包地址 + 可展开的英文/中文助记词（仅用于核对备份）
 *   • 明文助记词与私钥全程只存在内存，永不落盘，组件卸载后自动清理
 *
 * @security
 *   • 所有敏感操作均在客户端完成，无后端参与
 *   • 密码验证使用 SHA-256 哈希比对（与本地存储一致）
 *   • 加密密钥由用户密码 + 随机 salt 经 PBKDF2 派生
 *   • 助记词仅用于生成 wallet，导入后立即可销毁
 *
 * @flow 完整导入逻辑流程（handleImport）
 *   1. 读取并拼接用户输入的助记词
 *   2. 验证本地密码是否正确（hash 比对）
 *   3. 自动/手动识别助记词语言（en / zh）
 *   4. 调用 importWallet_en() 或 importWallet_zh() 还原 HDNodeWallet
 *   5. 并行：
 *        ├─ encryptWallet(wallet, password) → 加密钱包
 *        └─ countWallet() → 获取当前钱包数量
 *   6. 根据数量决定 keyPath：0 个 → '0'，否则 crypto.randomUUID()
 *   7. 构造 AddressRecord
 *   8. 并行写入 IndexedDB（Wallets + Addresses）
 *   9. 清理输入 + 显示成功界面 + 提供助记词核对
 */

export default function ImportWallet() {
    const router = useRouter();

    // 每格一个词（默认 12 格，可切换 12/24）
    const [wordCount, setWordCount] = useState<12 | 24>(12);
    const emptyWords = Array.from({ length: wordCount }).map(() => '');
    const [words, setWords] = useState<string[]>(emptyWords);

    // 语言、密码、UI 状态
    const [langOption, setLangOption] = useState<LanguageOption>('auto');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [walletData, setWalletData] = useState<WalletImportResult | null>(null);
    const [showMnemonic, setShowMnemonic] = useState(false);

    useEffect(() => {
        // 当 wordCount 改变时，调整 words 长度（保留已有内容）
        setWords(prev => {
            const next = Array.from({ length: wordCount }).map((_, i) => prev[i] ?? '');
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wordCount]);


    // ======= 辅助函数：读取/写入 助记词格子 =======
    const getPhraseFromInputs = () => words.map(w => w.trim()).filter(Boolean).join(' ').trim();

    const fillWordsFromPhrase = (phrase: string) => {
        const trimmed = phrase.trim().replace(/\s+/g, ' ');
        const arr = trimmed ? trimmed.split(' ') : [];
        if (arr.length !== 12 && arr.length !== 24) {
            // 若数量不符，则选择当前 wordCount 并尽量填充
            const cloned = Array.from({ length: wordCount }).map((_, i) => arr[i] ?? '');
            setWords(cloned);
            return arr.length;
        }
        // 如果长度是 12 或 24，自动切换 wordCount 并填充
        setWordCount(arr.length === 12 ? 12 : 24);
        setWords(Array.from({ length: arr.length }).map((_, i) => arr[i] ?? ''));
        return arr.length;
    };

    // 支持在卡片上直接粘贴完整助记词
    const handlePasteOnCard = (e: ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData('text/plain');
        if (!text) return;
        e.preventDefault();
        fillWordsFromPhrase(text);
        setStatus('已解析粘贴内容并填充词格（如需请切换 12/24）');
    };

    // 单格输入变化
    const handleWordChange = (index: number, value: string) => {
        setWords(prev => {
            const next = [...prev];
            next[index] = value.replace(/\s+/g, ''); // 单格不允许空格
            return next;
        });
    };

    // ======= 助记词校验与识别 =======
    const validateMnemonic = (mnemonic: string, lang: LanguageOption = 'auto') => {
        const trimmed = mnemonic.trim().replace(/\s+/g, ' ');
        if (!trimmed) return false;

        if (lang === 'en') return bip39.validateMnemonic(trimmed);
        if (lang === 'zh') return bip39.validateMnemonic(trimmed, bip39.wordlists.chinese_simplified);

        // auto: try english first, then chinese
        if (bip39.validateMnemonic(trimmed)) return true;
        if (bip39.validateMnemonic(trimmed, bip39.wordlists.chinese_simplified)) return true;
        return false;
    };

    const detectLanguage = (mnemonic: string): 'en' | 'zh' | null => {
        const trimmed = mnemonic.trim().replace(/\s+/g, ' ');
        if (!trimmed) return null;
        if (bip39.validateMnemonic(trimmed)) return 'en';
        if (bip39.validateMnemonic(trimmed, bip39.wordlists.chinese_simplified)) return 'zh';
        return null;
    };

    // ======= 转换（中 <-> 英），并切换语言按钮状态 =======
    const handleConvertLanguage = async () => {
        setStatus(null);
        const phrase = getPhraseFromInputs();
        if (!phrase) {
            setStatus('请先填写助记词后再转换。');
            return;
        }

        // 识别当前语言（优先使用 langOption）
        let detected = langOption === 'auto' ? detectLanguage(phrase) : (langOption === 'en' ? 'en' : 'zh');
        if (!detected) {
            setStatus('无法识别当前助记词语言，无法转换。');
            return;
        }

        try {
            if (detected === 'en') {
                // en -> zh
                const entropy = bip39.mnemonicToEntropy(phrase);
                const mnemonic_zh = bip39.entropyToMnemonic(entropy, bip39.wordlists.chinese_simplified);
                fillWordsFromPhrase(mnemonic_zh);
                // 切换语言按钮为中文
                setLangOption('zh');
                setStatus('已将英文助记词转换为中文显示（请核对）。');
            } else {
                // zh -> en
                const entropy = bip39.mnemonicToEntropy(phrase, bip39.wordlists.chinese_simplified);
                const mnemonic_en = bip39.entropyToMnemonic(entropy);
                fillWordsFromPhrase(mnemonic_en);
                // 切换语言按钮为英文
                setLangOption('en');
                setStatus('已将中文助记词转换为英文显示（请核对）。');
            }
        } catch (err: any) {
            console.error('convert error', err);
            setStatus('转换失败：助记词或校验和无效。');
        }
    };

    // ======= 主操作：导入助记词并保存钱包 =======
    const handleImport = async () => {
        setStatus(null);

        // 基础校验
        const phrase = getPhraseFromInputs();
        if (!phrase) {
            setStatus('请先输入或粘贴完整助记词（12 或 24 个词）。');
            return;
        }
        if (!password) {
            setStatus('请输入本地密码以验证并加密钱包。');
            return;
        }

        const userRecord = await getUserRecord();
        if (!userRecord) {
            // 未设置本地密码 -> 引导去设置
            router.replace('/userManagement');
            return;
        }

        const hashedInput = await hashPassword(password);
        if (hashedInput !== userRecord.passwordHash) {
            setStatus('密码错误，无法导入钱包。');
            return;
        }

        // 校验助记词（使用用户选择的语言优先）
        const isValid = validateMnemonic(phrase, langOption);
        if (!isValid) {
            setStatus('无效助记词，请检查单词顺序与拼写（支持英文/中文）。');
            return;
        }

        setLoading(true);

        try {
            // 识别并调用对应导入函数
            let detectedLang: 'en' | 'zh' | null = null;
            if (langOption === 'auto') {
                detectedLang = detectLanguage(phrase);
                if (!detectedLang) throw new Error('无法识别助记词语言（既不是有效英文也不是有效中文）。');
            } else {
                detectedLang = langOption === 'en' ? 'en' : 'zh';
            }

            // 导入 wallet（HDNodeWallet）
            let wallet: HDNodeWallet;
            let mnemonic_en: string | undefined;
            let mnemonic_zh: string | undefined;

            if (detectedLang === 'en') {
                wallet = await importWallet_en(phrase);
                mnemonic_en = phrase.trim().replace(/\s+/g, ' ');
                try {
                    const entropy = bip39.mnemonicToEntropy(mnemonic_en);
                    mnemonic_zh = bip39.entropyToMnemonic(entropy, bip39.wordlists.chinese_simplified);
                } catch (e) {
                    mnemonic_zh = undefined;
                }
            } else {
                wallet = await importWallet_zh(phrase);
                mnemonic_zh = phrase.trim().replace(/\s+/g, ' ');
                try {
                    const entropy = bip39.mnemonicToEntropy(mnemonic_zh, bip39.wordlists.chinese_simplified);
                    mnemonic_en = bip39.entropyToMnemonic(entropy);
                } catch (e) {
                    mnemonic_en = undefined;
                }
            }

            // 并行：加密钱包 & 统计已有钱包数量
            const [encryptedWallet, numberOfWallet, numberOfAddress] = await Promise.all([
                encryptWallet(wallet, password),
                countWallet(),
                countAddress()
            ]);

            // keyPath：第一个钱包 keyPath = '0'，否则 uuid
            let keyPath: string;
            if (numberOfWallet === 0) {
                keyPath = '0';
            } else {
                keyPath = crypto.randomUUID();
            }
            // 保存地址记录
            const addressRecord: AddressRecord = {
                wallet: {
                    type: 'HDNodeWallet',
                    KeyPath: keyPath
                },
                address: wallet.address,
                name: 'Account' + numberOfAddress.toString()
            };

            // 并行保存钱包和地址记录（无相互依赖，极大缩短用户等待时间）
            const [_, savedAddressKey] = await Promise.all([
                saveWallet(keyPath, encryptedWallet),    // 我们不关心返回值，所以用 _ 占位
                saveAddress(addressRecord, keyPath)               // 需要这个 key，正常接收
            ]);
            if (typeof savedAddressKey !== 'string') {
                throw new Error('保存地址失败（invalid key）');
            }

            // 成功
            setWalletData({
                wallet,
                mnemonic_en: mnemonic_en ?? '',
                mnemonic_zh: mnemonic_zh ?? ''
            });
            setShowMnemonic(true);
            setStatus('助记词导入并保存成功。');
            setPassword('');
            setWords(Array.from({ length: wordCount }).map(() => ''));
        } catch (err: any) {
            console.error('handleImport error:', err);
            setStatus(err?.message || '导入失败，请检查助记词或稍后重试。');
        } finally {
            setLoading(false);
        }
    };

    // 助记词网格渲染（每格一个输入，样式与 GenerateWallet 一致）
    const renderInputGrid = () => {
        return (
            <div
                // 支持在卡片任意位置粘贴整段助记词
                onPaste={handlePasteOnCard as any}
                className="grid grid-cols-3 gap-3 mt-4"
            >
                {words.map((w, i) => (
                    <div
                        key={i}
                        className="
              flex items-center 
              rounded-xl px-3 py-2 text-sm
              bg-blue-50 text-blue-600 font-medium
              shadow-sm border border-blue-100
            "
                    >
                        <span className="font-semibold text-blue-400 mr-2 min-w-3 text-right">{i + 1}.</span>
                        <input
                            value={w}
                            onChange={(e) => handleWordChange(i, e.target.value)}
                            placeholder={`word ${i + 1}`}
                            className="flex-1 ml-2 bg-transparent outline-none text-sm text-blue-700 placeholder:opacity-40"
                            spellCheck={false}
                            inputMode="text"
                            autoComplete="off"
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-md mx-auto">
            {/* ====== 白色卡片：语言/转换/词数/助记词输入（都在同一块） ====== */}
            {!walletData && (
                <div
                    className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm w-full"
                    // 支持在卡片上粘贴
                    onPaste={handlePasteOnCard as any}
                >
                    {/* 第一行：语言 按钮 + 转换按钮 + 词数切换 */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 mr-2">语言</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLangOption('auto')}
                                    className={`px-3 py-1 rounded ${langOption === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    type="button"
                                >
                                    自动
                                </button>
                                <button
                                    onClick={() => setLangOption('en')}
                                    className={`px-3 py-1 rounded ${langOption === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    type="button"
                                >
                                    英文
                                </button>
                                <button
                                    onClick={() => setLangOption('zh')}
                                    className={`px-3 py-1 rounded ${langOption === 'zh' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    type="button"
                                >
                                    中文
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setWordCount(prev => prev === 12 ? 24 : 12)}
                                className="px-3 py-1 rounded bg-gray-100 text-gray-700"
                                type="button"
                                aria-label="切换词数"
                            >
                                {wordCount} words
                            </button>

                            {/* 转换按钮（与语言同一白块） */}
                            <button
                                onClick={handleConvertLanguage}
                                className="px-3 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                                type="button"
                            >
                                转换
                            </button>
                        </div>
                    </div>

                    {/* 小提示 */}
                    <p className="mt-3 text-sm text-gray-500">
                        单词格输入（每格一个词）。可将整段助记词粘贴到此卡片任意位置，组件会自动解析并填充。
                    </p>

                    {/* 助记词格子输入 */}
                    {renderInputGrid()}

                    {/* 密码输入与导入按钮在同块内 */}
                    <div className="mt-4">
                        <div className="relative mb-3">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="请输入本地密码以验证并加密钱包"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-blue-500 px-2 py-1 bg-transparent rounded"
                            >
                                {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleImport}
                                disabled={loading}
                                aria-busy={loading}
                                className={`flex-1 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors ${loading ? 'opacity-60 cursor-wait' : ''}`}
                            >
                                {loading ? '导入中...' : '导入钱包'}
                            </button>

                            <button
                                onClick={() => {
                                    // 快速将当前格子拼接为一句话并显示（便于复制/调试）
                                    const phrase = getPhraseFromInputs();
                                    if (!phrase) {
                                        setStatus('当前助记词格为空，无法显示。');
                                    } else {
                                        // 尝试检测语言并提示
                                        const detected = detectLanguage(phrase);
                                        setStatus(detected ? `当前识别为 ${detected === 'en' ? '英文' : '中文'} 助记词` : '未识别语言');
                                    }
                                }}
                                className="px-3 py-2 rounded bg-gray-50 border border-gray-200 text-gray-700"
                                type="button"
                            >
                                检查
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 状态提示 */}
            {status && !walletData && <p className="mt-4 text-sm text-gray-600 text-center">{status}</p>}

            {/* 导入成功后显示助记词与地址信息（独立卡片） */}
            {walletData && (
                <div className="w-full bg-white shadow-md rounded-lg p-6 space-y-4">
                    <div className="p-2 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded">
                        ⚠️ 已导入的钱包仅保存为加密形式，本页面不再显示私钥。请确保你已妥善保存原始助记词。
                    </div>


                    {/* ====== 你要加入的那段 UI（显示在导入成功卡片内） ====== */}
                    <div className="mb-4">
                        <p className="mb-4 text-center text-green-700">{status || '钱包已生成'}</p>
                        <button
                            onClick={() => {
                                const path = isLoggedInLocal() ? '/home' : '/userManagement';
                                router.push(path);
                            }}
                            className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
                        >
                            {isLoggedInLocal() ? '回到主页' : '前往登录'}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowMnemonic((s) => !s)}
                        className="mb-4 w-full px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                        {showMnemonic ? '收起助记词' : '查看助记词（供核验/备份）'}
                    </button>

                    {showMnemonic && (
                        <div className="space-y-4 transition-all duration-500">
                            <div className="overflow-hidden transition-all duration-500 max-h-96">
                                <p className="font-medium text-gray-700">英文助记词:</p>
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    {(walletData.mnemonic_en ?? '').split(/\s+/).map((w, i) => (
                                        <div key={`en-${i}`} className="flex items-center rounded-xl px-3 py-2 text-sm bg-blue-50 text-blue-600 font-medium shadow-sm border border-blue-100">
                                            <span className="font-semibold text-blue-400 mr-1">{i + 1}.</span>{w}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="overflow-hidden transition-all duration-500 max-h-96">
                                <p className="font-medium text-gray-700">中文助记词:</p>
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    {(walletData.mnemonic_zh ?? '').split(/\s+/).map((w, i) => (
                                        <div key={`zh-${i}`} className="flex items-center rounded-xl px-3 py-2 text-sm bg-blue-50 text-blue-600 font-medium shadow-sm border border-blue-100">
                                            <span className="font-semibold text-blue-400 mr-1">{i + 1}.</span>{w}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
