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
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setShowNetworkCard(false)}
          ></div>

          {/* 浮窗主体 */}
          <div className="relative bg-linear-to-b from-white to-blue-50 rounded-2xl shadow-2xl w-96 overflow-hidden border border-gray-100">

            {/* 头部 */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">选择网络</h2>

                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 
                         transition-colors text-gray-500 hover:text-gray-700"
                  onClick={() => setShowNetworkCard(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 网络列表 */}
            <div className="px-3 pb-6">
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {networks.map((net) => (
                  <li
                    key={net}
                    className="mx-3 px-4 py-3 rounded-xl transition-all cursor-pointer
                           bg-white border border-gray-100 hover:border-sky-200 hover:shadow-sm
                           hover:bg-linear-to-r hover:from-sky-50 hover:to-blue-50"
                    onClick={() => handleSelect(net)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={getLogoUrl(net)}
                          alt={`${net} logo`}
                          className="w-8 h-8 rounded-full object-cover bg-white p-1 border border-gray-100"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            // 显示备选图标
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-sky-400 flex items-center justify-center';
                              fallback.innerHTML = `<span class="text-xs font-bold text-white">${net.charAt(0)}</span>`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{net}</span>
                        {network === net && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span className="text-xs text-green-600 font-medium">已选择</span>
                          </div>
                        )}
                      </div>
                      <i className="fa-solid fa-chevron-right text-sm text-gray-400"></i>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
