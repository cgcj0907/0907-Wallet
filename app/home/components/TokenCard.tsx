'use client';

import { useEffect, useState } from 'react';
import * as Web3Icons from '@web3icons/react';
import { getBalance } from '@/app/chainInteraction/lib/account';
import { getPrice } from '@/app/chainInteraction/lib/priceFeed';
import {
  TOKEN_LIST,
  TOKEN_ICON_MAP,
  DECIMALS,
  TOKEN_SYMBOL_MAP
} from '@/app/networkManagement/lib/details'

type Props = {
  address?: string;
  network: string | null;
  setTotalBalance: (value: number) => void;
};


const getLocalLogoUrl = (token: string) => {
  const iconFile = TOKEN_ICON_MAP[token];
  if (iconFile) return `/tokens/${iconFile}`;
  return null;
};

export default function TokenCard({ address, network, setTotalBalance }: Props) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [balances, setBalances] = useState<Record<string, string>>({});
  const selectedNetwork = (network || 'ethereum').toLowerCase();

  // determine which tokens to show based on parent-provided network
  const tokens = TOKEN_LIST[selectedNetwork] ?? TOKEN_LIST['ethereum'];

  // helper: parse different balance string formats into a number of token units
  const parseTokenBalance = (balStr: string | undefined, token: string): number => {
    if (!balStr) return NaN;
    const trimmed = String(balStr).replace(/,/g, '').trim();

    if (trimmed === '读取失败' || trimmed === '未连接地址') return NaN;

    // numeric with dot -> already human-readable token amount
    if (/^[0-9]+(\.[0-9]+)?$/.test(trimmed)) {
      return Number(trimmed);
    }

    // pure integer string (可能是最小单位，例如 wei / 6-decimals)
    if (/^[0-9]+$/.test(trimmed)) {
      const decimals = DECIMALS[token] ?? 18;
      // 如果整数长度大于 decimals，通常表示这是最小单位整数，需要除以 10**decimals
      if (trimmed.length > decimals) {
        const intPart = trimmed.slice(0, trimmed.length - decimals) || '0';
        let fracPart = trimmed.slice(trimmed.length - decimals).padStart(decimals, '0');
        // 合成小数字符串（避免使用 BigInt -> Number 精度问题的极端情况，适合一般钱包余额）
        // 去掉尾随零便于 Number 转换（但保留至少一位）
        fracPart = fracPart.replace(/0+$/, '');
        const asStr = fracPart ? `${intPart}.${fracPart}` : `${intPart}`;
        const n = Number(asStr);
        return Number.isFinite(n) ? n : NaN;
      } else {
        // 整数且长度不大：很可能就是人类可读数量（例如 "1"、"12"）
        return Number(trimmed);
      }
    }

    // fallback: try Number conversion
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : NaN;
  };

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

      if (!cancelled) {
        setPrices(newPrices);
        setBalances(newBalances);

        // 计算 total balance（法币美元）
        let total = 0;
        tokens.forEach((t) => {
          const price = newPrices[t];
          const balStr = newBalances[t];
          const numericBal = parseTokenBalance(balStr, t);

          if (!Number.isFinite(price) || Number.isNaN(price)) return;
          if (!Number.isFinite(numericBal) || Number.isNaN(numericBal)) return;

          total += numericBal * price;
        });

        // 保留两位小数（可根据需要调整）
        const roundedTotal = Math.round((total + Number.EPSILON) * 100) / 100;
        setTotalBalance(roundedTotal);
      }
    })();

    return () => {
      cancelled = true;
    };
    // 加上 setTotalBalance（来自 props）以避免 lint 警告
  }, [address, selectedNetwork, setTotalBalance, /* tokens derived from selectedNetwork */]);

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
                    <span className="text-xs px-1 py-0.5 rounded">{symbol}</span>
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
