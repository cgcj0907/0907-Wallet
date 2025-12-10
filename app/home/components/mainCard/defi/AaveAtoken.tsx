// AaveAtoken.tsx
'use client'

import { useState } from 'react'
import AaveAtokenForm from './AaveAtokenForm'

// Aave 质押信息接口
interface AaveTokenInfo {
  hasStaked: boolean;
  userAssets: string;
  poolAssets: string;
  balance: string;
  tokenSymbol: string;
  tokenName: string;
  price: string | null;
  apy?: number;
}

type Props = {
  info: AaveTokenInfo | null;
  scheme: 'usdc' | 'usdt';
};

// 格式化数字为易读格式
const formatNumber = (num: number, decimals: number = 2): string => {
  if (!isFinite(num)) return '0.00'

  try {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  } catch (error) {
    console.error('格式化数字失败:', error)
    return '0.00'
  }
}

// 简化大数字显示
const formatCompactNumber = (num: number): string => {
  if (!isFinite(num)) return '$0.00'
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`
  }
  return `$${num.toFixed(2)}`
}

export default function AaveAtoken({ info, scheme }: Props) {
  const [showActions, setShowActions] = useState(false)

  const primaryColor = scheme === 'usdc' ? 'blue' : 'green'
  const secondaryColor = scheme === 'usdc' ? 'cyan' : 'emerald'

  // 处理按钮样式
  const getButtonClass = (type: 'primary' | 'secondary' | 'danger' | 'outline') => {
    const baseClass = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm'

    switch (type) {
      case 'primary':
        return `${baseClass} bg-${primaryColor}-600 hover:bg-${primaryColor}-700 text-white shadow-md hover:shadow-lg`;
      case 'secondary':
        return `${baseClass} bg-${secondaryColor}-500 hover:bg-${secondaryColor}-600 text-white shadow-md hover:shadow-lg`;
      case 'danger':
        return `${baseClass} bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg`;
      case 'outline':
        return `${baseClass} border border-${primaryColor}-300 bg-white text-${primaryColor}-700 hover:bg-${primaryColor}-50`;
      default:
        return baseClass;
    }
  }

  return (
    <>
      <div className={`p-4 bg-linear-to-r from-${primaryColor}-50 to-${secondaryColor}-50 rounded-xl border border-${primaryColor}-200`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-${primaryColor}-500`} />
            <span className={`font-semibold text-${primaryColor}-800`}>
              {info?.tokenName || `Aave Ethereum ${info?.tokenSymbol?.toUpperCase() || ''}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 操作按钮 */}
            <button
              type="button"
              onClick={() => setShowActions(!showActions)}
              className={`ml-2 text-xs px-3 py-1 rounded-md border border-${primaryColor}-200 hover:bg-${primaryColor}-50`}
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
          <div className="flex flex-col space-y-1">
            <div className={`text-xs text-${primaryColor}-600`}>您的质押</div>
            <div className='flex'>
              <div className={`font-bold text-${primaryColor}-800`}>
                资产总值
                {info?.hasStaked ? formatCompactNumber(Number(info.userAssets)) : '$0.00'}
              </div>
              <div className={`font-bold text-${primaryColor}-800`}>
                代币数量
                {info?.hasStaked ? info.balance : '0.00'}
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
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {/* 质押逻辑 */ }}
                  className={getButtonClass('primary')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    质押
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {/* 赎回逻辑 */ }}
                  className={getButtonClass('secondary')}
                  disabled={!info?.hasStaked}
                >
                  <div className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    赎回
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {/* 领取收益逻辑 */ }}
                  className={getButtonClass('outline')}
                  disabled={!info?.hasStaked}
                >
                  <div className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    领取收益
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {/* 查看详情逻辑 */ }}
                  className={getButtonClass('outline')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    查看详情
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 如果用户未质押，显示质押提示 */}
        {!info?.hasStaked && !showActions && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>尚未质押，点击上方"操作"按钮开始质押</span>
            </div>
          </div>
        )}

        {/* 直接渲染 AaveAtokenForm，不再使用模态框 */}
        {showActions && (
          <div className="mt-4">
            <AaveAtokenForm scheme={scheme} />
          </div>
        )}
      </div>
    </>
  )
}