'use client';

import { useEffect, useState } from 'react';
import { AddressRecord, getAddress } from '@/app/walletManagement/lib/saveAddress';

import MainCard from './components/MainCard';
import NetworkCard from './components/NetworkCard';
import AccountCard from './components/AccountCard';
import TokenCard from './components/TokenCard';
import TransactionCard from './components/TransactionCard';




export default function WalletHome() {
  const [addressRecord, setAddressRecord] = useState<AddressRecord>()
  const [tab, setTab] = useState<'assets' | 'activity'>('assets');
  const [network, setNetwork] = useState<string | null>('Ethereum');
  const [totalBalance, setTotalBalance] = useState<number>(0);




  useEffect(() => {
    (async () => {
      try {
        // 如果 localStorage 没有 currentNetwork，则设置默认为 ethereum
        if (!localStorage.getItem('currentNetwork')) {
          localStorage.setItem('currentNetwork', 'ethereum');
        }
        setNetwork(localStorage.getItem('currentNetwork'));
        const addressKeyPath = localStorage.getItem('currentAddressKeyPath');
        if (!addressKeyPath) {
          const addressRecord = await getAddress('0');
          if (addressRecord) {
            setAddressRecord(addressRecord);
            localStorage.setItem('currentAddressKeyPath', '0');
          }
        } else if (addressKeyPath) {
          const addressRecord = await getAddress(addressKeyPath);
          if (addressRecord) {
            setAddressRecord(addressRecord);
          }
        }

      } catch (err) {
        console.error('获取地址失败', err);
      }
    })();

  }, []);




  return (
    <div className="min-h-[480px] w-full max-w-md mx-auto p-5 bg-sky-50 rounded-2xl shadow-xl">
      {/* 顶部：应用名 + 网络 + 简短账户显示（仅短地址） */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex gap-2 items-center">
            <i className="fa-solid fa-wallet" style={{ color: "#74C0FC" }}></i>
            <div className="text-lg font-semibold text-sky-800">0907 Wallet</div>
          </div>
          <div className="text-xs text-sky-500 mt-1">Supported by SST</div>
        </div>

        <div className="flex items-center gap-3">

          <NetworkCard network={network} setNetwork={setNetwork} />


          {addressRecord && <AccountCard addressRecord={addressRecord} setAddressRecord={setAddressRecord} />}

        </div>
      </div>
      <MainCard
        address={addressRecord?.address}
        network={network}
        totalBalance={totalBalance}

      />

      {/* 标签栏：简洁 */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setTab('assets')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'assets' ? 'bg-sky-600 text-white' : 'bg-white border border-sky-200 text-sky-700'}`}
        >
          <i className="fa-brands fa-bitcoin"></i>
          <span>资产</span>
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'activity' ? 'bg-sky-600 text-white' : 'bg-white border border-sky-200 text-sky-700'}`}
        >
          <i className="fa-solid fa-shuffle"></i>
          <span>交易</span>
        </button>
      </div>

      {/* 内容区*/}
      <div>
        {tab === 'assets' && (
          <TokenCard address={addressRecord?.address} network={network} setTotalBalance={setTotalBalance} />
        )}

        {tab === 'activity' && (
          <TransactionCard
            address={addressRecord?.address}
            network={network}
          />
        )}
      </div>

      <div className="mt-1 text-center text-xs text-gray-400 ">0907 WORLD · 赞助</div>


    </div>
  );
}
