'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getAddress } from '@/app/generateWallet/lib/saveAddress';

import MainCard from './components/MainCard';
import NetworkCard from './components/NetworkCard';
import AccountCard from './components/AccountCard';
import TokenCard from './components/TokenCard';
/**
 * 优化版：仿 MetaMask 风格，但去掉地址冗余、增加留白与可读性
 * - 顶部显示短地址（便于看），完整地址放到 "账户详情" 弹窗中（需要时查看/复制）
 * - 更大的按钮、更明显的间距（适合长者操作）
 */

export default function WalletHome() {
  const [address, setAddress] = useState<string>('0x0');

  const [balance, setBalance] = useState('0.0000');
  const [fiat, setFiat] = useState('$0.00');

  const [tab, setTab] = useState<'assets' | 'activity'>('assets');
  const [network, setNetwork] = useState<string | null>('Ethereum');
  const [showNetworkCard, setShowNetworkCard] = useState(false);
  const copyTimer = useRef<number | null>(null);


  useEffect(() => {
    (async () => {
      try {
        // 如果 localStorage 没有 currentNetwork，则设置默认为 ethereum
        if (!localStorage.getItem('currentNetwork')) {
          localStorage.setItem('currentNetwork', 'ethereum');
        }
        setNetwork(localStorage.getItem('currentNetwork'));
        const addressRecord = await getAddress(0);

        setAddress(addressRecord.address);
        localStorage.setItem('currentAddress', addressRecord.address);

      } catch (err) {
        console.error('获取地址失败', err);
      }
    })();

    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);


  const handleCloseNetworkCard = () => {
    setShowNetworkCard(false);

    // 重新读取 localStorage 的 currentNetwork 更新状态
    const current = localStorage.getItem('currentNetwork');
    if (current) {
      setNetwork(current);
    }
  };


  const sampleTokens = [
    { symbol: 'ETH', balance: balance, subtitle: `${fiat}（估算）` },
    { symbol: 'USDC', balance: '250.00', subtitle: '$250.00' },
    { symbol: 'DAI', balance: '120.00', subtitle: '$120.00' },
  ];

  return (
    <div className="min-h-[480px] w-full max-w-md mx-auto p-6 bg-sky-50 rounded-2xl shadow-xl">
      {/* 顶部：应用名 + 网络 + 简短账户显示（仅短地址） */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-semibold text-sky-800">0907 Wallet</div>
          <div className="text-xs text-sky-500 mt-1">Supported by SST</div>
        </div>

        <div className="flex items-center gap-3">
          <div className=" flex flex-col ">
            <div className="flex">

              <button
                onClick={() => setShowNetworkCard(true)}
                className='text-xs px-3 py-1 rounded-full border transition font-medium 
                  bg-white text-sky-500 border-sky-100 hover:bg-sky-50'
              >
                {network}
              </button>

            </div>
            {showNetworkCard && (
              <NetworkCard onClose={handleCloseNetworkCard} />
            )}
          </div>

          <AccountCard address={address} />

        </div>
      </div>
      <MainCard />

      {/* 标签栏：简洁 */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setTab('assets')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'assets' ? 'bg-sky-600 text-white' : 'bg-white border border-sky-200 text-sky-700'}`}
        >
          资产
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'activity' ? 'bg-sky-600 text-white' : 'bg-white border border-sky-200 text-sky-700'}`}
        >
          交易
        </button>
      </div>

      {/* 内容区：更宽松的行高与间距 */}
      <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-sm">
        {tab === 'assets' && (
          <TokenCard/>
        )}

        {tab === 'activity' && (
          <div>
            <div className="text-sm text-sky-700 font-medium mb-3">最近交易</div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg hover:bg-sky-50 flex items-start justify-between">
                <div>
                  <div className="text-sm text-sky-800 font-medium">收到 0.5 ETH</div>
                  <div className="text-xs text-sky-500">来自 0x3fa...9b2a</div>
                </div>
                <div className="text-xs text-sky-500">2 小时前</div>
              </div>
              <div className="p-3 rounded-lg hover:bg-sky-50 flex items-start justify-between">
                <div>
                  <div className="text-sm text-sky-800 font-medium">发送 0.1 ETH</div>
                  <div className="text-xs text-sky-500">到 0xab4...c2ef</div>
                </div>
                <div className="text-xs text-sky-500">昨天</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-sky-400 mt-5">0907 WORLD · 简洁模式</div>


    </div>
  );
}
