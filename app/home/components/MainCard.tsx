'use client';

import { useEffect, useState } from 'react';
import { getBalance } from '@/app/chainInteraction/lib/account';
import { getNetwork } from '@/app/networkManagement/lib/saveNetwork';

import Transfer from './mainCard/transfer/Transfer';
import Receive from './mainCard/receive/Receive';
import TotalBalance from './mainCard/TotalBalance';
import Swap from './mainCard/swap/Swap';
import DeFi from './mainCard/defi/DeFi';



type props = {
    address: string | undefined,
    network: string | null,
    totalBalance: number
}

export default function MainCard({ address, network, totalBalance }: props) {
    const [balance, setBalance] = useState<string>('0.0');
    const [symbol, setSymbol] = useState<string>('ETH');
    const [TransferOpen, setSendTransactionOpen] = useState(false);
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [swapOpen, setSwapOpen] = useState(false);
    const [financeOpen, setFinanceOpen] = useState(false);


    useEffect(() => {
        // 自调用异步函数
        (async () => {
            try {
                if (address && network) {
                    const balance = await getBalance(network, address, network ? network : "ethereum");
                    if (balance) {
                        setBalance(balance);
                    }

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

        <div className=" bg-white border border-sky-200 rounded-2xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-semibold text-sky-800 mt-1 ">
                        <TotalBalance usdAmount={totalBalance} address={address} />
                    </div>

                    <div className="text-sm ml-1.5 text-sky-500 mt-1 flex items-center gap-2">
                        <i className="fa-solid fa-coins"></i>
                        {Number(balance).toFixed(18)} {symbol}
                    </div>

                </div>

            </div>

            <div className="flex items-center justify-between px-2 pt-3">
                {/* 发送按钮 - 圆形 */}
                <div className="relative group flex flex-col items-center">
                    <button
                        onClick={() => setSendTransactionOpen(true)}
                        className="rounded-full w-12 h-12 bg-sky-600 text-white font-medium hover:bg-sky-700 transition flex items-center justify-center"
                    >
                        <i className="fa-regular fa-paper-plane fa-beat"></i>
                    </button>
                    {/* 悬浮时显示的文字 */}
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 font-medium text-gray-600 opacity-0 -translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
                        发送
                    </span>
                </div>
                {/* 接收按钮 - 圆形 */}
                <div className="relative group flex flex-col items-center">
                    <button
                        onClick={() => setReceiveOpen(true)}
                        className="rounded-full w-12 h-12 bg-white border border-sky-200 text-sky-700 font-medium hover:bg-sky-50 transition flex items-center justify-center"
                    >
                        <i className="fa-solid fa-qrcode"></i>
                    </button>
                    {/* 悬浮时显示的文字 */}
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 font-medium text-gray-600 opacity-0 -translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
                        接收
                    </span>
                </div>
                {/* Swap按钮 - 圆形 */}
                <div className="relative group flex flex-col items-center">
                    <button
                        onClick={() => setSwapOpen(true)}
                        className="rounded-full w-12 h-12 bg-sky-600 text-white font-medium hover:bg-sky-700 transition flex items-center justify-center"
                    >
                        <i className="fa-solid fa-arrows-rotate fa-spin"></i>
                    </button>
                    {/* 悬浮时显示的文字 */}
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 font-medium text-gray-600 opacity-0 -translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
                        兑换
                    </span>
                </div>
                {/* Finance按钮 - 圆形 */}
                <div className="relative group flex flex-col items-center">
                    <button
                        onClick={() => setFinanceOpen(true)}
                        className="rounded-full w-12 h-12 bg-white border border-sky-200 text-sky-700 font-medium hover:bg-sky-50 transition flex items-center justify-center"
                    >
                        <i className="fa-solid fa-sack-dollar"></i>
                    </button>
                    {/* 悬浮时显示的文字 */}
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 font-medium text-gray-600 opacity-0 -translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
                        DeFi
                    </span>
                </div>
                {/* 抽屉效果：Transfer组件 */}
                <div className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${TransferOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {/* 遮罩层 */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 ${TransferOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setSendTransactionOpen(false)}
                    />

                    {/* 抽屉内容 */}
                    <div className={`absolute right-0 top-0 h-full w-full max-w-md  transform transition-transform duration-300 ease-in-out ${TransferOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <Transfer
                            setTransferOpen={setSendTransactionOpen}
                            address={address}
                            network={network}
                        />
                    </div>
                </div>
                {/* 抽屉效果：Receive组件 */}
                <div className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${receiveOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {/* 遮罩层 */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 ${receiveOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setReceiveOpen(false)}
                    />

                    {/* 抽屉内容 */}
                    <div className={`absolute right-0 top-0 h-full w-full max-w-md  transform transition-transform duration-300 ease-in-out ${receiveOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <Receive
                            address={address}
                            setReceiveOpen={setReceiveOpen}
                        />
                    </div>
                </div>
                {/* 抽屉效果：Swap组件 */}
                <div className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${swapOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {/* 遮罩层 */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 ${swapOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setSwapOpen(false)}
                    />

                    {/* 抽屉内容 */}
                    <div className={`absolute right-0 top-0 h-full w-full max-w-md  transform transition-transform duration-300 ease-in-out ${swapOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <Swap
                            address={address}
                            network={network!}
                            setSwapOpen={setSwapOpen}
                        />
                    </div>
                </div>
                {/* 抽屉效果：finance组件 */}
                <div className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${financeOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {/* 遮罩层 */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 ${financeOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setFinanceOpen(false)}
                    />

                    {/* 抽屉内容 */}
                    <div className={`absolute right-0 top-0 h-full w-full max-w-md  transform transition-transform duration-300 ease-in-out ${financeOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <DeFi setFinanceOpen={setFinanceOpen} network={network} address={address} />
                    </div>
                </div>
            </div>
        </div>)


}