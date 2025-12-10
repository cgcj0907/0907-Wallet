'use client'

import { useState, useEffect } from "react";
import { convertToStkwaToken } from "@/app/chainInteraction/lib/aave";

interface AaveFormProps {
  scheme?: 'usdc' | 'usdt';
}

export default function AaveStkWatokenForm({ scheme = 'usdc' }: AaveFormProps) {
  const [tokenType, setTokenType] = useState<'usdc' | 'ausdc' | 'usdt' | 'ausdt'>(scheme === 'usdc' ? 'usdc' : 'usdt');
  const [amountIn, setAmountIn] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // 根据 scheme 设置默认 tokenType
  useEffect(() => {
    if (scheme === 'usdc') {
      setTokenType('usdc');
    } else if (scheme === 'usdt') {
      setTokenType('usdt');
    }
  }, [scheme]);

  // 将用户输入的字符串转换为 bigint（考虑6位小数）
  const parseAmountToBigInt = (amount: string): bigint => {
    if (!amount || amount === "") return 0n;
    
    // 对于稳定币（USDC/USDT），通常有6位小数
    const decimals = 6;
    const [whole, fraction = ""] = amount.split(".");
    
    const wholePart = BigInt(whole || "0") * 10n ** BigInt(decimals);
    const fractionPart = BigInt((fraction.padEnd(decimals, "0")).slice(0, decimals));
    
    return wholePart + fractionPart;
  };

  const handleSubmit = async () => {
    const keyPath = localStorage.getItem('currentAddressKeyPath');
    
    if (!keyPath) {
      setError("请先选择或创建钱包地址");
      setTimeout(() => setError(undefined), 3000);
      return;
    }
    
    if (!amountIn || Number(amountIn) <= 0) {
      setError("请输入有效的质押数量");
      setTimeout(() => setError(undefined), 3000);
      return;
    }
    
    if (!password) {
      setError("请输入钱包密码");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    setLoading(true);
    setError(undefined);
    setTxResult(null);

    try {
      const amountBigInt = parseAmountToBigInt(amountIn);
      
      const hash = await convertToStkwaToken(keyPath, password, amountBigInt, tokenType);

      setTxResult(String(hash));
      
      // 成功后清空表单
      setTimeout(() => {
        setAmountIn("");
        setPassword("");
      }, 3000);
      
    } catch (e: any) {
      console.error('质押到 stkwa 失败:', e);
      const message = e?.message || e?.toString?.() || '质押到 stkwa 失败';
      setError(String(message));
      setTimeout(() => setError(undefined), 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAmountIn("");
    setPassword("");
    setError(undefined);
    setTxResult(null);
    setShowInfo(false);
  };

  // 处理金额输入
  const handleAmountChange = (value: string) => {
    // 只允许数字和小数点
    const regex = /^[0-9]*\.?[0-9]*$/;
    if (regex.test(value) || value === "") {
      setAmountIn(value);
    }
  };

  // 根据 scheme 获取颜色
  const getColorClasses = () => {
    const baseColor = scheme === 'usdc' ? 'blue' : 'green';
    return {
      bgFrom: `from-${baseColor}-50`,
      bgTo: `to-${baseColor}-100`,
      border: `border-${baseColor}-200`,
      text: `text-${baseColor}-800`,
      accent: baseColor
    };
  };

  const colors = getColorClasses();

  // 获取代币显示名称
  const getTokenDisplayName = (token: string): string => {
    switch(token) {
      case 'usdc': return 'USDC';
      case 'ausdc': return 'aUSDC';
      case 'usdt': return 'USDT';
      case 'ausdt': return 'aUSDT';
      default: return 'USDC';
    }
  };

  // 获取代币类型选项
  const getTokenOptions = () => {
    if (scheme === 'usdc') {
      return [
        { value: 'usdc', label: 'USDC', description: '使用基础 USDC 质押' },
        { value: 'ausdc', label: 'aUSDC', description: '使用已质押的 aUSDC 质押' }
      ];
    } else {
      return [
        { value: 'usdt', label: 'USDT', description: '使用基础 USDT 质押' },
        { value: 'ausdt', label: 'aUSDT', description: '使用已质押的 aUSDT 质押' }
      ];
    }
  };

  const tokenOptions = getTokenOptions();

  return (
    <div className={`p-4 ${colors.bgFrom} ${colors.bgTo} rounded-xl border ${colors.border} mt-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-${colors.accent}-100 flex items-center justify-center`}>
            <div className={`w-5 h-5 rounded-full bg-${colors.accent}-500`}></div>
          </div>
          <div>
            <h3 className={`font-bold ${colors.text}`}>质押到 stkwaToken</h3>
            <p className="text-sm text-gray-600">将代币质押为 stkwaToken 获得额外收益</p>
          </div>
        </div>

      </div>

      {/* 内容区域 */}
      <div className="space-y-4">
        {/* 代币类型选择器 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择质押代币类型
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tokenOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTokenType(option.value as any)}
                className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center gap-1 ${tokenType === option.value 
                  ? `bg-${colors.accent}-50 border-${colors.accent}-300 ring-1 ring-${colors.accent}-200` 
                  : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <div className={`w-6 h-6 rounded-full ${option.value.startsWith('a') ? 'bg-purple-100' : `bg-${colors.accent}-100`} flex items-center justify-center`}>
                  <div className={`w-4 h-4 rounded-full ${option.value.startsWith('a') ? 'bg-purple-500' : `bg-${colors.accent}-500`}`}></div>
                </div>
                <div className="text-center">
                  <div className={`font-medium ${option.value.startsWith('a') ? 'text-purple-800' : `text-${colors.accent}-800`}`}>{option.label}</div>
                  <div className={`text-xs ${option.value.startsWith('a') ? 'text-purple-600' : `text-${colors.accent}-600`}`}>{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* stkwa 质押需知按钮 */}
        <button
          type="button"
          onClick={() => setShowInfo(v => !v)}
          className={`w-full flex items-center justify-between gap-2 p-3 rounded-lg border transition-all duration-200 ${showInfo ? `bg-${colors.accent}-50 border-${colors.accent}-300` : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full bg-${colors.accent}-100 flex items-center justify-center`}>
              <span className={`text-${colors.accent}-600 text-sm`}>i</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-800">stkwa 质押需知</div>
              <div className="text-xs text-gray-600">点击查看 stkwa 质押说明</div>
            </div>
          </div>
          <span className={`text-gray-400 ${showInfo ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* stkwa 质押需知提示信息 */}
        {showInfo && (
          <div className={`p-3 bg-${colors.accent}-50 border border-${colors.accent}-200 rounded-lg text-sm ${colors.text}`}>
            <div className="space-y-2">
              <div className="font-medium mb-2">关于 stkwaToken 质押：</div>
              <ul className="space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>将 USDC/aUSDC 或 USDT/aUSDT 质押为 stkwaToken</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>stkwaToken 可获得额外收益和治理权</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">🔄</span>
                  <span>可直接使用基础代币或已质押的 aToken</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">🎯</span>
                  <span>使用 aToken 质押无需额外授权</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⏱️</span>
                  <span>质押需要网络确认，请耐心等待</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 质押数量 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            质押数量 ({getTokenDisplayName(tokenType)})
          </label>
          <div className="relative">
            <input
              type="text"
              value={amountIn}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              className="w-full p-3 pl-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tokenType.startsWith('a') ? 'bg-purple-500' : `bg-${colors.accent}-500`}`}>
                  <span className="text-white text-xs font-bold">
                    {tokenType.startsWith('a') ? 'a' : '$'}
                  </span>
                </div>
                <span className={`font-medium ${tokenType.startsWith('a') ? 'text-purple-600' : `text-${colors.accent}-600`}`}>
                  {getTokenDisplayName(tokenType)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 钱包密码 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            钱包密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入钱包密码以确认交易"
            autoComplete="current-password"
            className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* 质押方式说明 */}
        <div className={`p-3 rounded-lg border ${tokenType.startsWith('a') ? 'border-purple-300 bg-purple-50' : `border-${colors.accent}-300 bg-${colors.accent}-50`}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-6 h-6 rounded-full ${tokenType.startsWith('a') ? 'bg-purple-100' : `bg-${colors.accent}-100`} flex items-center justify-center`}>
              {tokenType.startsWith('a') ? (
                <span className="text-purple-600 text-xs">a</span>
              ) : (
                <span className={`text-${colors.accent}-600 text-xs`}>$</span>
              )}
            </div>
            <span className={`text-sm font-medium ${tokenType.startsWith('a') ? 'text-purple-800' : colors.text}`}>
              {tokenType.startsWith('a') ? 'aToken 直接质押' : '基础代币质押'}
            </span>
          </div>
          <div className={`text-xs ${tokenType.startsWith('a') ? 'text-purple-600' : `text-${colors.accent}-600`}`}>
            {tokenType.startsWith('a') 
              ? '使用已质押的 aToken，无需额外授权，直接转换为 stkwaToken'
              : '使用基础代币，需要先进行授权操作'}
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠</span>
              {error}
            </div>
          </div>
        )}

        {/* 交易结果 */}
        {txResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <div className="font-medium mb-1 flex items-center gap-2">
              <span className="text-green-500">✓</span>
              质押到 stkwa 成功！
            </div>
            <div className="text-xs text-green-600 mb-2">
              交易已提交到网络，等待确认
            </div>
            <div className="mt-1 text-xs break-all bg-green-100 p-2 rounded">{txResult}</div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !amountIn || !password}
            className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 ${loading || !amountIn || !password
              ? 'bg-gray-300 cursor-not-allowed'
              : `bg-linear-to-r from-${colors.accent}-500 to-${colors.accent}-600 hover:from-${colors.accent}-600 hover:to-${colors.accent}-700 hover:shadow-lg active:scale-[0.98]`
              } text-white`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                处理中...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🔒</span>
                确认质押到 stkwa
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}