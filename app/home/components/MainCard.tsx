'use client';

import { useEffect, useState } from 'react';
import { getPrice } from '@/app/chainInteraction/lib/network';
import { getBalance } from '@/app/chainInteraction/lib/account';
import { getNetwork } from '@/app/networkManagement/lib/saveNetwork';

export default function MainCard({ address, network }: { address: string | undefined, network: string | null }) {
    const [balance, setBalance] = useState<string>('0.0');
    const [price, setPrice] = useState<number>(0);
    const [symbol, setSymbol] = useState<string>('ETH');


    useEffect(() => {
        // 自调用异步函数
        (async () => {
            try {

                setPrice(await getPrice(network ? network : "ethereum"));
                if (address) {
                    setBalance(await getBalance(address, network ? network : "ethereum"));
                }

                const netInfo = await getNetwork(network ? network : "ethereum");
                if (netInfo && netInfo.symbol) {
                    setSymbol(netInfo.symbol);
                } else {
                    // fallback to ETH if network info not found
                    setSymbol('unkown');
                }

            } catch (err) {
                console.error("请求出错:", err);
            }
        })();

    }, [network, address]); // 依赖 network 或 address 改变时重新获取

    return (

        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-semibold text-sky-800 mt-1 ">
                        <i className="fa-solid fa-dollar-sign"></i>
                        <span>{(price * Number(balance)).toFixed(2)} USD</span>
                    </div>

                    <div className="text-sm ml-1.5 text-sky-500 mt-1 flex items-center gap-2">
                        <i className="fa-solid fa-coins"></i>
                        {Number(balance).toFixed(18)} {symbol}
                    </div>

                </div>

            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
                <button
                    onClick={() => alert('发送（演示）')}
                    className="w-full rounded-xl py-3 bg-sky-600 text-white font-medium hover:bg-sky-700 transition flex items-center justify-center gap-2"
                >
                    <i className="fa-regular fa-paper-plane fa-beat"></i>
                    <span>发送</span>
                </button>
                <button
                    onClick={() => alert('接收（演示）')}
                    className="w-full rounded-xl py-3 bg-white border border-sky-200 text-sky-700 font-medium hover:bg-sky-50 transition flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-qrcode"></i>
                    <span>接受</span>
                </button>
            </div>
        </div>)



}