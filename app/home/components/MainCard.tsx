'use client';

import { useEffect,  useState } from 'react';
import { AddressRecord, getAddress } from '@/app/generateWallet/lib/saveAddress';
import { getPrice } from '@/app/chainInteract/lib/network';
import { getBalance } from '@/app/chainInteract/lib/account';

export default function MainCard() {
    const [balance, setBalance] = useState<string>('0.0');
    const [price, setPrice] = useState<number>(0);
    const network: string = localStorage.getItem('currentNetwork') ?? "";

    useEffect(() => {
        // 自调用异步函数
        (async () => {
            try {
                const addressRecord: AddressRecord = await getAddress(0);
                const addr = addressRecord.address;           
                setPrice(await getPrice(network));

                setBalance(await getBalance(addr, network));

            } catch (err) {
                console.error("请求出错:", err);
            }
        })();

    }, []); // 空依赖数组表示只在挂载时执行一次

    return (

        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-sky-500">总余额</div>
                    <div className="text-2xl font-semibold text-sky-800 mt-1">{balance} ETH</div>
                    <div className="text-sm text-sky-500 mt-1">现价: {price} USD</div>
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
        </div>)



}