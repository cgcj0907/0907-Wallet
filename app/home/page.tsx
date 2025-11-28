'use client';

import { useEffect, useState } from 'react';
import { getAddress } from '@/app/walletManagement/lib/saveAddress';

import MainCard from './components/MainCard';
import NetworkCard from './components/NetworkCard';
import AccountCard from './components/AccountCard';
import TokenCard from './components/TokenCard';
import TransactionCard from './components/TransactionCard';


export default function WalletHome() {
  const [address, setAddress] = useState<string>(localStorage.getItem('currentAddress') || '');

  const [tab, setTab] = useState<'assets' | 'activity'>('assets');
  const [network, setNetwork] = useState<string | null>('Ethereum');



  useEffect(() => {
    (async () => {
      try {
        // 如果 localStorage 没有 currentNetwork，则设置默认为 ethereum
        if (!localStorage.getItem('currentNetwork')) {
          localStorage.setItem('currentNetwork', 'ethereum');
        }
        setNetwork(localStorage.getItem('currentNetwork'));

        if (!localStorage.getItem('currentAddress')) {
          const addressRecord = await getAddress(0);

          setAddress(addressRecord.address);
          localStorage.setItem('currentAddress', addressRecord.address);
        }


      } catch (err) {
        console.error('获取地址失败', err);
      }
    })();

  }, []);




  return (
    <div className="min-h-[480px] w-full max-w-md mx-auto p-6 bg-sky-50 rounded-2xl shadow-xl">
      {/* 顶部：应用名 + 网络 + 简短账户显示（仅短地址） */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-semibold text-sky-800">0907 Wallet</div>
          <div className="text-xs text-sky-500 mt-1">Supported by SST</div>
        </div>

        <div className="flex items-center gap-3">

          <NetworkCard network={network} setNetwork={setNetwork} />


          <AccountCard address={address} />

        </div>
      </div>
      <MainCard address={address} network={network} />

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

      {/* 内容区*/}
      <div>
        {tab === 'assets' && (
          <TokenCard address={address} />
        )}

        {tab === 'activity' && (
          <TransactionCard network={network} />
        )}
      </div>

      <div className="text-center text-xs text-sky-400 mt-5">0907 WORLD · 赞助</div>


    </div>
  );
}
