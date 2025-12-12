// Modified AaveCard.tsx
'use client'

import { useState, useEffect } from "react";
import { getAssetsOfaToken, getAssetsOfStkwaToken } from '@/app/chainInteraction/lib/aave';
import { getBalance } from "@/app/chainInteraction/lib/account";
import AaveAtoken from "./AaveAtoken";
import AaveStkWatoken from "./AaveStkWatoken";

// Aave 质押信息接口
interface AaveTokenInfo {
    hasStaked: boolean;
    userAssets: string;
    poolAssets: string;
    tokenBalance: string;
    atokenBalance: string;
    tokenSymbol: string;
    tokenName: string;
    price: string | null;
    apy?: number;
}

interface StkwaTokenInfo {
    hasStaked: boolean;
    userAssets: string;
    poolAssets: string;
    tokenBalance: string;
    atokenBalance: string;
    stkwatokenBalance: string;
    tokenSymbol: string;
    tokenName: string;
    price: string | null;
    apy?: number;
}

interface AaveRealTimeData {
    loading: boolean;
    error: string | null;
}

type Balances = {
    USDT: string,
    USDC: string,
    AUSDT: string,
    AUSDC: string,
    STKWAUSDC: string,
    STKWAUSDT: string,
}


type Props = {
    address: string | undefined;
    network: string | null;
    tvl: string; // 注意：这个 tvl 现在可能不需要了，我们自己计算
};


