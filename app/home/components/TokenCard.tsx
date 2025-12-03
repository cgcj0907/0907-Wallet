'use client';

import React, { useEffect, useState } from 'react';
import * as Web3Icons from '@web3icons/react';
import { getBalance } from '@/app/chainInteraction/lib/account';
import { getPrice } from '@/app/chainInteraction/lib/priceFeed';

type Props = { address?: string; network: string | null };

const TOKEN_LIST: Record<string, string[]> = {
  ethereum: ['Ethereum', 'USDT', 'USDC', 'DAI', 'UNI', 'AAVE'],
  sepolia: ['Sepolia'],
  zksync: ['ZkSync'],
};

/**
 * 本地图标映射：
 * 把你自己的图标文件放到 public/tokens/ 下，并在这里写上对应文件名（建议全部小写）。
 * 例如：public/tokens/usdc.png, public/tokens/usdt.png, public/tokens/eth.png
 */
const TOKEN_ICON_MAP: Record<string, string> = {
  Ethereum: 'eth.png',
  USDT: 'usdt.svg',
  USDC: 'usdc.svg',
  DAI: 'dai.svg',
  UNI: 'uni.svg',
  AAVE: 'aave.svg',
  Sepolia: 'eth.png',
  ZkSync: 'zk.png',
};

/**
 * 展示用简称（symbol）
 */
const TOKEN_SYMBOL_MAP: Record<string, string> = {
  Ethereum: 'ETH',
  USDT: 'USDT',
  USDC: 'USDC',
  DAI: 'DAI',
  UNI: 'UNI',
  AAVE: 'AAVE',
  Sepolia: 'SepoliaETH',
  ZkSync: 'ZK',
};

const getLocalLogoUrl = (token: string) => {
  const iconFile = TOKEN_ICON_MAP[token];
  if (iconFile) return `/tokens/${iconFile}`;
  return null;
};



export default function TokenCard({ address, network }: Props) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [balances, setBalances] = useState<Record<string, string>>({});
  const selectedNetwork = (network || 'ethereum').toLowerCase();

  // determine which tokens to show based on parent-provided network
  const tokens = TOKEN_LIST[selectedNetwork] ?? TOKEN_LIST['ethereum'];

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!selectedNetwork) return;

      const newPrices: Record<string, number> = {};
      const newBalances: Record<string, string> = {};

      await Promise.all(
        tokens.map(async (t) => {
          // 直接把显示名 t 传到 getPrice/getBalance，库内部会做小写处理
          try {
            const p = await getPrice(selectedNetwork, t);
            if (!cancelled) newPrices[t] = Number(p ?? 0);
          } catch (e) {
            console.error('getPrice error', selectedNetwork, t, e);
            if (!cancelled) newPrices[t] = NaN;
          }

          // fetch balance using your provided getBalance wrapper
          if (address) {
            try {
              const bal = await getBalance(address, t);
              if (!cancelled) newBalances[t] = bal;
            } catch (e) {
              console.error('getBalance error', t, e);
              if (!cancelled) newBalances[t] = '读取失败';
            }
          } else {
            if (!cancelled) newBalances[t] = '未连接地址';
          }
        })
      );

      if (!cancelled) setPrices(newPrices);
      if (!cancelled) setBalances(newBalances);
    })();

    return () => {
      cancelled = true;
    };
  }, [address, selectedNetwork]);

  // small badge for testnets
  const isTestnet = selectedNetwork === 'sepolia';

  // Render icon: prefer @web3icons/react component, then local public/tokens, then trustwallet fallback
  const renderIcon = (token: string) => {
    const symbol = TOKEN_SYMBOL_MAP[token] ?? token;
    // construct component name like TokenETH, TokenUSDC...
    const compName = `Token${String(symbol).replace(/[^A-Za-z0-9]/g, '')}`;
    const IconComp = (Web3Icons as any)[compName];
    if (IconComp) {
      try {
        return <IconComp variant="branded" size={28} />;
      } catch (e) {
       
      }
    }

    const local = getLocalLogoUrl(token);
    if (local) {
      return (
        <img
          src={local}
          alt={`${token} logo`}
          className="w-7 h-7 rounded-full object-contain shadow-sm"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            
          }}
        />
      );
    }

  };

  return (
    <div className="p-4 space-y-4 min-h-80">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold mb-2">Tokens</h2>
        {isTestnet && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">测试网</span>
        )}
      </div>

      <div className="space-y-3">
        {tokens.map((token) => {
          const price = prices[token];
          const balance = balances[token];
          const symbol = TOKEN_SYMBOL_MAP[token] ?? token;

          return (
            <div
              key={token}
              className="flex items-center p-3 justify-between rounded-xl bg-sky-50/40 hover:bg-sky-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* icon */}
                <div className="w-7 h-7 flex items-center justify-center">
                  {renderIcon(token)}
                </div>

                <div className="leading-tight">
                  <div className="text-sm font-semibold text-sky-900 flex items-center gap-2">
                    <span className="text-xs text-sky-500 px-1 py-0.5 bg-white/30 rounded">{symbol}</span>
                  </div>
                  <div className="text-xs text-sky-500 mt-0.5">
                    {typeof price === 'number' && !Number.isNaN(price) ? `$${price}` : '加载中...'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-sky-900">{balance ?? (address ? '读取中...' : '未连接地址')}</div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
