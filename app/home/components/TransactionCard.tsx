'use client';

import { useEffect, useState } from 'react';
import { getTransactions } from '@/app/chainInteraction/lib/transaction';
import Avatar from 'boring-avatars';

const explorerMap: Record<string, string> = {
  ethereum: 'https://etherscan.io/tx/',
  sepolia: 'https://sepolia.etherscan.io/tx/',
  zksync: 'https://explorer.zksync.io/tx/',
};


/** ---------- 大数格式化工具 ---------- */
/** 将 bigint（以 wei 为单位）格式化到指定单位的小数字符串
 *  unitDecimals: 例如 ETH/wei -> 18, gwei -> 9, token decimals -> 18 等
 *  precision: 小数位数（可调整）
 */
function formatUnit(valueWei: bigint, unitDecimals = 18, precision = 6): string {
  const TEN = BigInt(10);
  const unitBase = TEN ** BigInt(unitDecimals);
  const integer = valueWei / unitBase;
  const remainder = valueWei % unitBase;

  if (precision <= 0) return integer.toString();

  // 获取小数部分字符串
  const remStr = remainder.toString().padStart(unitDecimals, '0').slice(0, precision);
  // 去掉末尾多余的 0
  const trimmed = remStr.replace(/0+$/, '');
  if (trimmed === '') return integer.toString();
  return `${integer.toString()}.${trimmed}`;
}

/** 把可能的字符串数（"123"）或数字转换为 bigint（安全） */
function toBigIntSafe(v?: string | number): bigint {
  if (v === undefined || v === null || v === '') return BigInt(0);
  // 如果已经是数字类型，不要用 Number -> 可能丢精度，但 gas/gasPrice 都在安全范围
  if (typeof v === 'number') return BigInt(Math.floor(v));
  // 字符串形式
  // 去除小数点（理论上这些字段都是整数字符串）
  if (v.includes('.')) {
    // 不应该出现小数，但以防万一，截取小数点前部分
    v = v.split('.')[0];
  }
  try {
    return BigInt(v);
  } catch {
    return BigInt(0);
  }
}

/** ---------- 组件 ---------- */
interface TransactionRaw {
  hash: string;
  from: string;
  to: string;
  value: string; // wei or token raw
  timeStamp: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  contractAddress?: string;
  functionName?: string;
  methodId?: string;
  gas?: string;
  gasPrice?: string;
  gasUsed?: string;
  blockNumber?: string;
  nonce?: string;
  confirmations?: string;
  txreceipt_status?: string;
  isError?: string;
  // 其它字段...
}

