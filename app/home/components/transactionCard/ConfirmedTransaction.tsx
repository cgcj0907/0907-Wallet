'use client';

import { useEffect, useState } from 'react';
import { getTransactions } from '@/app/chainInteraction/lib/transaction';
import Avatar from 'boring-avatars';
import { EXPLORER_MAP } from '@/app/networkManagement/lib/details';

/** ---------- 大数格式化工具 ---------- */
function formatUnit(valueWei: bigint, unitDecimals = 18, precision = 6): string {
    const TEN = BigInt(10);
    const unitBase = TEN ** BigInt(unitDecimals);
    const integer = valueWei / unitBase;
    const remainder = valueWei % unitBase;

    if (precision <= 0) return integer.toString();

    const remStr = remainder.toString().padStart(unitDecimals, '0').slice(0, precision);
    const trimmed = remStr.replace(/0+$/, '');
    if (trimmed === '') return integer.toString();
    return `${integer.toString()}.${trimmed}`;
}

function toBigIntSafe(v?: string | number): bigint {
    if (v === undefined || v === null || v === '') return BigInt(0);
    if (typeof v === 'number') return BigInt(Math.floor(v));
    if (typeof v === 'string' && v.includes('.')) {
        v = v.split('.')[0];
    }
    try {
        return BigInt(v as string);
    } catch {
        return BigInt(0);
    }
}

interface TransactionRaw {
    hash: string;
    from: string;
    to: string;
    value: string;
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
}

type props = {
    address: string | undefined,
    network: string | null,
    token: string | null
}

