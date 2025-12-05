'use client';

import { useEffect, useState } from 'react';
import { getBalance } from '@/app/chainInteraction/lib/account';
import { getNetwork } from '@/app/networkManagement/lib/saveNetwork';

import Transfer from './mainCard/transfer/Transfer';
import Receive from './mainCard/receive/Receive';


type props = { 
    address: string | undefined, 
    network: string | null, 
    totalBalance: number
}

export default function MainCard({ address, network, totalBalance }: props) {
    const [balance, setBalance] = useState<string>('0.0');
    const [symbol, setSymbol] = useState<string>('ETH');
    const [sendTransactionOpen, setSendTransactionOpen] = useState(false);
    const [receiveOpen, setReceiveOpen] = useState(false);


    useEffect(() => {
        // 自调用异步函数
        (async () => {
            try {
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

    }, [network, address]); 

    return (

        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-semibold text-sky-800 mt-1 ">
                        <i className="fa-solid fa-dollar-sign"></i>
                        <span>{totalBalance} USD</span>
                    </div>

                    <div className="text-sm ml-1.5 text-sky-500 mt-1 flex items-center gap-2">
                        <i className="fa-solid fa-coins"></i>
                        {Number(balance).toFixed(18)} {symbol}
                    </div>

                </div>

            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
                <button
                    onClick={() => setSendTransactionOpen(true)}
                    className="w-full rounded-xl py-3 bg-sky-600 text-white font-medium hover:bg-sky-700 transition flex items-center justify-center gap-2"
                >
                    <i className="fa-regular fa-paper-plane fa-beat"></i>
                    <span>发送</span>
                </button>
                {sendTransactionOpen &&
                    <Transfer
                        setSentTransactionOpen={setSendTransactionOpen}
                        address={address}
                        network={network}
                    />}
                <button
                    onClick={() => setReceiveOpen(true)}
                    className="w-full rounded-xl py-3 bg-white border border-sky-200 text-sky-700 font-medium hover:bg-sky-50 transition flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-qrcode"></i>
                    <span>接受</span>
                </button>
                {receiveOpen && <Receive address={address} setReceiveOpen={setReceiveOpen} />}
            </div>
        </div>)



}