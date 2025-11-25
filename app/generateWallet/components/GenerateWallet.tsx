'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateWallet, WalletResult } from '../lib/generateWallet';
import { encryptWallet } from '../lib/cryptoWallet';
import { saveWallet } from '../lib/saveWallet';
import { getUserRecord } from '@/app/userLogin/lib/storagePassword';
import { hashPassword } from '@/app/lib/hash';
import { saveAddress } from '../lib/saveAddress';
import { AddressRecord } from '../lib/saveAddress';

export default function GenerateWallet() {
  const [walletData, setWalletData] = useState<WalletResult | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [ifWalletSaved, setifWalletSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!password) {
      setStatus('请先输入密码');
      return;
    }

    const userRecord = await getUserRecord();
    if (!userRecord) {
      router.replace('/userLogin');
      return;
    }

    const hashedInputPwd = await hashPassword(password);
    if (hashedInputPwd !== userRecord?.passwordHash) {
      setStatus('密码错误,无法生成钱包');
      return;
    }

    setLoading(true);
    try {
      // 生成（可能是同步）
      const walletResult = generateWallet();
      setWalletData(walletResult);

      // 加密并保存钱包
      const encryptedWallet = await encryptWallet(walletResult.wallet, password);
      // 约定 saveWallet 返回 number（保存的 key），否则抛错或返回 null/-1
      const savedWalletKey = await saveWallet(encryptedWallet);
      if (typeof savedWalletKey !== 'number' || savedWalletKey < 0) {
        throw new Error('保存钱包失败（invalid key）');
      }

      // 构建 address record 并保存（约定也返回 number）
      const addressRecord: AddressRecord = {
        wallet: {
          type: 'HDNodeWallet',      // 如果你要存对象，改这里
          KeyPath: String(savedWalletKey)
        },
        address: walletResult.wallet.address
      };

      const savedAddressKey = await saveAddress(addressRecord);
      if (typeof savedAddressKey !== 'number' || savedAddressKey < 0) {
        throw new Error('保存地址失败（invalid key）');
      }

      // 到这里都成功
      setifWalletSaved(true);
      setStatus('钱包生成并加密成功，已保存到本地');
      setPassword(''); // 仅在成功时清空密码
    } catch (err: any) {
      console.error('handleGenerate error:', err);
      // 更友好的错误信息
      setStatus(err?.message || '生成或保存钱包失败，请重试');
    } finally {
      setLoading(false); // 统一清理
    }
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
            rounded-xl  
            px-3 py-2  
            text-sm 
            bg-blue-50  
            text-blue-600
            font-medium
            shadow-sm
            border border-blue-100
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
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md m-auto">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">
        生成随机钱包
      </h2>

      {/* 密码输入 / 或生成后替换为登录跳转按钮 */}
      {!ifWalletSaved ? (
        <>
          <div className="mb-4 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码用于加密钱包"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-blue-500 px-2 py-1 bg-transparent rounded"
            >
              {showPassword ? '隐藏' : '显示'}
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
          {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
        </>
      ) : (
        <div className="mb-4">
          <p className="mb-4 text-center text-green-700">{status || '钱包已生成'}</p>
          <button
            onClick={() => router.push('/userLogin')}
            className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
          >
            前往登录
          </button>
        </div>
      )}



      {/* 助记词展示 */}
      {walletData && (
        <div className="mt-8 w-full bg-white shadow-md rounded-lg p-6 space-y-4">

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
          {showMnemonic && (
            <div className="space-y-4 transition-all duration-500">
              {/* 安全提示 */}


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
