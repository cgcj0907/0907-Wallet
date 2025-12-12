'use client'

import { useState, useEffect } from "react";
import { formatUnits } from "viem";
import { convertToStkwaToken, getRewards, caculateRewards, redeemStkwaToken, cooldown } from "@/app/chainInteraction/lib/aave";
import { AAVE_REWARDS_TOKEN } from "@/app/networkManagement/lib/details";


interface AaveFormProps {
  address: string | undefined;
  network: string | null;
  info: AaveTokenInfo | null;
  scheme?: 'usdc' | 'usdt';
  mode: string;
}

interface RewardItem {
  tokenAddress: string;
  amount: string; // 原始数量（字符串格式）
  symbol: string;
  decimals: number;

}

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


export default function AaveStkWatokenForm({ address, network, info, scheme = 'usdc', mode }: AaveFormProps) {
  const [tokenType, setTokenType] = useState<'usdc' | 'ausdc' | 'usdt' | 'ausdt'>(scheme === 'usdc' ? 'usdc' : 'usdt');
  const [amountIn, setAmountIn] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // 奖励相关状态
  const [rewardsData, setRewardsData] = useState<RewardItem[]>([]);
  const [loadingRewards, setLoadingRewards] = useState<boolean>(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [claimingAllRewards, setClaimingAllRewards] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<any>(null);

  // 根据 scheme 设置默认 tokenType
  useEffect(() => {
    if (scheme === 'usdc') {
      setTokenType('usdc');
    } else if (scheme === 'usdt') {
      setTokenType('usdt');
    }
  }, [scheme]);

  // 初始化时自动获取奖励
  useEffect(() => {
    if (mode === 'getRewards' && address) {
      handleCalculateRewards();
    }
  }, [mode, address, scheme]);



  // 计算奖励
  const handleCalculateRewards = async () => {
    if (!address) {
      setRewardError("请先连接钱包");
      return;
    }

    setLoadingRewards(true);
    setRewardError(null);
    setRewardsData([]);

    try {
      const token = scheme === 'usdc' ? 'stkwausdc' : 'stkwausdt';
      const result = await caculateRewards(address, token);

      // 解析返回的结果
      // 根据之前的代码，result.result 应该是 [rewardTokens[], rewardAmounts[]]
      const [rewardTokens, rewardAmounts] = result as [string[], bigint[]];

      if (!rewardTokens || rewardTokens.length === 0) {
        setRewardsData([]);
        return;
      }

      // 获取每个代币的详细信息
      const rewardsPromises = rewardTokens.map(async (tokenAddress, index) => {

        const [symbol, decimals] = AAVE_REWARDS_TOKEN[tokenAddress] ?? ["UNKNOWN", 18];
        const amount = formatUnits(rewardAmounts[index], decimals);


        return {
          tokenAddress,
          amount: amount,
          symbol,
          decimals,

        };
      });

      const rewards = await Promise.all(rewardsPromises);
      console.log(rewards)
      setRewardsData(rewards);

    } catch (error: any) {
      console.error('计算奖励失败:', error);
      setRewardError(error.message || '计算奖励失败');
    } finally {
      setLoadingRewards(false);
    }
  };

  // 领取单个奖励
  const handleClaimReward = async (reward: RewardItem) => {
    const keyPath = localStorage.getItem('currentAddressKeyPath');

    if (!keyPath) {
      setError("请先选择或创建钱包地址");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    if (!password) {
      setError("请输入钱包密码");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    setClaimingReward(reward.tokenAddress);
    setRewardError(null);
    setClaimSuccess(null);

    try {

      const token = scheme === 'usdc' ? 'stkwausdc' : 'stkwausdt';

      const result = await getRewards(address!, token);
      const txHash = result || '模拟交易哈希';

      setClaimSuccess(txHash);

      // 领取成功后重新计算奖励
      setTimeout(() => {
        handleCalculateRewards();
      }, 2000);

    } catch (error: any) {
      console.error('领取奖励失败:', error);
      setRewardError(error.message || '领取奖励失败');
    } finally {
      setClaimingReward(null);
    }
  };

  // 领取所有奖励
  const handleClaimAllRewards = async () => {
    const keyPath = localStorage.getItem('currentAddressKeyPath');

    if (!keyPath) {
      setError("请先选择或创建钱包地址");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    if (!password) {
      setError("请输入钱包密码");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    if (rewardsData.length === 0) {
      setRewardError("没有可领取的奖励");
      return;
    }

    setClaimingAllRewards(true);
    setRewardError(null);
    setClaimSuccess(null);

    try {
      const token = scheme === 'usdc' ? 'stkwausdc' : 'stkwausdt';

      // 这里调用真正的批量领取函数
      // 暂时使用模拟的 getRewards 函数
      const result = await getRewards(address!, token);
      const txHash = result || '模拟交易哈希';

      setClaimSuccess(txHash);

      // 领取成功后重新计算奖励
      setTimeout(() => {
        handleCalculateRewards();
      }, 2000);

    } catch (error: any) {
      console.error('批量领取奖励失败:', error);
      setRewardError(error.message || '批量领取奖励失败');
    } finally {
      setClaimingAllRewards(false);
    }
  };

  // 在 handleRedeem 函数后面添加以下代码

  // 处理冷却期操作
  const handleCooldown = async () => {
    const keyPath = localStorage.getItem('currentAddressKeyPath');

    if (!keyPath) {
      setError("请先选择或创建钱包地址");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    if (!info?.stkwatokenBalance || Number(info.stkwatokenBalance) <= 0) {
      setError("没有可启动冷却期的 stkwaToken");
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
      // 注意：cooldown 函数只需要 keyPath, password 和 token
      // amountOut 参数在 cooldown 函数中未使用，但我们传递 0n
      const result = await cooldown(keyPath, password, scheme);

      setTxResult(String(result));

      // 成功后清空密码
      setTimeout(() => {
        setPassword("");
      }, 3000);

    } catch (e: any) {
      console.error('启动冷却期失败:', e);
      const message = e?.message || e?.toString?.() || '启动冷却期失败';
      setError(String(message));
      setTimeout(() => setError(undefined), 6000);
    } finally {
      setLoading(false);
    }
  };

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

  const handleStakeSubmit = async () => {
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
            const storeKey = `pending_hashes_${network}_${address}`
      if (hash) {
        // 1. 先读 localStorage
        const saved = localStorage.getItem(storeKey);
        let pending: string[] = [];

        try {
          pending = saved ? JSON.parse(saved) : [];
        } catch {
          pending = [];
        }

        // 2. 加进去（去重）
        const updated = [...new Set([...pending, hash])];
        // 3. 写回 localStorage
        localStorage.setItem(storeKey, JSON.stringify(updated));
      }

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



  // 在现有状态后添加赎回相关函数
  const handleRedeem = async () => {
    const keyPath = localStorage.getItem('currentAddressKeyPath');

    if (!keyPath) {
      setError("请先选择或创建钱包地址");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    if (!amountIn || Number(amountIn) <= 0) {
      setError("请输入有效的赎回数量");
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

      // 注意：这里需要调用 redeemStkwaToken 函数
      // 参数：keyPath, password, amountOut, token
      const hash = await redeemStkwaToken(keyPath, password, amountBigInt, scheme);

      setTxResult(String(hash));

      // 成功后清空表单
      setTimeout(() => {
        setAmountIn("");
        setPassword("");
      }, 3000);

    } catch (e: any) {
      console.error('赎回 stkwaToken 失败:', e);
      const message = e?.message || e?.toString?.() || '赎回 stkwaToken 失败';
      setError(String(message));
      setTimeout(() => setError(undefined), 6000);
    } finally {
      setLoading(false);
    }
  };
  // 处理金额输入
  const handleAmountChange = (value: string) => {
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
    switch (token) {
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
    <div className="space-y-6 ">
      {mode === 'stake' &&
        <>
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
                    className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center gap-1 hover:shadow-md ${tokenType === option.value
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
              className={`w-full flex items-center justify-between gap-2 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${showInfo ? `bg-${colors.accent}-50 border-${colors.accent}-300` : 'bg-white border-gray-200 hover:bg-gray-50'}`}
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
              <span className={`text-gray-400 transition-transform duration-200 ${showInfo ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* stkwa 质押需知提示信息 */}
            {showInfo && (
              <div className={`p-3 bg-${colors.accent}-50 border border-${colors.accent}-200 rounded-lg text-sm ${colors.text} shadow-inner`}>
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
                  className="w-full p-3 pl-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow hover:shadow-sm"
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
              <div className="mt-1 text-xs text-gray-500 flex justify-between">
                <span>可用余额:</span>
                <span className="font-medium">
                  {tokenType.startsWith('a') ? (info?.atokenBalance || '0.00') : (info?.tokenBalance || '0.00')}
                </span>
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
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow hover:shadow-sm"
                disabled={loading}
              />
            </div>

            {/* 质押方式说明 */}
            <div className={`p-3 rounded-lg border shadow-sm transition-shadow hover:shadow-md ${tokenType.startsWith('a') ? 'border-purple-300 bg-purple-50' : `border-${colors.accent}-300 bg-${colors.accent}-50`}`}>
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
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠</span>
                  {error}
                </div>
              </div>
            )}

            {/* 交易结果 */}
            {txResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm shadow-sm">
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
                onClick={handleStakeSubmit}
                disabled={loading || !amountIn || !password}
                className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${loading || !amountIn || !password
                  ? 'bg-gray-300 cursor-not-allowed'
                  : `bg-linear-to-r from-${colors.accent}-500 to-${colors.accent}-600 hover:from-${colors.accent}-600 hover:to-${colors.accent}-700 active:scale-[0.98]`
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
        </>
      }

      {/* 在 mode === 'stake' 部分后面，mode === 'getRewards' 部分前面添加以下代码 */}

      {mode === 'redeem' &&
        <div className="space-y-6">
          {/* 标题区域 */}
          <div className={`p-4 rounded-lg bg-linear-to-r ${colors.bgFrom} ${colors.bgTo} border ${colors.border} shadow-sm`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className={`text-xl font-bold ${colors.text}`}>🔄</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">赎回 stkwaToken</h3>
                <p className="text-sm text-gray-600 mt-1">
                  将 {scheme === 'usdc' ? 'stkwaUSDC' : 'stkwaUSDT'} 赎回为 {scheme === 'usdc' ? 'USDC' : 'USDT'}
                </p>
              </div>
            </div>
          </div>

          {/* 赎回说明 */}
          <div className={`p-4 rounded-lg border ${colors.border} ${colors.bgFrom} bg-opacity-30 shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-${colors.accent}-600`}>💡</span>
              <h5 className="font-medium text-gray-800">赎回说明</h5>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                <span>赎回需要将 stkwaToken 兑换回对应的基础代币</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                <span>赎回操作需要网络 Gas 费用</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                <span>赎回的代币将直接转入您的钱包</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                <span>赎回可能需要一定的处理时间</span>
              </li>
            </ul>
          </div>

          {/* 当前余额信息 */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">当前 stkwaToken 余额 : {info?.stkwatokenBalance}</div>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">{info?.stkwatokenBalance || '--.--'}</div>
            <div className="text-xs text-gray-500">≈ ${info?.userAssets || '--.--'}</div>
          </div>

          {/* 赎回数量输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              赎回数量 ({scheme === 'usdc' ? 'stkwaUSDC' : 'stkwaUSDT'})
            </label>
            <div className="relative">
              <input
                type="text"
                value={amountIn}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                className="w-full p-3 pl-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-shadow hover:shadow-sm"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-red-500`}>
                    <span className="text-white text-xs font-bold">r</span>
                  </div>
                  <span className={`font-medium text-red-600`}>
                    {scheme === 'usdc' ? 'stkwaUSDC' : 'stkwaUSDT'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>可用余额:</span>
              <span className="font-medium">{info?.stkwatokenBalance || '0.00'}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setAmountIn("25")}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setAmountIn("50")}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setAmountIn("75")}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setAmountIn("100")}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                100%
              </button>
            </div>
          </div>

          {/* 赎回后预估收益 */}
          {amountIn && Number(amountIn) > 0 && (
            <div className={`p-4 rounded-lg border ${colors.border} bg-white shadow-sm`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full ${colors.bgFrom} flex items-center justify-center`}>
                  <span className={`text-${colors.accent}-600`}>📈</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">赎回预估</div>
                  <div className="text-xs text-gray-600">根据当前汇率计算</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">赎回数量</span>
                  <span className="font-medium text-gray-800">
                    {amountIn} {scheme === 'usdc' ? 'stkwaUSDC' : 'stkwaUSDT'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">预估获得</span>
                  <span className="font-bold text-green-600">
                    {amountIn} {scheme === 'usdc' ? 'USDC' : 'USDT'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                注：实际到账金额可能因汇率波动略有差异
              </div>
            </div>
          )}

          {/* 钱包密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              钱包密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入钱包密码以确认赎回交易"
              autoComplete="current-password"
              className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-shadow hover:shadow-sm"
              disabled={loading}
            />
          </div>

          {/* 赎回风险提示 */}
          <div className={`p-4 rounded-lg border border-amber-200 bg-amber-50 shadow-sm`}>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-amber-600">⚠️</span>
              </div>
              <div>
                <div className="font-medium text-amber-800 mb-1">赎回前请注意</div>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>赎回后，您将不再享受 stkwaToken 的奖励收益</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>赎回操作可能需要等待处理时间</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>请确认网络状况良好再执行赎回</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠</span>
                {error}
              </div>
            </div>
          )}

          {/* 交易结果 */}
          {txResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm shadow-sm">
              <div className="font-medium mb-1 flex items-center gap-2">
                <span className="text-green-500">✓</span>
                赎回请求已提交！
              </div>
              <div className="text-xs text-green-600 mb-2">
                交易已提交到网络，等待确认
              </div>
              <div className="mt-1 text-xs break-all bg-green-100 p-2 rounded">{txResult}</div>
            </div>
          )}

          {/* 赎回操作按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleRedeem}
              disabled={loading || !amountIn || !password}
              className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${loading || !amountIn || !password
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.98]'
                } text-white`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  赎回处理中...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>🔄</span>
                  确认赎回操作
                </div>
              )}
            </button>
          </div>
        </div>
      }

      {mode === 'getRewards' &&
        <div className="space-y-6">
          {/* 标题区域 */}
          <div className={`p-4 rounded-lg bg-linear-to-r ${colors.bgFrom} ${colors.bgTo} border ${colors.border} shadow-sm`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className={`text-xl font-bold ${colors.text}`}>🎁</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">stkwa 收益奖励</h3>
                <p className="text-sm text-gray-600 mt-1">
                  查看您在 {scheme === 'usdc' ? 'stkwaUSDC' : 'stkwaUSDT'} 中积累的奖励
                </p>
              </div>
            </div>
          </div>

          {/* 钱包密码输入（领取时需要） */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                钱包密码（领取时需要）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入钱包密码以领取奖励"
                autoComplete="current-password"
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow hover:shadow-sm"
                disabled={loadingRewards}
              />
            </div>

            {/* 奖励信息展示区 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-md font-medium text-gray-800">可用奖励</h4>
                  <p className="text-sm text-gray-600">基于当前质押份额计算的奖励</p>
                </div>
                <button
                  onClick={handleCalculateRewards}
                  disabled={loadingRewards}
                  className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow ${loadingRewards
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : `bg-${colors.accent}-100 text-${colors.accent}-700 hover:bg-${colors.accent}-200`} 
                    transition-colors duration-200 flex items-center gap-2`}
                >
                  {loadingRewards ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      刷新中...
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      刷新奖励
                    </>
                  )}
                </button>
              </div>

              {/* 奖励加载状态 */}
              {loadingRewards && (
                <div className="py-8 flex flex-col items-center justify-center gap-3 bg-white rounded-lg shadow-inner">
                  <div className={`w-12 h-12 border-4 border-${colors.accent}-200 border-t-${colors.accent}-600 rounded-full animate-spin`} />
                  <p className={`text-${colors.accent}-600 font-medium`}>正在获取奖励数据...</p>
                  <p className="text-sm text-gray-500">请稍候，正在查询链上数据</p>
                </div>
              )}

              {/* 无奖励状态 */}
              {!loadingRewards && rewardsData.length === 0 && (
                <div className={`py-8 text-center rounded-lg border-2 border-dashed ${colors.border} bg-white shadow-sm`}>
                  <div className={`w-16 h-16 rounded-full ${colors.bgFrom} flex items-center justify-center mx-auto mb-4 shadow-inner`}>
                    <span className="text-2xl">📭</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">暂无可用奖励</h4>
                  <p className="text-gray-600 mb-4 max-w-sm mx-auto">
                    当前账户在 {scheme === 'usdc' ? 'stkwaUSDC' : 'stkwaUSDT'} 中没有可领取的奖励
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• 奖励需要质押资产来积累</p>
                    <p>• 奖励会在每个区块中自动计算</p>
                    <p>• 定期检查以获取最新奖励</p>
                  </div>
                </div>
              )}

              {/* 奖励列表 */}
              {!loadingRewards && rewardsData.length > 0 && (
                <div className="space-y-3">
                  <div className="gap-4">
                    {rewardsData.map((reward, index) => (
                      <div
                        key={index}
                        className={`w-full p-4 rounded-lg border ${colors.border} bg-white hover:shadow-md transition-shadow duration-200`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col  gap-3">

                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {reward.symbol}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              代币地址:
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {reward.tokenAddress}
                            </div>

                          </div>

                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">可领取数量</span>
                            <span className="font-semibold text-lg text-gray-800">
                              {reward.amount}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleClaimReward(reward)}
                              disabled={claimingReward === reward.tokenAddress || !password}
                              className={`w-full py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md ${claimingReward === reward.tokenAddress
                                ? `bg-${colors.accent}-300 cursor-wait`
                                : password
                                  ? `bg-linear-to-r from-${colors.accent}-500 to-${colors.accent}-600 hover:from-${colors.accent}-600 hover:to-${colors.accent}-700`
                                  : 'bg-gray-300 cursor-not-allowed'
                                } text-white`}
                            >
                              {claimingReward === reward.tokenAddress ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  领取中...
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <span>🎯</span>
                                  立即领取
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 批量领取按钮 */}
                  {rewardsData.length > 1 && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleClaimAllRewards}
                        disabled={claimingAllRewards || !password}
                        className={`w-full py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md ${claimingAllRewards
                          ? 'bg-gray-300 cursor-not-allowed'
                          : password
                            ? 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                            : 'bg-gray-300 cursor-not-allowed'
                          } text-white`}
                      >
                        {claimingAllRewards ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            批量领取中...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">🎁</span>
                            一键领取所有奖励 ({rewardsData.length} 种)
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 领取说明 */}
              {!loadingRewards && rewardsData.length > 0 && (
                <div className={`mt-6 p-4 rounded-lg border ${colors.border} ${colors.bgFrom} bg-opacity-30 shadow-sm`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-${colors.accent}-600`}>💡</span>
                    <h5 className="font-medium text-gray-800">奖励领取说明</h5>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                      <span>奖励会根据您的质押份额随时间累积</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                      <span>领取奖励需要支付网络 Gas 费用</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                      <span>奖励会自动转入您的钱包地址</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                      <span>定期领取奖励以最大化收益</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* 错误信息 */}
            {rewardError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-red-800">获取奖励失败</h5>
                    <p className="text-sm text-red-600 mt-1">{rewardError}</p>
                  </div>
                </div>
                <button
                  onClick={handleCalculateRewards}
                  className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  重试获取奖励
                </button>
              </div>
            )}

            {/* 领取成功提示 */}
            {claimSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600">✅</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-green-800">奖励领取成功！</h5>
                    <p className="text-sm text-green-600 mt-1">
                      奖励已发送到您的钱包地址
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      }


      {mode === 'cooldown' &&
        <div className="space-y-6">
          {/* 标题区域 */}
          <div className={`p-4 rounded-lg bg-linear-to-r ${colors.bgFrom} ${colors.bgTo} border ${colors.border} shadow-sm`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className={`text-xl font-bold ${colors.text}`}>❄️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">启动冷却期</h3>
                <p className="text-sm text-gray-600 mt-1">
                  为 {scheme === 'usdc' ? 'stkwaUSDC' : 'stkwaUSDT'} 启动冷却期以准备赎回
                </p>
              </div>
            </div>
          </div>

          {/* 冷却期说明 */}
          <div className={`p-4 rounded-lg border ${colors.border} ${colors.bgFrom} bg-opacity-30 shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-${colors.accent}-600`}>⏱️</span>
              <h5 className="font-medium text-gray-800">什么是冷却期？</h5>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                <span>冷却期是赎回 stkwaToken 的必要步骤</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                <span>启动冷却期后，需要等待一段时间才能进行赎回操作</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                <span>冷却期通常为 7-10 天（具体时间请参考合约说明）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`text-${colors.accent}-500 mt-0.5`}>•</span>
                <span>冷却期结束后，您可以在指定时间内进行赎回操作</span>
              </li>
            </ul>
          </div>

          {/* 当前余额信息 */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">当前 stkwaToken 余额</div>
              <div className={`text-sm font-medium text-${colors.accent}-600`}>
                {scheme === 'usdc' ? 'stkwaUSDC' : 'stkwaUSDT'}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">{info?.stkwatokenBalance || '--.--'}</div>
            <div className="text-xs text-gray-500">≈ ${info?.userAssets || '--.--'}</div>
          </div>

          {/* 冷却期状态显示 */}
          <div className={`p-4 rounded-lg border ${colors.border} bg-white shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${colors.bgFrom} flex items-center justify-center`}>
                <span className={`text-${colors.accent}-600`}>🔄</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">冷却期状态</div>
                <div className="text-xs text-gray-600">查看当前冷却期状态</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">冷却期状态</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${info?.hasStaked ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {info?.hasStaked ? '已质押' : '未质押'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">可启动冷却期</span>
                <span className="text-sm font-medium text-green-600">
                  {info?.stkwatokenBalance && Number(info.stkwatokenBalance) > 0 ? '是' : '否'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">冷却期持续时间</span>
                <span className="text-sm font-medium text-gray-800">7-10 天</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">ℹ️</span>
                <div className="text-sm text-amber-700">
                  注意：冷却期启动后无法取消，请确认后再操作
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
              placeholder="输入钱包密码以启动冷却期"
              autoComplete="current-password"
              className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow hover:shadow-sm"
              disabled={loading}
            />
          </div>

          {/* 操作注意事项 */}
          <div className={`p-4 rounded-lg border border-blue-200 bg-blue-50 shadow-sm`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-600">📋</span>
              </div>
              <div>
                <div className="font-medium text-blue-800 mb-2">操作前请确认</div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>您确实需要在冷却期结束后赎回 stkwaToken</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>冷却期启动后，需要等待指定时间才能赎回</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>冷却期内无法取消操作</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>请确保网络状况良好</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠</span>
                {error}
              </div>
            </div>
          )}

          {/* 交易结果 */}
          {txResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm shadow-sm">
              <div className="font-medium mb-1 flex items-center gap-2">
                <span className="text-green-500">✅</span>
                冷却期启动成功！
              </div>
              <div className="text-xs text-green-600 mb-2">
                冷却期已启动，请在冷却期结束后进行赎回操作
              </div>
              <div className="mt-1 text-xs break-all bg-green-100 p-2 rounded">{txResult}</div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCooldown}
              disabled={loading || !password || !info?.stkwatokenBalance || Number(info.stkwatokenBalance) <= 0}
              className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${loading || !password || !info?.stkwatokenBalance || Number(info.stkwatokenBalance) <= 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : `bg-linear-to-r from-${colors.accent}-500 to-${colors.accent}-600 hover:from-${colors.accent}-600 hover:to-${colors.accent}-700 active:scale-[0.98]`
                } text-white`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  启动中...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>❄️</span>
                  启动冷却期
                </div>
              )}
            </button>
          </div>

          {/* 冷却期后步骤提示 */}
          {txResult && (
            <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-blue-500">📋</span>
                冷却期后操作步骤
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-3 p-2 rounded bg-white">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">1</div>
                  <span>等待冷却期结束（通常 7-10 天）</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-white">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">2</div>
                  <span>冷却期结束后返回赎回页面</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-white">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">3</div>
                  <span>执行赎回操作获取您的代币</span>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    </div>
  );
}