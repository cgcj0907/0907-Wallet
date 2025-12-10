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
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);
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
    if (!network) {
      return;
    }
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
              const bal = await getBalance(network, address, t);
              if (!bal) {
                return;
              }
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

  const handleTokenClick = (token: string) => {
    setSelectedToken(token);
    setShowChart(true);
  };

  const closeChart = () => {
    setShowChart(false);
    // 延迟清除选中的token，以便动画完成
    setTimeout(() => setSelectedToken(null), 300);
  };

  const getKLineUrl = (token: string) => {
    const symbol = TOKEN_SYMBOL_MAP[token.toLowerCase()] || token.toUpperCase();
    return `https://s.tradingview.com/widgetembed/?symbol=${symbol}USD&interval=1&theme=dark&style=1&locale=en&timezone=Asia/Shanghai`;
  };

  // small badge for testnets
  const isTestnet = selectedNetwork === 'sepolia';

  // Render icon: prefer @web3icons/react component, then local public/tokens, then trustwallet fallback
  const renderIcon = (token: string) => {
    const symbol = TOKEN_SYMBOL_MAP[token];
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
    <>
      <div className="caret-transparent min-h-90 max-h-[40vh] overflow-y-auto">
        <div className="flex items-center justify-between">
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
                onClick={() => handleTokenClick(token)}
                className="group flex items-center p-3 justify-between rounded-xl bg-sky-50/40 transition-all duration-200 cursor-pointer 
                          hover:bg-white hover:shadow-md hover:scale-[1.01]
                          border border-transparent hover:border-sky-100 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  {/* icon with hover effect */}
                  <div className="w-7 h-7 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    {renderIcon(token)}
                  </div>

                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-sky-900 flex items-center gap-2 group-hover:text-sky-800 transition-colors">
                      <span className="text-xs px-1 py-0.5 group-hover:font-semibold">{symbol}</span>
                    </div>
                    <div className="text-xs text-sky-500 mt-0.5 group-hover:font-semibold group-hover:text-sky-600 transition-colors">
                      {typeof price === 'number' && !Number.isNaN(price) ? `$${price}` : '加载中...'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {/* Hover indicator */}
                  <div className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity py-0.5">
                    点击查看K线图
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-sky-900 group-hover:text-sky-800 group-hover:font-semibold transition-all">
                    {balance ?? (address ? '读取中...' : '未连接地址')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧滑入的K线图面板 */}
      {selectedToken && (
        <>
          {/* 半透明遮罩层 */}
          <div
            className={`fixed inset-0 bg-black transition-all duration-300 z-40 ${showChart ? 'opacity-70' : 'opacity-0 pointer-events-none'
              }`}
            onClick={closeChart}
          />

          {/* K线图面板 - 商务黑色主题 */}
          <div className={`fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-gray-900 shadow-2xl z-50 transition-transform duration-300 ease-out ${showChart ? 'translate-x-0' : 'translate-x-full'
            }`}>
            <div className="flex flex-col h-full">
              {/* 标题栏 - 商务黑色主题 */}
              <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-lg">
                    {renderIcon(selectedToken)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      {TOKEN_SYMBOL_MAP[selectedToken] ?? selectedToken}
                      <span className="ml-2 text-sm font-normal text-gray-400">
                        {selectedToken.toLowerCase().includes('usd') ? 'Stablecoin' : 'Token'}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-300">
                      {typeof prices[selectedToken] === 'number' && !Number.isNaN(prices[selectedToken])
                        ? <span className="text-green-400 font-semibold">${prices[selectedToken].toFixed(4)}</span>
                        : <span className="text-yellow-400">价格加载中...</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeChart}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200 group"
                  aria-label="关闭图表"
                >
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* K线图内容 - 与黑色主题契合 */}
              <div className="flex-1 p-4 overflow-hidden bg-gray-900">
                <div className="h-full rounded-lg overflow-hidden border border-gray-700">
                  <iframe
                    src={getKLineUrl(selectedToken)}
                    className="w-full h-full"
                    title={`${selectedToken} K线图`}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* 底部信息 - 商务黑色主题 */}
              <div className="p-5 border-t border-gray-700 bg-gray-800">
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300">当前持仓</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">
                        {balances[selectedToken] || '加载中...'}
                      </span>
                      <span className="text-gray-400">{TOKEN_SYMBOL_MAP[selectedToken] ?? selectedToken}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">当前估值</div>
                      <div className="text-white font-semibold">
                        {typeof prices[selectedToken] === 'number' &&
                          typeof parseTokenBalance(balances[selectedToken], selectedToken) === 'number'
                          ? `$${(prices[selectedToken] * parseTokenBalance(balances[selectedToken], selectedToken)).toFixed(2)}`
                          : '--'}
                      </div>
                    </div>

                    <div className="bg-gray-700/50 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">持仓占比</div>
                      <div className="text-white font-semibold">
                        {typeof prices[selectedToken] === 'number' &&
                          typeof parseTokenBalance(balances[selectedToken], selectedToken) === 'number'
                          ? `${((prices[selectedToken] * parseTokenBalance(balances[selectedToken], selectedToken)) /
                            tokens.reduce((total, t) => {
                              const price = prices[t];
                              const bal = parseTokenBalance(balances[t], t);
                              return total + (Number.isFinite(price) && Number.isFinite(bal) ? price * bal : 0);
                            }, 0) * 100).toFixed(1)}%`
                          : '--'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    数据来源: TradingView • 实时更新
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}