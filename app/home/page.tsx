'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AddressRecord, getAddress } from '@/app/generateWallet/lib/saveAddress';

/**
 * 优化版：仿 MetaMask 风格，但去掉地址冗余、增加留白与可读性
 * - 顶部显示短地址（便于看），完整地址放到 "账户详情" 弹窗中（需要时查看/复制）
 * - 更大的按钮、更明显的间距（适合长者操作）
 */

export default function WalletHome() {
  const [selectedAddress, setSelectedAddress] = useState<AddressRecord | null>(null);
  const [balance, setBalance] = useState('0.0000');
  const [fiat, setFiat] = useState('$0.00');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'assets' | 'activity'>('assets');
  const [network, setNetwork] = useState<'Ethereum' | 'Goerli' | 'Local'>('Ethereum');
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const record = await getAddress(0);
        const DEFAULT_ADDRESS_RECORD: AddressRecord =
          record ?? { wallet: { type: 'HDNodeWallet', KeyPath: '0' }, address: '0x0000000000000000000000000000000000000000' };
        setSelectedAddress(DEFAULT_ADDRESS_RECORD);

        // 占位：用真实 provider 替换
        fetchBalance(DEFAULT_ADDRESS_RECORD.address);
        fetchPrice();
      } catch (err) {
        console.error('获取地址失败', err);
      }
    })();

    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  // ---- 占位函数：请用 ethers 等替换为真实实现 ----
  async function fetchBalance(addr?: string) {
    if (!addr) return;
    // TODO: 使用 ethers.provider.getBalance(addr) -> formatEther
    setBalance('1.2345');
  }
  async function fetchPrice() {
    // TODO: 用 coingecko 或其它行情接口
    setFiat('$2,345.67');
  }
  // ---------------------------------------------------

  const short = (addr?: string) => {
    if (!addr) return '';
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      // @ts-ignore
      copyTimer.current = window.setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      console.error('复制失败', e);
    }
  };

 const Identicon = ({ addr, size = 44 }: { addr?: string; size?: number }) => {
  const hash = (addr || '')
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(hsl(${hue} 70% 60%), hsl(${(hue + 60) % 360} 70% 60%))`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    />
  );
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
          <div className="text-xs text-sky-500 mt-1">仿 MetaMask · 简洁版</div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-sky-500 px-3 py-1 rounded-full bg-white border border-sky-100">{network}</span>

          <button
            onClick={() => setAccountPanelOpen(true)}
            className="flex items-center gap-3 bg-white px-3 py-1 rounded-lg border border-sky-200 shadow-sm hover:shadow-md"
            aria-label="账户"
          >
            <Identicon addr={selectedAddress?.address} size={36} />
            <div className="text-right">
              <div className="text-sm font-medium text-sky-800">{short(selectedAddress?.address)}</div>
              <div className="text-xs text-sky-500">账户</div>
            </div>
          </button>
        </div>
      </div>

      {/* 主卡片：余额优先、按钮更大 */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-sky-500">总余额</div>
            <div className="text-2xl font-semibold text-sky-800 mt-1">{balance} ETH</div>
            <div className="text-sm text-sky-500 mt-1">{fiat}</div>
          </div>

          <div className="text-right">
            <div className="text-xs text-sky-500">网络</div>
            <div className="text-sm font-medium text-sky-800 mt-1">{network}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <button
            onClick={() => alert('发送（演示）')}
            className="w-full rounded-xl py-3 bg-sky-600 text-white font-medium hover:bg-sky-700 transition"
          >
            发送
          </button>
          <button
            onClick={() => alert('接收（演示）')}
            className="w-full rounded-xl py-3 bg-white border border-sky-200 text-sky-700 font-medium hover:bg-sky-50 transition"
          >
            接收
          </button>
        </div>
      </div>

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
          <div>
            <div className="text-sm text-sky-700 font-medium mb-3">代币（常用）</div>
            <div className="space-y-3">
              {sampleTokens.map((t) => (
                <div key={t.symbol} className="flex items-center justify-between p-3 rounded-lg hover:bg-sky-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center font-semibold">{t.symbol[0]}</div>
                    <div>
                      <div className="text-sm font-medium text-sky-800">{t.symbol}</div>
                      <div className="text-xs text-sky-500">{t.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-sky-800">{t.balance}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={() => alert('导入代币（演示）')} className="w-full py-2 rounded-lg border border-sky-200 text-sm">
                导入代币
              </button>
            </div>
          </div>
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

      {/* 账户详情弹窗：完整地址 + 复制 + 导出等操作（主界面不再重复地址） */}
      {accountPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-sky-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Identicon addr={selectedAddress?.address} size={48} />
                <div>
                  <div className="text-lg font-semibold text-sky-800">账户详情</div>
                  <div className="text-xs text-sky-500">长按复制或点击复制按钮</div>
                </div>
              </div>
              <button onClick={() => setAccountPanelOpen(false)} className="text-sky-600 text-sm">
                关闭
              </button>
            </div>

            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 mb-4">
              <div className="text-xs text-sky-500">完整地址</div>
              <div className="text-sm font-mono text-sky-800 mt-2">{selectedAddress?.address}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => copyToClipboard(selectedAddress?.address)}
                className="py-3 rounded-lg bg-white border border-sky-200 text-sky-700"
              >
                复制地址
              </button>
              <button
                onClick={() => alert('在区块浏览器打开（演示）')}
                className="py-3 rounded-lg bg-white border border-sky-200 text-sky-700"
              >
                在浏览器查看
              </button>
            </div>

            <div className="mt-3">
              <button
                onClick={() => alert('导出私钥（演示）')}
                className="w-full py-3 rounded-lg border border-red-200 text-red-600"
              >
                导出私钥
              </button>
            </div>

            {copied && <div className="mt-3 text-sm text-sky-600">已复制到剪贴板</div>}
          </div>
        </div>
      )}
    </div>
  );
}
