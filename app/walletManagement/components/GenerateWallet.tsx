//app/walletManagement/components/GenerateWallet.tsx
// app/walletManagement/components/GenerateWallet.tsx
'use client'

/**
 * HD 钱包生成组件
 *
 * 职责：
 * 1. 验证用户输入的本地密码（与 IndexedDB 中的 passwordHash 对比）
 * 2. 调用 generateWallet() 生成随机钱包（英文/中文助记词 + HD 钱包对象）
 * 3. 使用 encryptWallet() 通过用户密码加密 HDNodeWallet
 * 4. 调用 saveWallet() 将加密钱包保存到 IndexedDB 的 Wallets 表
 * 5. 调用 saveAddress() 保存 1 个默认地址到 Addresses 表
 * 6. 显示助记词和操作状态
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { generateWallet, WalletResult } from '../lib/generateWallet';
import { encryptWallet } from '../lib/cryptoWallet';
import { saveWallet, countWallet } from '../lib/saveWallet';

import { getUserRecord } from '@/app/userManagement/lib/savePassword';
import { hashPassword } from '@/app/lib/transform';

import { AddressRecord, saveAddress, countAddress } from '../lib/saveAddress';


import { isLoggedInLocal } from '@/app/lib/auth';


/**
 * @file HD 钱包生成组件
 * @description
 * - 输入本地密码 → 验证 → 生成随机 HD 钱包
 * - 同时生成英文 & 中文助记词（中文使用 bip39 中文词库）
 * - 使用用户密码加密 HDNodeWallet → 持久化到 IndexedDB（Wallets 表）
 * - 自动生成地址记录 → 持久化到 IndexedDB（Addresses 表）
 * - 组件负责 UI 展示、助记词展开动画、输入校验、错误提示等行为
 *
 * @author
 * Guangyang Zhong | github: https://github.com/cgcj0907
 *
 * @date
 * 2025-11-28
 */

export default function GenerateWallet() {

  /** 保存 generateWallet() 的结果（助记词 + HDNodeWallet 实例） */
  const [walletData, setWalletData] = useState<WalletResult | null>(null);

  /** 用户输入的密码，用于 AES 加密钱包 */
  const [password, setPassword] = useState('');

  /** UI 显示的状态提示（错误/成功文本） */
  const [status, setStatus] = useState<string | null>(null);

  /** 控制密码明文显示/隐藏 */
  const [showPassword, setShowPassword] = useState(false);

  /** 是否展开助记词区域 */
  const [showMnemonic, setShowMnemonic] = useState(false);

  /** 是否成功保存钱包（用于切换 UI） */
  const [ifWalletSaved, setifWalletSaved] = useState(false);

  /** 生成钱包按钮 loading 状态，避免重复点击 */
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  /**
   * 处理“生成钱包”按钮逻辑：
   * 1. 校验密码
   * 2. 生成钱包（助记词 + HD 钱包对象）
   * 3. 使用密码加密钱包
   * 4. 保存钱包到 Wallets 表
   * 5. 保存地址到 Addresses 表
   * 6. 展示助记词
   */
  const handleGenerate = async () => {

    // 1. 密码不能为空
    if (!password) {
      setStatus('请先输入密码');
      return;
    }

    // 2. 读取用户本地密码记录（若无 → 用户还未设置密码 → 跳转 userManagement 设置）
    const userRecord = await getUserRecord();
    if (!userRecord) {
      router.replace('/userManagement');
      return;
    }

    // 3. 校验密码是否正确：对输入密码 hash → 与 IndexedDB 中的 passwordHash 比较
    const hashedInputPwd = await hashPassword(password);
    if (hashedInputPwd !== userRecord?.passwordHash) {
      setStatus('密码错误,无法生成钱包');
      return;
    }

    setLoading(true); // 避免重复点击

    try {
      // 4. 生成随机 HD 钱包（含助记词）
      const walletResult = generateWallet();
      setWalletData(walletResult);

      // 并行计算加密钱包 & 当前钱包数量
      const [encryptedWallet, numberOfWallet, numberOfAddress] = await Promise.all([
        encryptWallet(walletResult.wallet, password),
        countWallet(),
        countAddress()
      ]);

      // 5. 生成 keyPath：第一个钱包使用 keyPath=0，其他使用 UUID
      let keyPath: string;
      if (numberOfWallet === 0) {
        keyPath = '0';
      } else {
        keyPath = crypto.randomUUID();
      }
      // 6. 构建地址记录（地址属于 HDNodeWallet）
      const addressRecord: AddressRecord = {
        wallet: {
          type: 'HDNodeWallet',
          KeyPath: keyPath         
        },
        address: walletResult.wallet.address,
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

      // 全部成功 → 更新状态
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
   * 渲染助记词网格 UI（12 / 24 个词）
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
            {/* 助记词顺序编号 */}
            <span className="font-semibold text-blue-400 mr-1">{index + 1}.</span>
            {word}
          </div>
        ))}
      </div>
    );
  };

  // ===========================
  // ======= 组件 UI ===========
  // ===========================
  return (
    <div>

      {/* === 密码输入 + 按钮区域 === */}
      {!ifWalletSaved ? (
        <>
          {/* 用户输入用于加密的本地密码 */}
          <div className="mb-4 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码用于加密钱包"
              autoComplete="current-password"
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
              {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
            </button>
          </div>

          {/* 主操作按钮：生成钱包 */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            aria-busy={loading}
            className={`w-full py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors ${loading ? 'opacity-60 cursor-wait' : ''}`}
          >
            {loading && <span className="spinner mr-2" />}
            {loading ? '生成中...' : '生成钱包'}
          </button>

          {/* 错误 / 状态提示 */}
          {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
        </>
      ) : (
        // 钱包保存成功的 UI
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

      )}

      {/* === 助记词展示区域 === */}
      {walletData && (
        <div className="mt-8 w-full bg-white shadow-md rounded-lg p-6 space-y-4">

          {/* 安全提示 */}
          <div className="p-2 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded">
            ⚠️ 请务必用纸将助记词写下，并妥善保管，切勿泄露给他人！
          </div>

          {/* 展开/收起按钮 */}
          <button
            type="button"
            onClick={() => setShowMnemonic(prev => !prev)}
            className="mb-4 w-full px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            {showMnemonic ? '收起助记词' : '点击查看助记词'}
          </button>

          {/* 助记词内容 */}
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
