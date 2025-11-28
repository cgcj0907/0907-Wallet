'use client';

import { Network, getAllNetworks } from '@/app/networkManage/lib/storage';
import { useEffect, useState } from 'react';
import { getBalance } from '@/app/chainInteract/lib/account';
import { getPrice } from '@/app/chainInteract/lib/network';

export default function TokenCard({ address }: { address: string }) {
  const [networks, setNetworks] = useState<Network[]>([]);

  const [balances, setBalances] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});

  // 加载网络和地址
  useEffect(() => {
    (async () => {
      setNetworks(await getAllNetworks());

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
     <div className="p-4 space-y-4">
      <h2 className="text-2xl font-semibold mb-2">Tokens</h2>

      <div className="space-y-3">
        {networks.map((t) => (
          <div
            key={t.name}
            className="flex items-center justify-between py-3 rounded-xl bg-sky-50/40 hover:bg-sky-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <img
                src={getLogoUrl(t.name)}
                className="w-7 h-7 rounded-full object-contain shadow-sm"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />

              <div className="leading-tight">
                <div className="text-sm font-semibold text-sky-900">
                  {t.symbol}
                </div>
                <div className="text-xs text-sky-500 mt-0.5">
                  {prices[t.name] ? `$${prices[t.name]}` : '加载中...'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-sky-900">
                {balances[t.name] ?? '读取中...'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => alert('导入代币（演示）')}
        className="w-full py-2.5 mt-5 rounded-xl border border-sky-200
                 text-sm text-sky-700 hover:bg-sky-50 transition-colors"
      >
        导入代币
      </button>
    </div>
  );

}
