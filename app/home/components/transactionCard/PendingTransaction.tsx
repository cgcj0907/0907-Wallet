'use client';

import { useEffect, useState } from 'react';
import Avatar from 'boring-avatars';
import { CHAIN_ID, EXPLORER_MAP } from '@/app/networkManagement/lib/details';

const ETHERSPOT_API_KEY = process.env.NEXT_PUBLIC_ETHERSPOT_API_KEY;
const CHECK_TX_STATUS_URL =
    `https://rpc.etherspot.io/v3/1?api-key=${ETHERSPOT_API_KEY}`;

type Props = {
    address: string | undefined;
    network: string | null;
};

export default function PendingTransaction({ address, network }: Props) {
    const [pendingTransactions, setPendingTransactions] = useState<string[]>([]);

    useEffect(() => {
        if (!network || !address) {
            return;
        }
        let mounted = true;
        const storageKey = `pending_hashes_${network}_${address}`;

        const checkPendingHashes = async () => {
            if (!mounted) return;

            let hashes: string[] = [];
            try {
                const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
                hashes = saved ? JSON.parse(saved) : [];
                if (!Array.isArray(hashes)) hashes = [];
            } catch (err) {
                console.error('parse pending hashes failed', err);
                hashes = [];
            }

            // 先立刻显示本地保存的 pending 列表
            if (mounted) setPendingTransactions(hashes.slice());

            const remaining: string[] = [];

            for (const hash of hashes) {
                try {
                    const res = await fetch(CHECK_TX_STATUS_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            id: CHAIN_ID[network],
                            method: "eth_getUserOperationByHash",
                            params: [hash],
                        }),
                    });

                    if (!res.ok) {
                        // 请求失败则视为未确认，保留
                        remaining.push(hash);
                        continue;
                    }

                    let json: any = null;
                    try {
                        json = await res.json();
                
                    } catch (e) {
                        console.warn('failed parse etherscan response for', hash, e);
                        // 无法解析则保留
                        remaining.push(hash);
                        continue;
                    }

                    // 判定是否已确认：优先检查 json.result.status（gettxreceiptstatus 的常见返回）
                    // 同时兼容部分情况把 status 放在顶层的格式
                    let isConfirmed = false;
                    if (json) {
                        if (json.result) {
                            isConfirmed = true;
                        } else if (json.status === '1' || json.status === 1) {
                            isConfirmed = true;
                        }
                    }

                    if (!isConfirmed) {
                        remaining.push(hash);
                    } else {
                        // 已确认：不加入 remaining（即从 pending 中移除）
                    }
                } catch (err) {
                    console.warn('check tx status failed for', hash, err);
                    // 出错时保留该 hash
                    remaining.push(hash);
                }
            }

            // 把剩余的写回 localStorage，并更新 state（仅在组件仍挂载时）
            try {
                if (mounted) {
                    localStorage.setItem(storageKey, JSON.stringify(remaining));
                    setPendingTransactions(remaining.slice());
                }
            } catch (err) {
                console.error('Failed write pending_hashes', err);
                if (mounted) setPendingTransactions(remaining.slice());
            }
        };

        // 仅运行一次（挂载或 network/address 变化时）
        checkPendingHashes();

        return () => {
            mounted = false;
        };
    }, [network, address]);

    return (
        <>
            {pendingTransactions && pendingTransactions.length > 0 &&
                <>
                    <h3 className="text-xl font-semibold mb-2 text-gray-300">Pending Transactions</h3>
                    <ul className="space-y-3">
                        {pendingTransactions.map((h) => (
                            <li key={h} className="flex items-center justify-between 
                             bg-linear-to-br from-sky-50 to-white border border-sky-100 rounded-lg p-4 
                             shadow-sm cursor-pointer transition-transform hover:scale-[1.001]">
                                <div className="flex gap-3">
                                    <Avatar
                                        name={address}
                                        size={48}
                                        variant="beam"
                                        colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
                                    />

                                    <div className="flex flex-col justify-center min-w-0">
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm shrink-0"></i>
                                            <a
                                                href={`${EXPLORER_MAP[network!]}/${h}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-300 dark:text-sky-400 hover:underline font-mono text-sm truncate"
                                                title={h}
                                            >
                                                {h.slice(0, 10)}...{h.slice(-8)}
                                            </a>
                                        </div>
                                        <div className="text-xs text-gray-300 mt-1">
                                            前往浏览器查看交易状态
                                        </div>
                                    </div>
                                </div>

                                <i className="fa-solid fa-spinner fa-spin-pulse fa-2xl" style={{ color: "#74C0FC" }}></i>

                            </li>
                        ))}
                    </ul>
                    <hr className="my-4 border-gray-700" />
                </>
            }
        </>

    );
}