export default function AaveCard({ address, network, tvl }: Props) {
    const [aaveRealTimeData, setAaveRealTimeData] = useState<AaveRealTimeData>({
        loading: true,
        error: null
    });

    // aToken 状态
    const [usdcInfo, setUsdcInfo] = useState<AaveTokenInfo | null>(null);
    const [usdtInfo, setUsdtInfo] = useState<AaveTokenInfo | null>(null);

    // stkwaToken 状态
    const [stkwaUsdcInfo, setStkwaUsdcInfo] = useState<StkwaTokenInfo | null>(null);
    const [stkwaUsdtInfo, setStkwaUsdtInfo] = useState<StkwaTokenInfo | null>(null);

    // 分开计算总资产
    const [totalATokenAssets, setTotalATokenAssets] = useState<number>(0);
    const [totalStkwaAssets, setTotalStkwaAssets] = useState<number>(0);
    const [totalUserAssets, setTotalUserAssets] = useState<number>(0);

    // 添加 TVL 状态
    const [totalTVL, setTotalTVL] = useState<number>(0);


    // 格式化数字为易读格式
    const formatNumber = (num: number, decimals: number = 2): string => {
        if (!num) return '0.00';

        try {
            return num.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        } catch (error) {
            console.error('格式化数字失败:', error);
            return '0.00';
        }
    };

    // 格式化大数字显示（如 1.2M, 3.4K）
    const formatCompactNumber = (num: number): string => {
        if (!num) return '$0.00';

        if (num >= 1_000_000_000) {
            return `$${(num / 1_000_000_000).toFixed(2)}B`;
        } else if (num >= 1_000_000) {
            return `$${(num / 1_000_000).toFixed(2)}M`;
        } else if (num >= 1_000) {
            return `$${(num / 1_000).toFixed(2)}K`;
        }
        return `$${num.toFixed(2)}`;
    };

    // 获取 Aave 质押信息 - 分别获取 aToken 和 stkwaToken
    useEffect(() => {
        const fetchAaveInfo = async () => {
            if (!address) {
                setAaveRealTimeData({
                    loading: false,
                    error: '请连接钱包'
                });
                return;
            }

            try {
                setAaveRealTimeData(prev => ({ ...prev, loading: true }));

                // 并行获取所有数据
                const [
                    usdc,
                    usdt,
                    aUsdcData,
                    aUsdtData,
                    stkwaUsdcData,
                    stkwaUsdtData
                ] = await Promise.all([
                    getBalance('ethereum', address, 'usdc'),
                    getBalance('ethereum', address, 'usdt'),
                    getAssetsOfaToken('ausdc', address),
                    getAssetsOfaToken('ausdt', address),
                    getAssetsOfStkwaToken('stkwausdc', address),
                    getAssetsOfStkwaToken('stkwausdt', address)
                ]);

                let aTokenTotal = 0;
                let stkwaTotal = 0;
                let tvlTotal = 0;


                // 处理 aToken USDC 数据
                if (aUsdcData && aUsdcData.length === 3) {
                    const [userAssets, poolAssets, balance] = aUsdcData;
                    const hasStaked = userAssets > 0;

                    const usdcInfoObj = {
                        hasStaked,
                        userAssets: userAssets.toString(),
                        poolAssets: poolAssets.toString(),
                        tokenBalance: usdc ?? "0",
                        atokenBalance: balance.toString(),
                        tokenSymbol: 'USDC',
                        tokenName: 'Aave Ethereum USDC',
                        price: null
                    };

                    setUsdcInfo(usdcInfoObj);

                    if (hasStaked) {
                        aTokenTotal += userAssets;
                    }
                    tvlTotal += poolAssets;
                }

                // 处理 aToken USDT 数据
                if (aUsdtData && aUsdtData.length === 3) {
                    const [userAssets, poolAssets, balance] = aUsdtData;
                    const hasStaked = userAssets > 0;

                    const usdtInfoObj = {
                        hasStaked,
                        userAssets: userAssets.toString(),
                        poolAssets: poolAssets.toString(),
                        tokenBalance: usdt ?? "0",
                        atokenBalance: balance.toString(),
                        tokenSymbol: 'USDT',
                        tokenName: 'Aave Ethereum USDT',
                        price: null
                    };

                    setUsdtInfo(usdtInfoObj);

                    if (hasStaked) {
                        aTokenTotal += userAssets;
                    }
                    tvlTotal += poolAssets;
                }

                // 处理 stkwaToken USDC 数据
                if (stkwaUsdcData && stkwaUsdcData.length === 3) {
                    const [userAssets, poolAssets, balance] = stkwaUsdcData;
                    const hasStaked = userAssets > 0;

                    const stkwaUsdcInfoObj = {
                        hasStaked,
                        userAssets: userAssets.toString(),
                        poolAssets: poolAssets.toString(),
                        tokenBalance: usdc ?? "0",
                        atokenBalance: aUsdcData?.[2]?.toString() ?? "0",
                        stkwatokenBalance: balance.toString(),
                        tokenSymbol: 'stkwaUSDC',
                        tokenName: 'Umbrella USDC',
                        price: null
                    };

                    setStkwaUsdcInfo(stkwaUsdcInfoObj);

                    if (hasStaked) {
                        stkwaTotal += userAssets;
                    }
                    tvlTotal += poolAssets;
                }

                // 处理 stkwaToken USDT 数据
                if (stkwaUsdtData && stkwaUsdtData.length === 3) {
                    const [userAssets, poolAssets, balance] = stkwaUsdtData;
                    const hasStaked = userAssets > 0;

                    const stkwaUsdtInfoObj = {
                        hasStaked,
                        userAssets: userAssets.toString(),
                        poolAssets: poolAssets.toString(),
                        tokenBalance: usdt ?? "0",
                        atokenBalance: aUsdtData?.[2]?.toString() ?? "0",
                        stkwatokenBalance: balance.toString(),
                        tokenSymbol: 'stkwaUSDT',
                        tokenName: 'Umbrella USDT',
                        price: null
                    };

                    setStkwaUsdtInfo(stkwaUsdtInfoObj);

                    if (hasStaked) {
                        stkwaTotal += userAssets;
                    }
                    tvlTotal += poolAssets;
                }

                // 设置分开的资产和总资产
                setTotalATokenAssets(aTokenTotal);
                setTotalStkwaAssets(stkwaTotal);
                setTotalUserAssets(aTokenTotal + stkwaTotal);
                setTotalTVL(tvlTotal);

                setAaveRealTimeData({
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('获取Aave质押信息失败:', error);
                setAaveRealTimeData({
                    loading: false,
                    error: '获取质押数据失败，请稍后重试'
                });
            }
        };

        fetchAaveInfo();
    }, [address]);

    // 计算已质押的代币数量
    const calculateStakedTokens = (): number => {
        let count = 0;
        if (usdcInfo?.hasStaked) count++;
        if (usdtInfo?.hasStaked) count++;
        if (stkwaUsdcInfo?.hasStaked) count++;
        if (stkwaUsdtInfo?.hasStaked) count++;
        return count;
    };

    // 显示加载状态
    if (aaveRealTimeData.loading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 bg-white rounded-xl shadow-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <span className="text-sm text-gray-600">加载Aave质押数据...</span>
            </div>
        );
    }

    // 显示错误状态
    if (aaveRealTimeData.error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-md">
                <div className="flex items-center text-red-700">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{aaveRealTimeData.error}</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* TVL 和资产概览 - 增强区分度，使用不同的渐变和阴影 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-xl font-bold text-blue-800">
                            {formatCompactNumber(totalTVL)}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">总锁仓价值</div>
                    </div>
                    <div className="text-center p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-xl font-bold text-blue-800">
                            ${formatNumber(totalATokenAssets, 2)}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">aToken 资产</div>
                    </div>
                    <div className="text-center p-4 bg-linear-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-xl font-bold text-purple-800">
                            ${formatNumber(totalStkwaAssets, 2)}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">stkwaToken 资产</div>
                    </div>
                </div>

                {/* aToken 部分 - 使用绿色调，添加左侧色条 */}
                <div className="mb-6">
                    <div className="flex items-center mb-3">
                        <div className="h-8 w-2 bg-blue-500 rounded-r mr-3 shadow"></div>
                        <h3 className="text-lg font-semibold text-gray-800">aToken 收益资产</h3>
                        <span className="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full shadow-sm">
                            ${formatNumber(totalATokenAssets, 2)}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <AaveAtoken info={usdcInfo} scheme="usdc" />
                        <AaveAtoken info={usdtInfo} scheme="usdt" />
                    </div>
                </div>

                {/* stkwaToken 部分 - 使用紫色调，添加左侧色条 */}
                <div className="mb-6">
                    <div className="flex items-center mb-3">
                        <div className="h-8 w-2 bg-purple-500 rounded-r mr-3 shadow"></div>
                        <h3 className="text-lg font-semibold text-gray-800">stkwaToken 质押资产</h3>
                        <span className="ml-2 px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full shadow-sm">
                            ${formatNumber(totalStkwaAssets, 2)}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <AaveStkWatoken address={address} network={network} info={stkwaUsdcInfo} scheme="usdc" />
                        <AaveStkWatoken address={address} network={network} info={stkwaUsdtInfo} scheme="usdt" />
                    </div>
                </div>

                {/* 汇总信息 - 使用灰色调，增强进度条效果 */}
                <div className="p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-md">
                    <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div className="space-y-1">
                            <div className="text-gray-600">已质押种类</div>
                            <div className="font-medium text-gray-800">
                                {calculateStakedTokens()} / 4
                            </div>
                        </div>
                        <div className="space-y-1 text-center">
                            <div className="text-gray-600">aToken 资产</div>
                            <div className="font-bold text-blue-700">
                                ${formatNumber(totalATokenAssets, 2)}
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <div className="text-gray-600">stkwaToken 资产</div>
                            <div className="font-bold text-purple-700">
                                ${formatNumber(totalStkwaAssets, 2)}
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-700">总资产</span>
                            <span className="text-xl font-bold text-blue-800">
                                ${formatNumber(totalUserAssets, 2)}
                            </span>
                        </div>

                        {/* 资产分布图 - 添加阴影和过渡 */}
                        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-2 shadow-inner">
                            {totalATokenAssets > 0 && (
                                <div
                                    className="absolute h-full bg-blue-500 transition-all duration-300"
                                    style={{
                                        width: `${(totalATokenAssets / (totalUserAssets || 1)) * 100}%`,
                                        left: '0'
                                    }}
                                    title="aToken 资产"
                                ></div>
                            )}
                            {totalStkwaAssets > 0 && (
                                <div
                                    className="absolute h-full bg-purple-500 transition-all duration-300"
                                    style={{
                                        width: `${(totalStkwaAssets / (totalUserAssets || 1)) * 100}%`,
                                        left: `${(totalATokenAssets / (totalUserAssets || 1)) * 100}%`
                                    }}
                                    title="stkwaToken 资产"
                                ></div>
                            )}
                        </div>

                        <div className="flex justify-between text-xs text-gray-600">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded mr-1 shadow"></div>
                                <span>aToken: ${formatNumber(totalATokenAssets, 2)}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-purple-500 rounded mr-1 shadow"></div>
                                <span>stkwaToken: ${formatNumber(totalStkwaAssets, 2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}