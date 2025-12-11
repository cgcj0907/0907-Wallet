'use client'

import { useState, useEffect } from "react";
import LidoCard from "./LidoCard";
import AaveCard from "./AaveCard";
import { getLidoTVL } from "@/app/chainInteraction/lib/lido";

import { getAssetsOfaToken, getAssetsOfStkwaToken } from '@/app/chainInteraction/lib/aave';

type Props = {
  setFinanceOpen: (value: boolean) => void,
  address: string | undefined,
}

type Balances = {
  USDT: string,
  USDC: string,
  AUSDT: string,
  AUSDC: string,
  STKWAUSDC: string,
  STKWAUSDT: string,
}



// 格式化TVL数字
const formatTVL = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else {
    return `$${value.toFixed(0)}`;
  }
};


// 获取Aave TVL - 包括aToken和stkwaToken
const getAaveTotalTVL = async (): Promise<number> => {

  try {
    // 并行获取所有数据
    const [
      aUsdcData,
      aUsdtData,
      stkwaUsdcData,
      stkwaUsdtData
    ] = await Promise.all([
      getAssetsOfaToken('ausdc' ),
      getAssetsOfaToken('ausdt'),
      getAssetsOfStkwaToken('stkwausdc'),
      getAssetsOfStkwaToken('stkwausdt')
    ]);
    let totalTVL = 0;

    // 累加 aToken USDC 池子资产
    if (aUsdcData && aUsdcData.length === 3) {
      const [, poolAssets,] = aUsdcData;

      totalTVL += poolAssets;
    }

    // 累加 aToken USDT 池子资产
    if (aUsdtData && aUsdtData.length === 3) {
      const [, poolAssets,] = aUsdtData;
      totalTVL += poolAssets;
    }

    // 累加 stkwaToken USDC 池子资产
    if (stkwaUsdcData && stkwaUsdcData.length === 3) {
      const [, poolAssets,] = stkwaUsdcData;
      totalTVL += poolAssets;
    }

    // 累加 stkwaToken USDT 池子资产
    if (stkwaUsdtData && stkwaUsdtData.length === 3) {
      const [, poolAssets,] = stkwaUsdtData;
      totalTVL += poolAssets;
    }

    return totalTVL;
  } catch (error) {
    console.error('获取Aave TVL失败:', error);
    // 返回默认值
    return 12400000000; // 12.4B
  }
};

