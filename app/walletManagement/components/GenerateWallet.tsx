//app/walletManagement/components/GenerateWallet.tsx
'use client'

/**
 * 钱包生成界面（随机 HD 钱包 + 加密 + 保存）
 * - 验证用户密码
 * - 生成随机钱包（助记词 + 钱包对象）
 * - 对钱包进行密码加密
 * - 将加密钱包通过 saveWallet() 持久化（IndexedDB）
 * - 同步将地址通过 saveAddress() 存储到 Address 表
 * - 展示助记词（英文 + 中文）
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { generateWallet, WalletResult } from '../lib/generateWallet';
import { encryptWallet } from '../lib/cryptoWallet';
import { saveWallet } from '../lib/saveWallet';

import { getUserRecord } from '@/app/userManagement/lib/savePassword';
import { hashPassword } from '@/app/lib/transform';

import { saveAddress } from '../lib/saveAddress';
import { AddressRecord } from '../lib/saveAddress';

/**
 * @file HD 钱包生成组件
 * @description 
 *  - 输入本地密码 → 验证 → 生成随机 HD 钱包
 *  - 同时生成英文 & 中文助记词（中文使用 bip39 中文词库）
 *  - 使用用户密码加密 HDNodeWallet → 持久化到 IndexedDB（Wallets 表）
 *  - 自动生成地址记录 → 持久化到 IndexedDB（Addresses 表）
 *  - 组件负责 UI 展示、助记词展开动画、输入校验、错误提示等行为
 *
 * @author 
 *   Guangyang Zhong | github: https://github.com/cgcj0907
 *
 * @date 
 *   2025-11-28
 */

export default function GenerateWallet() {

  /** 钱包生成的数据（助记词 + HD 钱包实例） */
  const [walletData, setWalletData] = useState<WalletResult | null>(null);

  /** 用户输入的加密密码（用于加密钱包） */
  const [password, setPassword] = useState('');

  /** 状态提示（成功、失败、错误等） */
  const [status, setStatus] = useState<string | null>(null);

  /** 是否显示密码明文 */
  const [showPassword, setShowPassword] = useState(false);

  /** 是否展开助记词区域 */
  const [showMnemonic, setShowMnemonic] = useState(false);

  /** 钱包是否成功保存 */
  const [ifWalletSaved, setifWalletSaved] = useState(false);

  /** 加载中状态（防多次点击） */
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  /**
   * 点击“生成钱包”按钮逻辑
   * 1. 校验密码是否正确（与本地记录的 passwordHash 对比）
   * 2. 生成随机 HD 钱包（助记词 + wallet 对象）
   * 3. encryptWallet() 使用密码对钱包进行 AES 加密
   * 4. saveWallet() 保存到 IndexedDB（Wallets 表）
   * 5. saveAddress() 保存地址到 Addresses 表
   * 6. 展示助记词并显示成功状态
   */
  const handleGenerate = async () => {

    // === 1. 密码判空 ===
    if (!password) {
      setStatus('请先输入密码');
      return;
    }

    // === 2. 获取用户密码记录（若无用户记录 → 跳转到 userManagement 进行创建）===
    const userRecord = await getUserRecord();
    if (!userRecord) {
      router.replace('/userManagement');
      return;
    }

    // === 3. 校验密码是否正确 ===
    const hashedInputPwd = await hashPassword(password);
    if (hashedInputPwd !== userRecord?.passwordHash) {
      setStatus('密码错误,无法生成钱包');
      return;
    }

    setLoading(true);

    try {
      // === 4. 生成钱包（同步） ===
      const walletResult = generateWallet();
      setWalletData(walletResult);

      // === 5. 使用密码对钱包加密 ===
      const encryptedWallet = await encryptWallet(walletResult.wallet, password);

      // === 6. 保存钱包到 Wallets 表（返回 key） ===
      const savedWalletKey = await saveWallet(encryptedWallet);
      if (typeof savedWalletKey !== 'number' || savedWalletKey < 0) {
        throw new Error('保存钱包失败（invalid key）');
      }

      // === 7. 构建 AddressRecord 并保存 ===
      const addressRecord: AddressRecord = {
        wallet: {
          type: 'HDNodeWallet',   // 你的钱包类型结构
          KeyPath: String(savedWalletKey)
        },
        address: walletResult.wallet.address
      };

      const savedAddressKey = await saveAddress(addressRecord);
      if (typeof savedAddressKey !== 'number' || savedAddressKey < 0) {
        throw new Error('保存地址失败（invalid key）');
      }

      // === 8. 全部成功 ===
      setifWalletSaved(true);
      setStatus('钱包生成并加密成功，已保存到本地');
      setPassword('');

    } catch (err: any) {
      console.error('handleGenerate error:', err);
      setStatus(err?.message || '生成或保存钱包失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 渲染助记词网格
   * @param mnemonic 12/24 个助记词词组
   */
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


  // ===========================
  // ======== 组件 UI ==========
  // ===========================
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md m-auto">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">
        生成随机钱包
      </h2>

      {/* ================= 密码输入区 & 生成按钮 ================= */}
      {!ifWalletSaved ? (
        <>
          {/* 密码输入框 */}
          <div className="mb-4 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码用于加密钱包"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* 显示/隐藏密码按钮 */}
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-blue-500 px-2 py-1 bg-transparent rounded"
            >
              {showPassword ?  <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
            </button>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            aria-busy={loading}
            className={`w-full py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors ${loading ? 'opacity-60 cursor-wait' : ''}`}
          >
            {loading && <span className="spinner mr-2" />}
            {loading ? '生成中...' : '生成钱包'}
          </button>

          {/* 状态提示 */}
          {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
        </>
      ) : (
        // ====== 钱包保存成功 ======
        <div className="mb-4">
          <p className="mb-4 text-center text-green-700">{status || '钱包已生成'}</p>
          <button
            onClick={() => router.push('/userManagement')}
            className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
          >
            前往登录
          </button>
        </div>
      )}


      {/* ================= 助记词展示 ================= */}
      {walletData && (
        <div className="mt-8 w-full bg-white shadow-md rounded-lg p-6 space-y-4">

          <div className="p-2 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded">
            ⚠️ 请务必用纸将助记词写下，并妥善保管，切勿泄露给他人！
          </div>

          {/* 展开/收起助记词 */}
          <button
            type="button"
            onClick={() => setShowMnemonic(prev => !prev)}
            className="mb-4 w-full px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            {showMnemonic ? '收起助记词' : '点击查看助记词'}
          </button>

          {showMnemonic && (
            <div className="space-y-4 transition-all duration-500">

              {/* 英文助记词 */}
              <div className="overflow-hidden transition-all duration-500 max-h-96">
                <p className="font-medium text-gray-700">英文助记词:</p>
                {renderMnemonicGrid(walletData.mnemonic_en)}
              </div>

              {/* 中文助记词 */}
              <div className="overflow-hidden transition-all duration-500 max-h-96">
                <p className="font-medium text-gray-700">中文助记词:</p>
                {renderMnemonicGrid(walletData.mnemonic_zh)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
