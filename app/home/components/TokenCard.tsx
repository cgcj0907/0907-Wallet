'use client';

import { Network, getAllNetworks } from '@/app/networkManage/lib/storage';
import { useEffect, useState } from 'react';
import { getBalance } from '@/app/chainInteract/lib/account';
import { getPrice } from '@/app/chainInteract/lib/network';

export default function TokenCard() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [address, setAddress] = useState('');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});

  // 加载网络和地址
  useEffect(() => {
    (async () => {
      setNetworks(await getAllNetworks());
      setAddress(localStorage.getItem('currentAddress') || '');
    })();
  }, []);

  // 加载价格 & 余额
  useEffect(() => {
    if (!address || networks.length === 0) return;

    (async () => {
      const newBalances: Record<string, string> = {};
      const newPrices: Record<string, number> = {};

      for (const net of networks) {
        newBalances[net.name] = await getBalance(address, net.name);
        newPrices[net.name] = await getPrice(net.name);
      }

      setBalances(newBalances);
      setPrices(newPrices);
    })();
  }, [address, networks]);

  const getLogoUrl = (network: string) =>
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${network}/info/logo.png`;

  return (
    <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-sm">
      <div className="text-sm text-sky-700 font-medium mb-3">代币（常用）</div>

      <div className="space-y-3">
        {networks.map((t) => (
          <div
            key={t.name}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-sky-50"
          >
            <div className="flex items-center gap-3">
              <img
                src={getLogoUrl(t.name)}
                className="w-6 h-6 object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />

              <div>
                <div className="text-sm font-medium text-sky-800">{t.name}</div>
                <div className="text-xs text-sky-500">
                  {prices[t.name] ? `$${prices[t.name]}` : '加载中...'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-sky-800">
                {balances[t.name] ?? '读取中...'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={() => alert('导入代币（演示）')}
          className="w-full py-2 rounded-lg border border-sky-200 text-sm"
        >
          导入代币
        </button>
      </div>
    </div>
  );
}
