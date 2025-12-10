'use client';

import { useEffect, useState } from 'react';
import * as Web3Icons from '@web3icons/react';
import { getAllNetworkNames } from '@/app/networkManagement/lib/saveNetwork';

export default function NetworkCard({
  network,
  setNetwork,
}: {
  network: string | null;
  setNetwork: (value: string) => void;
}) {
  const [showNetworkCard, setShowNetworkCard] = useState(false);
  const [networks, setNetworks] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const allKeys = await getAllNetworkNames();
        setNetworks(allKeys as string[]);
      } catch (err) {
        console.error('获取网络列表失败', err);
      }
    })();
  }, [network]);

  const handleSelect = (net: string) => {
    localStorage.setItem('currentNetwork', net);
    setNetwork(net);
    setShowNetworkCard(false);
  };

  // Render network icon using @web3icons/react
  const renderNetworkIcon = (net: string) => {
    // 构造组件名，例如 NetworkEthereum、NetworkZksync
    const compName = `Network${net.charAt(0).toUpperCase() + net.slice(1)}`;
    const IconComp = (Web3Icons as any)[compName];
    if (IconComp) {
      return <IconComp variant="branded" size={28} />;
    }
    // fallback: 首字母占位
    return (
      <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-400 to-sky-400 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{net.charAt(0).toUpperCase()}</span>
      </div>
    );
  };

  return (
    <div className="caret-transparent flex flex-col">
      <div className="flex">
        <button
          onClick={() => setShowNetworkCard(true)}
          className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition font-medium 
                  bg-white text-sky-500 border-sky-100 hover:bg-sky-50"
        >
          <i className="fa-solid fa-globe"></i>
          {network}
        </button>
      </div>

      {showNetworkCard && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setShowNetworkCard(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-96 overflow-hidden border border-gray-100">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">选择网络</h2>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                onClick={() => setShowNetworkCard(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

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
                      {renderNetworkIcon(net)}
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
