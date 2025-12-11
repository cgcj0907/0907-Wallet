'use client'

import { useState, useEffect } from "react";
import { getLidoApr, getRewardsHistory } from "@/app/chainInteraction/lib/lido";
import LidoForm from "./LidoForm";



// 用户Lido质押详细信息接口
interface LidoUserInfo {
  hasStaked: boolean;
  hasRewards: boolean;
  balanceETH: string | null;
  shares: string | null;
  totalRewardsETH: string;
  totalRewardsUSD: string;
  averageApr: number;
  ratio: number;
  stethPriceETH: number | null;
  stethPriceUSD: number | null;
  rewardEvents: Array<{
    timestamp: number;
    amountETH: string | null;
    amountShares: string | null;
    txHash: string;
  }>;
  latestEventTimestamp: number | null;
}

interface LidoRealTimeData {
  apr: number;
  loading: boolean;
  error: string | null;
}

type Props = {
  address: string | undefined;

  tvl: string;
};

export default function LidoCard({ address, tvl }: Props) {
  const [lidoRealTimeData, setLidoRealTimeData] = useState<LidoRealTimeData>({
    apr: 0,
    loading: true,
    error: null
  });
  const [lidoUserInfo, setLidoUserInfo] = useState<LidoUserInfo | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // 格式化时间戳为相对时间
  const formatRelativeTime = (timestamp: number | null): string => {
    if (!timestamp) return '未知时间';
    
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    return `${Math.floor(diff / 2592000)}个月前`;
  };

  // 格式化数字
  const formatNumber = (num: string | number | null, decimals: number = 4): string => {
    if (!num) return '0.0000';
    
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return value.toFixed(decimals);
  };

  // 获取Lido实时APR
  useEffect(() => {
    const fetchLidoData = async () => {
      try {
        // 获取APR
        const apr = await getLidoApr();
        
        setLidoRealTimeData({
          apr,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('获取Lido数据失败:', error);
        setLidoRealTimeData(prev => ({
          ...prev,
          loading: false,
          error: '获取数据失败'
        }));
      }
    };

    fetchLidoData();
  }, []);

  // 获取用户Lido质押信息
  useEffect(() => {
    const fetchUserLidoInfo = async () => {
      if (!address) return;

      try {
        const rewardsData = await getRewardsHistory(address);
        
        setLidoUserInfo({
          hasStaked: !!rewardsData.userBalance.balanceETH,
          hasRewards: rewardsData.hasRewards,
          balanceETH: rewardsData.userBalance.balanceETH,
          shares: rewardsData.userBalance.shares,
          totalRewardsETH: rewardsData.totalRewardsETH,
          totalRewardsUSD: rewardsData.totalRewardsUSD,
          averageApr: rewardsData.averageApr,
          ratio: rewardsData.ratio,
          stethPriceETH: rewardsData.stethPriceETH,
          stethPriceUSD: rewardsData.stethPriceUSD,
          rewardEvents: rewardsData.rewardEvents,
          latestEventTimestamp: rewardsData.userBalance.latestEventTimestamp
        });
      } catch (error) {
        console.error('获取用户Lido信息失败:', error);
      }
    };

    fetchUserLidoInfo();
  }, [address]);

  if (lidoRealTimeData.loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <span>加载实时数据...</span>
      </div>
    );
  }

  if (lidoRealTimeData.error) {
    return (
      <div className="text-sm text-red-600">
        <i className="fa-solid fa-exclamation-triangle"></i>
        <span> {lidoRealTimeData.error}</span>
      </div>
    );
  }

  const items = [];
  
  // 汇率和价格信息
  items.push(
    <div key="price" className="mb-2 p-2 bg-linear-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-amber-600 font-medium">汇率:</span>
        <span className="font-bold text-amber-700">
          1 ETH = {lidoUserInfo?.ratio ?formatNumber(lidoUserInfo.ratio, 4) : '1.0000'} stETH
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-amber-600 font-medium">价格:</span>
        <div className="text-right">
          <div className="font-bold text-green-700">
            ${lidoUserInfo?.stethPriceUSD ? formatNumber(lidoUserInfo.stethPriceUSD, 2) : '0.00'}
          </div>
        </div>
      </div>
    </div>
  );

  // 用户质押信息（如果有）
  if (lidoUserInfo?.hasStaked) {
    items.push(
      <div key="user-stake" className="mb-2 p-2 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-green-700 font-medium">您的质押:</span>
          <span className="font-bold text-green-800">
            {formatNumber(lidoUserInfo.balanceETH, 4)} ETH
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-700 font-medium">您的份额:</span>
          <span className="font-bold text-green-800">
            {formatNumber(lidoUserInfo.shares, 2)}
          </span>
        </div>
        {lidoUserInfo.latestEventTimestamp && (
          <div className="text-xs text-green-600 mt-1">
            <i className="fa-solid fa-clock"></i> 最近更新: {formatRelativeTime(lidoUserInfo.latestEventTimestamp)}
          </div>
        )}
      </div>
    );
    
    // 如果有奖励信息
    if (lidoUserInfo.hasRewards) {
      items.push(
        <div key="rewards" className="mb-2 p-2 bg-linear-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-yellow-700 font-medium">累计奖励:</span>
            <span className="font-bold text-yellow-800">
              {lidoUserInfo.totalRewardsETH} ETH
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-yellow-600">
            <span>≈ ${formatNumber(lidoUserInfo.totalRewardsUSD, 6)}</span>
            <span>平均APR: {formatNumber(lidoUserInfo.averageApr, 2)}%</span>
          </div>
          {lidoUserInfo.rewardEvents.length > 0 && (
            <div className="text-xs text-yellow-700 mt-1">
              <i className="fa-solid fa-gift"></i> 奖励事件: {lidoUserInfo.rewardEvents.length}次
            </div>
          )}
        </div>
      );
      
      // 显示最近的奖励事件
      if (lidoUserInfo.rewardEvents.length > 0) {
        const recentReward = lidoUserInfo.rewardEvents[lidoUserInfo.rewardEvents.length - 1];
        items.push(
          <div key="recent-reward" className="mb-2 p-2 bg-linear-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-800 mb-1">
              <i className="fa-solid fa-gift"></i>
              <span>最近奖励</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-700">金额:</span>
              <span className="font-bold text-purple-800">
                {formatNumber(recentReward.amountETH, 18)} ETH
              </span>
            </div>
            {recentReward.txHash && (
              <div className="text-xs text-purple-600 mt-1 truncate">
                TX: {recentReward.txHash.slice(0, 8)}...{recentReward.txHash.slice(-6)}
              </div>
            )}
          </div>
        );
      }
    }
  }

  // 实时APR信息
  items.push(
    <div key="apr-info" className="mt-2 p-2 bg-linear-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-blue-700">实时APR:</span>
        </div>
        <span className="text-lg font-bold text-green-700">
          {formatNumber(lidoRealTimeData.apr, 2)}%
        </span>
      </div>
      <div className="text-xs text-blue-600 mt-1">
        基于7日移动平均计算
      </div>
    </div>
  );

  // 返回完整的Lido卡片内容
  return (
    <>
      <div className="space-y-2">
        {/* 当前APR和TVL显示 */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-amber-700">
              {formatNumber(lidoRealTimeData.apr, 2)}%
            </div>
            <div className="text-xs text-amber-600">7日平均APR</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-700">{tvl}</div>
            <div className="text-xs text-amber-600">实时锁仓量</div>
          </div>
        </div>

        {/* 详细数据 */}
        {items}

        {/* 分类和风险信息 */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-amber-600 mb-1">
            <span>分类</span>
            <span className="font-medium text-amber-800">Staking</span>
          </div>
          <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500"
              style={{ width: '30%' }}
            ></div>
          </div>
        </div>

        {/* 开始质押按钮 */}
        <button 
          onClick={() => setShowModal(true)}
          className="w-full py-2 rounded-lg bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium transition-all duration-200 active:scale-95 text-sm"
        >
          开始质押
        </button>
      </div>

      {/* 质押弹窗 */}
      {showModal && (
        <LidoForm 
          onClose={() => setShowModal(false)} 
          ratio={lidoUserInfo?.ratio || 1}
        />
      )}
    </>
  );
};