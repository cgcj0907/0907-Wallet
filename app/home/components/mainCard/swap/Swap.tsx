'use client'

import { useEffect, useRef, useState } from 'react';
import SelectToken from "../SelectToken";
import { getSwapDetails, sendSwapTransaction } from "@/app/chainInteraction/lib/swap";
import {
  ERC20TOKEN_LIST,
  DECIMALS,
  TOKEN_SYMBOL_MAP,
  ETHEREUM_TOKEN_ADDRESS
} from "@/app/networkManagement/lib/details";
import { parseUnits, formatUnits } from 'viem';
import { getPrice } from '@/app/chainInteraction/lib/priceFeed';

type Props = {
  address?: string,
  network?: string,
  setSwapOpen?: (value: boolean) => void,
};

// 费用信息接口
interface FeeInfo {
  zeroExFee?: {
    amount: string;
    token: string;
    type: string;
  } | null;
  integratorFee?: any;
  gasFee?: any;
}

interface QuoteDetails {
  buyAmount?: string;
  fees?: FeeInfo;
  totalNetworkFee?: string;
  minBuyAmount?: string;
}

export default function Swap({ address, network = 'mainnet', setSwapOpen }: Props) {
  const [amount, setAmount] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [inputToken, setInputToken] = useState<string | undefined>("ethereum");
  const [outputToken, setOutputToken] = useState<string | undefined>("ethereum");
  const [error, setError] = useState<string | undefined>(undefined);
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [swapping, setSwapping] = useState<boolean>(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [showSwapInfo, setShowSwapInfo] = useState<boolean>(false);
  const [showFeesInfo, setShowFeesInfo] = useState<boolean>(false);
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);
  const [ethPrice, setEthPrice] = useState<number>();
  const availableTokens = ERC20TOKEN_LIST[network!] ?? [];

  const quoteTimer = useRef<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentAddressKeyPath');
    if (!stored) {
      console.warn('No currentAddressKeyPath found in localStorage');
    }
  }, []);

  const getTokenDecimals = (token?: string) => {
    if (!token) {
      return 18;
    }
    return DECIMALS[token];
  };

  // 通过合约地址获取代币符号
  const getTokenSymbolByAddress = (address: string): string => {
    if (!address) return address;

    const lowercaseAddress = address.toLowerCase();

    // 从ETHEREUM_TOKEN_ADDRESS映射中查找代币标识符
    let tokenId = '';

    // 遍历映射查找对应的tokenId
    Object.entries(ETHEREUM_TOKEN_ADDRESS).forEach(([id, addr]) => {
      if (addr.toLowerCase() === lowercaseAddress) {
        tokenId = id;
      }
    });

    // 如果找到tokenId，从TOKEN_SYMBOL_MAP获取符号
    if (tokenId && TOKEN_SYMBOL_MAP[tokenId]) {
      return TOKEN_SYMBOL_MAP[tokenId];
    }

    // 特殊处理ETH地址（0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE）
    if (lowercaseAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return 'ETH';
    }

    // 常见代币地址的硬编码映射作为后备
    const commonTokens: Record<string, string> = {
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH', // WETH
      '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI',
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'AAVE',
      '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': 'STETH',
    };

    if (commonTokens[lowercaseAddress]) {
      return commonTokens[lowercaseAddress];
    }

    // 如果都不是，返回地址的缩写
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 通过合约地址获取代币标识符（用于获取小数位数）
  const getTokenIdByAddress = (address: string): string | null => {
    if (!address) return null;

    const lowercaseAddress = address.toLowerCase();

    // 从ETHEREUM_TOKEN_ADDRESS映射中查找代币标识符
    let tokenId = '';

    Object.entries(ETHEREUM_TOKEN_ADDRESS).forEach(([id, addr]) => {
      if (addr.toLowerCase() === lowercaseAddress) {
        tokenId = id;
      }
    });

    return tokenId || null;
  };

  const getOutputAmount = async (inToken?: string, outToken?: string, humanAmount?: string) => {
    if (!inToken || !outToken || !humanAmount) return undefined;

    const inDecimals = getTokenDecimals(inToken);
    const outDecimals = getTokenDecimals(outToken);

    let sellAmount: bigint;
    try {
      sellAmount = parseUnits(humanAmount, inDecimals);
    } catch (e) {
      console.error('[getOutputAmount] parseUnits failed', e);
      return undefined;
    }

    try {
      if (!address) {
        return;
      }

      const [quote, priceOfeth] = await Promise.all(
        [
          getSwapDetails(inToken, outToken, sellAmount, 1, toAddress ? toAddress : address),
          getPrice('ethereum', 'ethereum')
        ]
      )
      setEthPrice(priceOfeth);
      setQuoteDetails(quote);

      const rawBuy = (quote && (quote.buyAmount ?? quote.buyAmountWei ?? quote.buyAmountInWei)) || quote?.buyAmount;
      if (!rawBuy) {
        console.warn('[getOutputAmount] no buyAmount in quote', quote);
        return undefined;
      }
      const buyBigInt = typeof rawBuy === 'string' ? BigInt(rawBuy) : BigInt(rawBuy.toString());
      return formatUnits(buyBigInt, outDecimals);
    } catch (e) {
      console.error('[getOutputAmount] getSwapDetails error', e);
      return undefined;
    }
  };

  useEffect(() => {
    if (quoteTimer.current) {
      window.clearTimeout(quoteTimer.current);
      quoteTimer.current = null;
    }

    if (!inputToken || !outputToken) {
      setOutputAmount("");
      setQuoteDetails(null);
      setLoadingQuote(false);
      return;
    }

    const parsed = parseFloat(String(amount));
    if (!isFinite(parsed) || parsed <= 0) {
      setOutputAmount("");
      setQuoteDetails(null);
      setLoadingQuote(false);
      return;
    }

    setLoadingQuote(true);

    const timerId = window.setTimeout(async () => {
      try {
        const result = await getOutputAmount(inputToken, outputToken, amount);
        setOutputAmount(result ?? "");
        setError("");
      } catch (e) {
        console.error('[quote effect] error', e);
        setOutputAmount("");
        setQuoteDetails(null);
        setError("暂不支持该币对的兑换或获取报价失败");
        setTimeout(() => setError(undefined), 3000);
      } finally {
        setLoadingQuote(false);
      }
    }, 350);

    quoteTimer.current = timerId;

    return () => {
      if (quoteTimer.current) {
        window.clearTimeout(quoteTimer.current);
        quoteTimer.current = null;
      }
    };
  }, [inputToken, outputToken, amount]);

  const handleSwap = async () => {
    if (!inputToken || !outputToken) {
      setError("请选择输入和输出代币");
      setTimeout(() => setError(undefined), 3000);
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("请输入有效的交换数量");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    const keyPath = localStorage.getItem('currentAddressKeyPath') || "";
    if (!keyPath) {
      setError("请先选择或创建钱包地址");
      setTimeout(() => setError(undefined), 3000);
      return;
    }

    setSwapping(true);
    setTxResult(null);

    try {
      const inDecimals = getTokenDecimals(inputToken);
      let sellAmount: bigint;
      try {
        sellAmount = parseUnits(amount, inDecimals);
      } catch (e) {
        throw new Error('无法解析输入数量到代币最小单位');
      }

      // 使用toAddress或当前地址
      const recipientAddress = toAddress.trim() || address || '';
      if (!recipientAddress) {
        throw new Error('请填写接收地址或确保已连接钱包');
      }

      const hash = await sendSwapTransaction(
        keyPath,
        password,
        inputToken,
        outputToken,
        sellAmount,
        1,
        recipientAddress
      );
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
      setError("");

    } catch (e: any) {
      console.error('swap error:', e);
      const message = e?.message || e?.toString?.() || '交易失败';
      setError(String(message));
      setTimeout(() => setError(undefined), 6000);
    } finally {
      setSwapping(false);
    }
  };

  const handleCancel = () => {
    if (setSwapOpen) setSwapOpen(false);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && setSwapOpen) {
      setSwapOpen(false);
    }
  };

  // 格式化费用金额
  const formatFeeAmount = (amount: string, tokenAddress: string): string => {
    try {
      // 首先尝试通过地址获取代币标识符
      const tokenId = getTokenIdByAddress(tokenAddress);

      let decimals = 18; // 默认18位小数

      if (tokenId && DECIMALS[tokenId] !== undefined) {
        decimals = DECIMALS[tokenId];
      } else {
        // 如果找不到tokenId，尝试根据常见代币地址判断
        const lowercaseAddress = tokenAddress.toLowerCase();
        const commonTokenDecimals: Record<string, number> = {
          '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 18, // WETH
          '0x6b175474e89094c44da98b954eedeac495271d0f': 18, // DAI
          '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6,  // USDC
          '0xdac17f958d2ee523a2206206994597c13d831ec7': 6,  // USDT
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 18, // UNI
          '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 18, // AAVE
          '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': 18, // STETH
          '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 18, // ETH
        };

        if (commonTokenDecimals[lowercaseAddress] !== undefined) {
          decimals = commonTokenDecimals[lowercaseAddress];
        }
      }

      const amountBigInt = BigInt(amount);
      const formatted = formatUnits(amountBigInt, decimals);
      const num = parseFloat(formatted);

      // 根据数量大小决定显示精度
      if (num < 0.000001) {
        return num.toExponential(4);
      } else if (num < 0.01) {
        return num.toFixed(8);
      } else if (num < 1) {
        return num.toFixed(6);
      } else if (num < 1000) {
        return num.toFixed(4);
      } else {
        return num.toFixed(2);
      }
    } catch (e) {
      console.error('格式化费用金额失败:', e);
      return amount;
    }
  };

  // 格式化网络费用（ETH）
  const formatNetworkFee = (weiAmount: string): string => {
    try {
      const ethAmount = formatUnits(BigInt(weiAmount), 18);
      const num = parseFloat(ethAmount);
      let fee = num;
      if (ethPrice) {
        fee = num * ethPrice;
      }

      // 根据ETH数量决定显示精度
      if (fee < 0.0001) {
        return fee.toExponential(4);
      } else if (fee < 0.01) {
        return fee.toFixed(6);
      } else if (fee < 1) {
        return fee.toFixed(5);
      } else {
        return fee.toFixed(4);
      }
    } catch (e) {
      console.error('格式化网络费用失败:', e);
      return weiAmount;
    }
  };

  return (
    <>
      {/* 遮罩层 - 增加z-index */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleBackgroundClick}
      />

      {/* 弹窗容器 - 增加z-index确保在遮罩层之上 */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-sky-50 p-6 rounded-2xl shadow-2xl border border-blue-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* 标题栏 */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-blue-900">代币兑换</h3>
            <div className="flex items-center gap-2">
              {/* 兑换需知按钮 */}
              <button
                type="button"
                onClick={() => setShowSwapInfo(v => !v)}
                className="shrink-0 flex items-center gap-2 px-3 py-1 rounded-lg border border-sky-100 bg-white hover:bg-sky-50 text-sky-700 text-sm"
                title="兑换需知"
              >
                <i className="fa-solid fa-circle-exclamation"></i>
                兑换需知
              </button>

              {/* 关闭按钮 */}
              <button
                onClick={handleCancel}
                aria-label="关闭"
                className="text-sky-700 hover:text-sky-900 transition-colors text-2xl font-semibold bg-white bg-opacity-10 rounded-full w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          </div>

          {/* 兑换需知提示信息 */}
          {showSwapInfo && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              <div className="space-y-2">
                <p className="font-medium">兑换提示：</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>兑换汇率仅供参考，实际成交价格可能会有所波动</li>
                  <li>请确保输入正确的接收地址</li>
                  <li>请确保账户拥有足够的 USDC 支付手续费</li>
                  <li>交易需要一定时间确认，请耐心等待</li>
                  <li>实际到账金额可能因网络费用而略有不同</li>
                </ul>
              </div>
            </div>
          )}

          {/* 输入代币 - 增加relative和z-index确保下拉菜单显示 */}
          <div className="mb-4 relative z-50">
            <label className="block text-sm font-medium text-blue-800 mb-2">发送代币</label>
            <SelectToken
              availableTokens={availableTokens}
              address={address}
              network={network}
              token={inputToken}
              setToken={setInputToken}
            />
          </div>

          {/* 输出代币 - 增加relative和z-index确保下拉菜单显示 */}
          <div className="mb-4 relative z-30">
            <label className="block text-sm font-medium text-blue-800 mb-2">接收代币</label>
            <SelectToken
              availableTokens={availableTokens}
              address={address}
              network={network}
              token={outputToken}
              setToken={setOutputToken}
            />
          </div>

          {/* 交换数量 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-800 mb-2">发送数量</label>
            <div className="relative">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                className="w-full p-3 rounded-xl border border-blue-300 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                disabled={swapping}
              />
              {inputToken && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 font-medium">
                  {TOKEN_SYMBOL_MAP[inputToken]}
                </div>
              )}
            </div>
          </div>

          {/* 预计输出和费用信息 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-blue-800">预计接收</label>
              {quoteDetails && (
                <button
                  type="button"
                  onClick={() => setShowFeesInfo(v => !v)}
                  className="ml-auto shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 text-xs"
                  title="查看费用详情"
                  disabled={loadingQuote || swapping}
                >
                  <i className="fa-solid fa-coins"></i>
                  费用详情
                </button>
              )}
            </div>

            <div className="p-3 rounded-xl border border-blue-300 bg-white/80 backdrop-blur-sm min-h-12 flex items-center justify-between">
              <span className={`${loadingQuote ? 'text-blue-600' : 'text-blue-900'} font-medium`}>
                {loadingQuote ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    获取报价中...
                  </div>
                ) : outputAmount ? (

                  <span>{outputAmount}</span>


                ) : (
                  <span className="text-blue-400">—</span>
                )}
              </span>
              {outputToken && <span className="text-blue-600 text-sm font-medium">{TOKEN_SYMBOL_MAP[outputToken]}</span>}
            </div>

            {/* 费用信息详情 */}
            {showFeesInfo && quoteDetails && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <div className="space-y-2">
                  {/* 0x平台费用 */}
                  {quoteDetails.fees?.zeroExFee && (
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">0x 平台费用:</span>
                      <span className="font-medium">
                        {formatFeeAmount(quoteDetails.fees.zeroExFee.amount, quoteDetails.fees.zeroExFee.token)}
                        <span className="ml-1 text-blue-600">
                          {getTokenSymbolByAddress(quoteDetails.fees.zeroExFee.token)}
                        </span>
                      </span>
                    </div>
                  )}


                  <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
                    {quoteDetails.fees?.zeroExFee && (
                      <p>• 平台费用将从输出代币中扣除</p>
                    )}
                  </div>

                  {/* 网络费用 */}
                  {quoteDetails.totalNetworkFee && (
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">预估网络费用:</span>
                        <span className="font-medium">
                          {formatNetworkFee(quoteDetails.totalNetworkFee)}
                          <span className="ml-1 text-blue-600">{ethPrice ? 'USD' : 'ETH'}</span>
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
                        <p>• 网络费用以 USDC 通过 EIP-7702 和 EIP-4337 模式支付, 实际略低</p>
                      </div>
                    </div>
                  )}

                  {/* 集成商费用 */}
                  {quoteDetails.fees?.integratorFee && (
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">集成商费用:</span>
                      <span className="font-medium">
                        {formatFeeAmount(quoteDetails.fees.integratorFee.amount, quoteDetails.fees.integratorFee.token)}
                        <span className="ml-1 text-blue-600">
                          {getTokenSymbolByAddress(quoteDetails.fees.integratorFee.token)}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* 最小接收金额 */}
                  {quoteDetails.minBuyAmount && outputToken && (
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="text-blue-700">最小接收金额:</span>
                      <span className="font-medium">
                        {formatFeeAmount(quoteDetails.minBuyAmount, ETHEREUM_TOKEN_ADDRESS[outputToken] || '')}
                        <span className="ml-1 text-blue-600">{TOKEN_SYMBOL_MAP[outputToken]}</span>
                      </span>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* 接收地址 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              接收地址 <span className="text-blue-500 text-xs">(留空则发送到当前地址)</span>
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-3 rounded-xl border border-blue-300 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono text-sm"
              disabled={swapping}
            />
          </div>

          {/* 钱包密码 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入钱包密码"
              autoComplete="current-password"
              className="w-full p-3 rounded-xl border border-blue-300 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              disabled={swapping}
            />
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 交易结果 */}
          {txResult && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm break-all">
              <div className="font-medium mb-1">交易发送成功！</div>
              交易哈希: {txResult}

            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleSwap}
              disabled={swapping || loadingQuote}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 ${swapping || loadingQuote
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-95'
                } text-white`}
            >
              {swapping ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  交易处理中...
                </div>
              ) : loadingQuote ? (
                '获取报价中...'
              ) : (
                '确认交换'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}