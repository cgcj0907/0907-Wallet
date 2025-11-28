'use client';

import { useEffect, useState } from 'react';
import { getAllNetworkNames } from '@/app/networkManagement/lib/saveNetwork';




export default function NetworkCard({ network, setNetwork }: { network: string | null, setNetwork: (value: string) => void }) {

  const [showNetworkCard, setShowNetworkCard] = useState(false);
  const [networks, setNetworks] = useState<string[]>([]);


  useEffect(() => {
    (async () => {
      try {
        const allKeys = await getAllNetworkNames(); // 获取 networks 表所有 keyPath
        setNetworks(allKeys as string[]);
      } catch (err) {
        console.error('获取网络列表失败', err);
      }
    })();
  }, [network]);

  const handleSelect = (network: string) => {
    localStorage.setItem('currentNetwork', network);
    setNetwork(network);
    setShowNetworkCard(false);
  };

  const getLogoUrl = (network: string) => {
    // TrustWallet repo 网络 logo url
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${network}/info/logo.png`;
  };

  return (


    <div className=" flex flex-col ">
      <div className="flex">

        <button
          onClick={() => setShowNetworkCard(true)}
          className='flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition font-medium 
                  bg-white text-sky-500 border-sky-100 hover:bg-sky-50'
        >
          <i className="fa-solid fa-globe"></i>
          {network}
        </button>

      </div>
      {showNetworkCard && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* 背景遮罩，更透明 */}
          <div
            className="absolute inset-0 bg-blue-50 bg-opacity-10"
            onClick={() => setShowNetworkCard(false)}
          ></div>

          {/* 浮窗主体 */}
          <div className="relative bg-sky-50 rounded-xl shadow-lg w-96 p-6 flex flex-col">
            {/* 关闭按钮 */}
            <button
              className="absolute top-3 right-3 text-sky-500 hover:text-sky-700 font-bold text-xl"
              onClick={() => setShowNetworkCard(false)}
            >
              ×
            </button>

            <h2 className="text-lg font-medium mb-4 text-sky-800">选择网络</h2>

            <ul className="flex flex-col gap-2">
              {networks.map((net) => (
                <li
                  key={net}
                  className="cursor-pointer px-4 py-2 rounded bg-sky-100 text-sky-800 hover:bg-sky-200 hover:text-sky-900 transition flex items-center gap-2"
                  onClick={() => handleSelect(net)}
                >
                  {/* 网络 logo */}
                  <img
                    src={getLogoUrl(net)}
                    alt={`${net} logo`}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      // 如果 logo 不存在就隐藏图片
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span>{net}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>

  );
}