export default function DeFi({ setFinanceOpen, address }: Props) {
  const [lidoTVL, setLidoTVL] = useState<number>(0);
  const [aaveTVL, setAaveTVL] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeProject, setActiveProject] = useState<string>('overview');

  // 获取TVL数据
  useEffect(() => {
    const fetchTVLData = async () => {
      try {

        setLoading(true);


        // 并行获取Lido和Aave的TVL
        const [rawLidoTvl, aaveTotalTVL] = await Promise.all([
          getLidoTVL(),
          getAaveTotalTVL(),
        ]);
        console.log(rawLidoTvl)
        // 设置Lido TVL
        setLidoTVL(rawLidoTvl);
        // 设置Aave TVL（包括aToken和stkwaToken）
        setAaveTVL(aaveTotalTVL);

      } catch (error) {
        console.error('获取TVL数据失败:', error);
        // 设置默认值
        setLidoTVL(25000000000); // 25B
        setAaveTVL(12400000000); // 12.4B
      } finally {
        setLoading(false);
      }
    };

    fetchTVLData();
  }, [address]);

  // Lido logo组件
  const LidoLogo = () => (
    <img
      src="/defi/lido.svg"
      alt="Lido Logo"
      className="w-8 h-8"
    />
  );

  // Aave logo组件
  const AaveLogo = () => (
    <img
      src="/defi/aave.svg"
      alt="Aave Logo"
      className="w-8 h-8"
    />
  );

  // 项目选择器
  const ProjectSelector = () => (
    <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
      <button
        onClick={() => setActiveProject('overview')}
        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeProject === 'overview'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
      >
        总览
      </button>
      <button
        onClick={() => setActiveProject('lido')}
        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeProject === 'lido'
          ? 'bg-amber-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
      >
        Lido
      </button>
      <button
        onClick={() => setActiveProject('aave')}
        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeProject === 'aave'
          ? 'bg-indigo-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
      >
        Aave
      </button>
    </div>
  );

  // 加载状态
  if (loading) {
    return (
      <div className="h-full bg-linear-to-b from-sky-50 to-blue-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-linear-to-r from-sky-500 to-blue-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">DeFi</h1>
              <p className="text-sky-100 text-sm">探索去中心化金融项目</p>
            </div>

            <button
              onClick={() => setFinanceOpen(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label="关闭DeFi聚合器"
            >
              <i className="fa-solid fa-times text-lg"></i>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <span className="text-sm text-gray-600">加载DeFi数据...</span>
        </div>
      </div>
    );
  }

  // 渲染项目内容
  const renderProjectContent = () => {
    switch (activeProject) {
      case 'overview':
        return (
          <>
            {/* Lido卡片 */}
            <div className="mb-6">
              <div
                className="bg-linear-to-br from-white to-amber-50 rounded-xl border border-amber-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setActiveProject('lido')}
              >
                <div className="bg-linear-to-r from-amber-400 to-yellow-400 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 ">
                        <LidoLogo />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Lido</h3>
                        <p className="text-white/90 text-sm">流动性质押ETH，获取stETH</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      低风险
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-amber-700 mb-2">
                    <span>当前TVL</span>
                    <span className="font-bold">{formatTVL(lidoTVL)}</span>
                  </div>
                  <div className="text-xs text-amber-600">
                    点击查看详细数据和质押
                  </div>
                </div>
              </div>
            </div>

            {/* Aave卡片 */}
            <div className="mb-6">
              <div
                className="bg-linear-to-br from-white to-indigo-50 rounded-xl border border-indigo-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setActiveProject('aave')}
              >
                <div className="bg-linear-to-r from-indigo-500 to-purple-500 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10">
                        <AaveLogo />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Aave</h3>
                        <p className="text-white/90 text-sm">借贷与质押，支持USDT/USDC</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                      中风险
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-indigo-700 mb-2">
                    <span>当前TVL</span>
                    <span className="font-bold">{formatTVL(aaveTVL)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-indigo-700 mb-2">
                    <span>支持的产品</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">aToken</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">stkwaToken</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-indigo-700 mb-2">
                    <span>支持的代币</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">USDT</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">USDC</span>
                    </div>
                  </div>
                  <div className="text-xs text-indigo-600">
                    点击查看详细数据和质押
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'lido':
        return (
          <div className="mb-6">
            <div className="bg-linear-to-br from-white to-amber-50 rounded-xl border border-amber-200 overflow-hidden shadow-md">
              <div className="bg-linear-to-r from-amber-400 to-yellow-400 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveProject('overview')}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <i className="fa-solid fa-arrow-left text-white"></i>
                    </button>
                    <div className="w-10 h-10 flex items-center justify-center">
                      <LidoLogo />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Lido</h3>
                      <p className="text-white/90 text-sm">流动性质押ETH，获取stETH</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    低风险
                  </span>
                </div>
              </div>
              <div className="p-4">
                <LidoCard
                  address={address}
                  tvl={formatTVL(lidoTVL)}
                />
              </div>
            </div>
          </div>
        );

      case 'aave':
        return (
          <div className="mb-6">
            <div className="bg-linear-to-br from-white to-indigo-50 rounded-xl border border-indigo-200 overflow-hidden shadow-md">
              <div className="bg-linear-to-r from-indigo-500 to-purple-500 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveProject('overview')}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <i className="fa-solid fa-arrow-left text-white"></i>
                    </button>
                    <div className="w-10 h-10  flex items-center justify-center">
                      <AaveLogo />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Aave</h3>
                      <p className="text-white/90 text-sm">借贷与质押，支持USDT/USDC</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                    中风险
                  </span>
                </div>
              </div>
              <div className="p-4">
                <AaveCard
                  address={address}
                  tvl={formatTVL(aaveTVL)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const totalTVL = lidoTVL + aaveTVL;

  return (
    <div className="h-full bg-linear-to-b from-sky-50 to-blue-50 overflow-y-auto">
      {/* 头部栏 */}
      <div className="sticky top-0 z-10 bg-linear-to-r from-sky-500 to-blue-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">DeFi</h1>
            <p className="text-sky-100 text-sm">探索去中心化金融项目</p>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={() => setFinanceOpen(false)}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            aria-label="关闭DeFi聚合器"
          >
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 项目选择器 */}
        <ProjectSelector />

        {/* 总览卡片 - 只在总览页面显示 */}
        {activeProject === 'overview' && (
          <div className="mb-4">
            <div className="bg-linear-to-r from-sky-100 to-blue-100 rounded-xl p-4 border border-sky-200 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-sky-800">DeFi聚合器</div>
                  <div className="text-sm text-sky-700">聚合优质DeFi服务</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {formatTVL(totalTVL)}
                  </div>
                  <div className="text-sm text-sky-700">总锁仓量</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-sky-200">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-sky-800">2</div>
                    <div className="text-xs text-sky-600">支持项目</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sky-800">{formatTVL(lidoTVL)}</div>
                    <div className="text-xs text-sky-600">Lido TVL</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sky-800">{formatTVL(aaveTVL)}</div>
                    <div className="text-xs text-sky-600">Aave TVL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 项目内容 */}
        {renderProjectContent()}

        {/* 说明区域 */}
        {activeProject === 'overview' && (
          <div className="bg-linear-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200">
            <h3 className="text-md font-bold text-sky-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-sky-500"></i>
              DeFi 使用说明
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="fa-solid fa-wallet text-sky-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-bold text-sky-800 text-sm">连接钱包</h4>
                  <p className="text-sky-600 text-xs">
                    连接您的以太坊钱包开始探索DeFi项目。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="fa-solid fa-chart-line text-blue-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-bold text-sky-800 text-sm">收益追踪</h4>
                  <p className="text-sky-600 text-xs">
                    实时查看项目TVL和APR，选择最佳投资机会。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="fa-solid fa-shield-halved text-cyan-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-bold text-sky-800 text-sm">风险管理</h4>
                  <p className="text-sky-600 text-xs">
                    所有项目经过审计，请注意DeFi风险并DYOR。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}