export default function TransactionCard({
  address, network
}: {
  address: string | undefined, network: string | null
}) {
  const [transactions, setTransactions] = useState<TransactionRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        if (address) {
          const txs = await getTransactions(address, network ? network : "ethereum"); // 我们约定 getTransactions 返回解析后的数组 
          setTransactions(txs || []);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, [address, network]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-semibold mb-2">Transactions</h2>

      {transactions
        .slice()
        .sort((a, b) => {
          const timeA = Number(a.timeStamp) || 0;
          const timeB = Number(b.timeStamp) || 0;
          return timeB - timeA;
        })
        .map((tx, index) => {
          const tokenDecimals = Number(tx.tokenDecimal ?? '18');
          const tokenSymbol = tx.tokenSymbol ?? (tx.contractAddress ? 'TOKEN' : 'ETH');

          // value in wei (or token base unit)
          const valueWei = toBigIntSafe(tx.value);
          const valueStr = formatUnit(valueWei, tokenDecimals, 6);

          // gas, gasPrice, gasUsed
          const gas = toBigIntSafe(tx.gas);
          const gasPrice = toBigIntSafe(tx.gasPrice);
          const gasUsed = toBigIntSafe(tx.gasUsed);

          // gas price in Gwei (unitDecimals = 9)
          const gasPriceGwei = formatUnit(gasPrice, 9, 3);
          // fee in wei = gasUsed * gasPrice
          const feeWei = gasUsed * gasPrice;
          const feeEth = formatUnit(feeWei, 18, 9);

          // 时间 -> 相对时间 + 本地时间 (Asia/Shanghai)
          let timeLabel = '';
          try {
            const ts = Number(tx.timeStamp) * 1000;
            const now = Date.now();
            const diffSec = Math.floor((now - ts) / 1000);
            const minutes = Math.floor(diffSec / 60);
            const hours = Math.floor(diffSec / 3600);
            const days = Math.floor(diffSec / 86400);
            if (days >= 1) timeLabel = `${days} 天前`;
            else if (hours >= 1) timeLabel = `${hours} 小时前`;
            else if (minutes >= 1) timeLabel = `${minutes} 分钟前`;
            else timeLabel = '刚刚';
            const fullTime = new Date(ts).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
            timeLabel = `${timeLabel} · ${fullTime}`;
          } catch {
            timeLabel = tx.timeStamp || '';
          }

          // 是否为 token 转账（例如 ERC20 转账会有 contractAddress、methodId）
          const isTokenTransfer = Boolean(tx.contractAddress && tx.contractAddress !== '' && tx.methodId);

          // 判断方向：基于当前 address prop
          const normalizedAddr = (address || '').toLowerCase();
          const fromAddr = (tx.from || '').toLowerCase();
          const toAddr = (tx.to || '').toLowerCase();
          const isIncoming = toAddr === normalizedAddr && fromAddr !== normalizedAddr;
          const isOutgoing = fromAddr === normalizedAddr && toAddr !== normalizedAddr;

          // status
          const statusSuccess = tx.txreceipt_status === '1' || tx.isError === '0' || tx.isError === undefined;



          const explorerBase = explorerMap[network ? network : "ethereum"];

          return (
            <div
              key={`${tx.hash}-${index}`}
              className="bg-linear-to-br from-sky-50 to-white border border-sky-100 rounded-lg p-4 shadow-sm cursor-pointer transition-transform hover:scale-[1.001]"
              onClick={() => setExpandedHash(expandedHash === tx.hash ? null : tx.hash)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={tx.to}
                    size={48}
                    variant="beam"
                    colors={[
                      "#FFFFFF", // white
                      "#E3F2FD", // very light blue
                      "#90CAF9", // soft blue
                      "#42A5F5", // main bright blue
                      "#1E88E5"  // deep blue
                    ]} />
                  <div>
                    <div className="font-medium text-sky-800 flex items-center gap-2">
                      <div className={`px-2 py-0.5 rounded text-xs font-semibold ${isIncoming ? 'text-green-800 bg-green-100' : isOutgoing ? 'text-red-800 bg-red-100' : 'text-sky-800 bg-sky-100'}`}>
                        {isTokenTransfer ? (tx.tokenSymbol ?? 'TOKEN') : 'ETH'}
                      </div>
                      <div className={`${isIncoming ? 'text-green-700' : isOutgoing ? 'text-red-700' : 'text-sky-800'}`}>
                        {isIncoming ? '+' : isOutgoing ? '-' : ''} {Number(valueStr) >= 1 ? `${Number(valueStr).toLocaleString()} ${tokenSymbol}` : `${valueStr} ${tokenSymbol}`}
                      </div>
                    </div>
                    <div className="text-xs text-sky-600">{timeLabel}</div>
                  </div>
                </div>

                <div className="text-sky-500 text-sm font-medium">
                  {expandedHash === tx.hash ? '▲' : '▼'}
                </div>
              </div>

              {expandedHash === tx.hash && (
                <div className="mt-3 border-t border-sky-100 pt-3 text-sky-800">
                  <div className="flex flex-col items-start gap-3 mb-2">
                    <div className="flex items-start gap-3 w-full">

                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-sky-600">From</div>
                          <Avatar
                            name={tx.from}
                            size={30}
                            variant="beam"
                            colors={[
                              "#FFFFFF", // white
                              "#E3F2FD", // very light blue
                              "#90CAF9", // soft blue
                              "#42A5F5", // main bright blue
                              "#1E88E5"  // deep blue
                            ]} />
                        </div>
                        <div className="text-sm font-medium">{tx.from}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 w-full">

                      <div className="text-sm">
                        <div className="flex items-center gap-6">
                          <div className="text-xs text-sky-600">To</div>
                          <Avatar
                            name={tx.to}
                            size={30}
                            variant="beam"
                            colors={[
                              "#FFFFFF", // white
                              "#E3F2FD", // very light blue
                              "#90CAF9", // soft blue
                              "#42A5F5", // main bright blue
                              "#1E88E5"  // deep blue
                            ]} />
                        </div>
                        <div className="text-sm font-medium">{tx.to}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-sky-600">Amount: </span>
                      <span className="font-medium">{valueStr} {tokenSymbol}</span>
                    </div>

                    <div>
                      <i className="fa-solid fa-gas-pump"></i>
                      <span className="text-xs text-sky-600">Gas Used: </span>
                      <span className="font-medium">{gasUsed.toString()}</span>

                    </div>

                    <div>
                      <span className="text-xs text-sky-500">Gas Limit: {gas.toString()}</span>

                    </div>

                    <div>
                      <span className="text-xs text-sky-600">Gas Price: </span>
                      <span className="font-medium">{gasPriceGwei} Gwei</span>
                    </div>

                    <div>
                      <span className="text-xs text-sky-600">Fee: </span>
                      <span className="font-medium">{feeEth} <i className="fa-brands fa-ethereum"></i></span>
                    </div>

                    <div>
                      <span className="text-xs text-sky-600">Block / Nonce: </span>
                      <span className="font-medium">
                        {tx.blockNumber || '—'} / {tx.nonce || '—'}
                      </span>
                    </div>

                    {isTokenTransfer && tx.contractAddress && (
                      <div>
                        <i className="fa-solid fa-file-contract"></i>
                        <span className="text-xs text-sky-600">Token Contract: </span>
                        <a className="text-xs text-primary underline" href={`${explorerBase.replace('/tx/', '/address/')}${tx.contractAddress}`} target="_blank" rel="noreferrer">{tx.contractAddress}</a>
                      </div>
                    )}

                    <div className="break-all">
                      <span className="text-xs text-sky-600">Tx Hash: </span>
                      <a className="font-mono text-xs underline text-primary" href={`${explorerBase}${tx.hash}`} target="_blank" rel="noreferrer">{tx.hash}</a>
                    </div>

                    {tx.functionName && (
                      <div>
                        <span className="text-xs text-sky-600">Function: </span>
                        <span className="font-medium">{tx.functionName}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-sky-600">Status: </span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${statusSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{statusSuccess ? 'Success' : 'Fail'}</span>
                      {tx.confirmations && <span className="ml-2 text-xs text-sky-600">· {tx.confirmations} 确认数</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
