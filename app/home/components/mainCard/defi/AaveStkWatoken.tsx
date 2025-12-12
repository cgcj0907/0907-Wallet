'use client'

import { useState } from "react";
import AaveStkWatokenForm from "./AaveStkWatokenForm";

// Aave 质押信息接口
interface AaveTokenInfo {
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

type Props = {
    address: string | undefined;
    network: string | null;
    info: AaveTokenInfo | null;
    scheme: 'usdc' | 'usdt';
};

// 格式化数字为易读格式
const formatNumber = (num: number, decimals: number = 2): string => {
    if (!isFinite(num)) return '0.00';

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

// 简化大数字显示
const formatCompactNumber = (num: number): string => {
    if (!isFinite(num)) return '$0.00';
    if (num >= 1_000_000) {
        return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
        return `$${(num / 1_000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
};

export default function AaveStkWatoken({ address, network, info, scheme }: Props) {
    const [showActions, setShowActions] = useState(false);
    const [mode, setMode] = useState<string>("")

    // 统一使用淡紫色调，美化整体配色方案
    const primaryColor = 'purple'; // 主色：紫色
    const secondaryColor = 'violet'; // 辅助色：淡紫/紫罗兰
    const displayName = info?.tokenName || `Umbrella ${info?.tokenSymbol?.toUpperCase() || ''}`;

    return (
        <>
            <div className={`p-4 bg-linear-to-r from-${primaryColor}-50 to-${secondaryColor}-50 rounded-xl border border-${primaryColor}-200 shadow-md transition-shadow hover:shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${primaryColor}-500`} />
                        <span className={`font-semibold text-${primaryColor}-800`}>
                            {displayName}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 操作按钮 */}
                        <button
                            type="button"
                            onClick={() => setShowActions(!showActions)}
                            className={`ml-2 text-xs px-3 py-1 rounded-md border border-${primaryColor}-300 bg-${primaryColor}-50 hover:bg-${primaryColor}-100 transition-colors`}
                        >
                            {showActions ? '收起' : '操作'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <div className={`text-xs text-${primaryColor}-600`}>池子规模</div>
                        <div className={`font-bold text-${primaryColor}-800`}>
                            {info ? formatCompactNumber(Number(info.poolAssets)) : '$0.00'}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className={`text-xs text-${primaryColor}-600`}>您的质押</div>
                        <div className='flex flex-col'>
                            <div className={`font-bold text-${primaryColor}-800`}>
                                资产总值: {info?.hasStaked ? formatCompactNumber(Number(info.userAssets)) : '$0.00'}
                            </div>
                            <div className={`font-bold text-${primaryColor}-800`}>
                                代币数量: {info?.hasStaked ? info.stkwatokenBalance : '0.00'}
                            </div>
                        </div>
                    </div>
                </div>

                {info?.hasStaked && (
                    <div className={`mt-3 pt-3 border-t border-${primaryColor}-200`}>
                        <div className="flex justify-between text-xs">
                            <span className={`text-${primaryColor}-600`}>详细资产:</span>
                            <span className={`font-medium text-${primaryColor}-700`}>
                                ${formatNumber(Number(info.userAssets), 2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* 操作按钮组 - 点击"操作"时显示 */}
                {showActions && (
                    <div className="mt-4 pt-4 border-t border-${primaryColor}-200">
                        <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setMode('stake') }}
                                    className={`px-4 py-2 rounded-md bg-${primaryColor}-300 hover:bg-${primaryColor}-400 text-${primaryColor}-800 font-medium transition-colors`}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        质押
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setMode('redeem') }}
                                    className={`px-4 py-2 rounded-md bg-${primaryColor}-300 hover:bg-${primaryColor}-400 text-${primaryColor}-800 font-medium transition-colors`}
                                    disabled={!info?.hasStaked}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        赎回
                                    </div>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setMode('getRewards') }}
                                    className={`px-4 py-2 rounded-md bg-${primaryColor}-300 hover:bg-${primaryColor}-400 text-${primaryColor}-800 font-medium transition-colors`}
                                    disabled={!info?.hasStaked}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        领取收益
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setMode('cooldown') }}
                                    className={`px-4 py-2 rounded-md bg-${primaryColor}-300 hover:bg-${primaryColor}-400 text-${primaryColor}-800 font-medium transition-colors`}
                                    disabled={!info?.hasStaked}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        解锁质押
                                    </div>
                                </button>

                            </div>
                        </div>
                    </div>
                )}

                {/* 如果用户未质押，显示质押提示 */}
                {!info?.hasStaked && !showActions && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>尚未质押 stkwaToken, 点击上方"操作"按钮开始质押</span>
                        </div>
                    </div>
                )}

                {/* 直接渲染 AaveStkWatokenForm，不再使用模态框 */}
                {showActions && (
                    <div className="mt-4">
                        <AaveStkWatokenForm address={address} network={network} info={info} mode={mode} scheme={scheme} />
                    </div>
                )}
            </div>
        </>
    );
}