export default function ConfirmedTransaction({ address, network, token }: props) {
    const [transactions, setTransactions] = useState<TransactionRaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedHash, setExpandedHash] = useState<string | null>(null);

    const [showAll, setShowAll] = useState(false);


    useEffect(() => {
        async function fetchTransactions() {
            setLoading(true);
            try {
                if (address) {
                    if ( ! token ) {
                        return;
                    }
                    console.log("useEffect")
                    const txs = await getTransactions(address, token.toLowerCase());
                    setTransactions(txs || []);
                } else {
                    setTransactions([]);
                }
            } catch (err: any) {
                console.error(err);
                setError(err?.message || 'Failed to fetch transactions');
            } finally {
                setLoading(false);
            }
        }
        fetchTransactions();
    }, [address, network, token]);


    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-600">Error: {error}</div>;


    if (!transactions) {
        return;
    }
    // 先排序，再决定显示多少条（默认显示 3 条）
    const sortedTxs = transactions
        .slice()
        .sort((a, b) => {
            const timeA = Number(a.timeStamp) || 0;
            const timeB = Number(b.timeStamp) || 0;
            return timeB - timeA;
        });

    const VISIBLE_COUNT = 3;
    const displayedTxs = sortedTxs.slice(0, showAll ? sortedTxs.length : VISIBLE_COUNT);

    const makeExpandedKey = (tx: TransactionRaw, isPending: boolean, index?: number) =>
        isPending ? `pending-${tx.hash}` : `tx-${tx.hash}-${index ?? 0}`;

    const renderTransaction = (tx: TransactionRaw, index: number, isPending: boolean) => {
        const tokenDecimals = Number(tx.tokenDecimal ?? '18');
        const tokenSymbol = tx.tokenSymbol ?? (tx.contractAddress ? 'TOKEN' : 'ETH');

        const valueWei = toBigIntSafe(tx.value);
        const valueStr = formatUnit(valueWei, tokenDecimals, 6);

        const gas = toBigIntSafe(tx.gas);
        const gasPrice = toBigIntSafe(tx.gasPrice);
        const gasUsed = toBigIntSafe(tx.gasUsed);

        const gasPriceGwei = formatUnit(gasPrice, 9, 3);
        const feeWei = gasUsed * gasPrice;
        const feeEth = formatUnit(feeWei, 18, 9);

        let timeLabel = '';
        if (isPending) {
            timeLabel = 'Pending';
        } else {
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
        }

        const isTokenTransfer = Boolean(tx.contractAddress && tx.contractAddress !== '' && tx.methodId);
        const normalizedAddr = (address || '').toLowerCase();
        const fromAddr = (tx.from || '').toLowerCase();
        const toAddr = (tx.to || '').toLowerCase();
        const isIncoming = toAddr === normalizedAddr && fromAddr !== normalizedAddr;
        const isOutgoing = fromAddr === normalizedAddr && toAddr !== normalizedAddr;
        const statusSuccess = tx.txreceipt_status === '1' || tx.isError === '0' || tx.isError === undefined;

        const explorerBase = EXPLORER_MAP[network ? network : 'ethereum'];

        const key = makeExpandedKey(tx, isPending, index);

        return (
            <div
                key={key}
                className="bg-linear-to-br from-sky-50 to-white border border-sky-100 rounded-lg p-4 shadow-sm cursor-pointer transition-transform hover:scale-[1.001]"
                onClick={() => setExpandedHash(expandedHash === key ? null : key)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar
                            name={address}
                            size={48}
                            variant="beam"
                            colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]} />
                        <div>
                            <div className="font-medium text-sky-800 flex items-center gap-2">
                                <div className={`px-2 py-0.5 rounded text-xs font-semibold ${isIncoming ? 'text-green-800 bg-green-100' : isOutgoing ? 'text-red-800 bg-red-100' : 'text-sky-800 bg-sky-100'}`}>
                                    {isTokenTransfer ? (tx.tokenSymbol ?? 'TOKEN') : 'ETH'}
                                </div>
                                <div className={`${isIncoming ? 'text-green-700' : isOutgoing ? 'text-red-700' : 'text-sky-800'}`}>
                                    {isIncoming ? '+' : isOutgoing ? '-' : ''} {Number(valueStr) >= 1 ? `${Number(valueStr).toLocaleString()}` : `${valueStr}`}
                                </div>
                            </div>
                            <div className="text-xs text-sky-600">{timeLabel}</div>
                        </div>
                    </div>

                    <div className="text-sky-500 text-sm font-medium">
                        {expandedHash === key ? <i className="fa-solid fa-caret-up"></i> : <i className="fa-solid fa-caret-down"></i>}
                    </div>
                </div>

                {expandedHash === key && (
                    <div className="mt-3 border-t border-sky-100 pt-3 text-sky-800">
                        <div className="flex flex-col items-start gap-3 mb-2">
                            <div className="flex items-start gap-3 w-full">
                                <div className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-sky-600">From</div>
                                        <Avatar name={tx.from} size={30} variant="beam" colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]} />
                                    </div>
                                    <div className="text-sm font-medium">{tx.from}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 w-full">
                                <div className="text-sm">
                                    <div className="flex items-center gap-6">
                                        <div className="text-xs text-sky-600">To</div>
                                        <Avatar name={tx.to} size={30} variant="beam" colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]} />
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
                                <span className="font-medium">{isPending ? '—' : gasUsed.toString()}</span>
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
                                <span className="font-medium">{isPending ? '—' : feeEth} <i className="fa-brands fa-ethereum"></i></span>
                            </div>

                            <div>
                                <span className="text-xs text-sky-600">Block / Nonce: </span>
                                <span className="font-medium">{tx.blockNumber || '—'} / {tx.nonce || '—'}</span>
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
                                {isPending ? (
                                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>
                                ) : (
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${statusSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{statusSuccess ? 'Success' : 'Fail'}</span>
                                )}
                                {tx.confirmations && !isPending && <span className="ml-2 text-xs text-sky-600">· {tx.confirmations} 确认数</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {displayedTxs.map((tx, index) => renderTransaction(tx, index, false))}

            {/* 超过 VISIBLE_COUNT 条时显示展开/收起 按钮 */}
            {sortedTxs.length > VISIBLE_COUNT && (
                <div className="flex justify-center">
                    <button
                        className=" px-4  rounded-md border border-sky-200 text-sm bg-white hover:bg-sky-50"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? <i className="fa-solid fa-caret-up"></i> : <i className="fa-solid fa-caret-down"></i>}
                    </button>
                </div>
            )}
        </>
    );
}
