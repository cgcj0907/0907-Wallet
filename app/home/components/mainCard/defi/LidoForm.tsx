'use client'

import { useState, useEffect } from "react";
import { submitToLido } from "@/app/chainInteraction/lib/lido";

interface LidoFormProps {
  onClose: () => void;
  ratio: number;
}

export default function LidoForm({ onClose, ratio }: LidoFormProps) {
  const [amountIn, setAmountIn] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // 处理键盘ESC关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
      const hash = await submitToLido(keyPath, password, amountIn);
      setTxResult(String(hash));
      
    } catch (e: any) {
      console.error('质押失败:', e);
      const message = e?.message || e?.toString?.() || '质押失败';
      setError(String(message));
      setTimeout(() => setError(undefined), 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    setAmountIn("");
    setPassword("");
    setError(undefined);
    setTxResult(null);
    setShowInfo(false);
  };

  // 处理背景点击关闭
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  // 处理金额输入
  const handleAmountChange = (value: string) => {
    // 只允许数字和小数点
    const regex = /^[0-9]*\.?[0-9]*$/;
    if (regex.test(value) || value === "") {
      setAmountIn(value);
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleBackgroundClick}
      />

      {/* 弹窗容器 - 适配父组件的 max-w-md */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-linear-to-br from-white to-amber-50 rounded-2xl shadow-2xl border border-amber-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* 标题栏 */}
          <div className="sticky top-0 bg-white border-b border-amber-200 p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-r from-amber-400 to-yellow-400 flex items-center justify-center">
                  <img 
                    src="/defi/lido.svg" 
                    alt="Lido Logo" 
                    className="w-6 h-6"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900">ETH质押</h3>
                  <p className="text-sm text-amber-600">获取 stETH 收益</p>
                </div>
              </div>
              
              {/* 关闭按钮 */}
              <button
                onClick={handleCancel}
                aria-label="关闭"
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl font-semibold hover:bg-amber-100 rounded-full w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-4">
            {/* 质押需知按钮 */}
            <button
              type="button"
              onClick={() => setShowInfo(v => !v)}
              className={`w-full mb-4 flex items-center justify-between gap-2 p-3 rounded-xl border transition-all duration-200 ${showInfo ? 'bg-amber-50 border-amber-300' : 'bg-white border-amber-200 hover:bg-amber-50'}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <i className="fa-solid fa-circle-info text-amber-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-amber-800">质押需知</div>
                  <div className="text-xs text-amber-600">点击查看质押说明</div>
                </div>
              </div>
              <i className={`fa-solid fa-chevron-${showInfo ? 'up' : 'down'} text-amber-400`}></i>
            </button>

            {/* 质押需知提示信息 */}
            {showInfo && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <div className="space-y-2">
                  <ul className="space-y-1">
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                      <span>质押ETH将获得等额的stETH（流动性质押代币）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                      <span>stETH余额会随时间自动增加，反映质押收益</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                      <span>质押需要网络确认，请耐心等待</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                      <span>stETH可以随时在DeFi协议中使用或交易</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 质押数量 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-amber-800 mb-2">
                质押数量 (ETH)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amountIn}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.0"
                  inputMode="decimal"
                  className="w-full p-3 pl-4 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                      <i className="fa-brands fa-ethereum text-white text-xs"></i>
                    </div>
                    <span className="text-amber-600 font-medium">ETH</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 钱包密码 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-amber-800 mb-2">
                钱包密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入钱包密码以确认交易"
                autoComplete="current-password"
                className="w-full p-3 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* 预计接收 */}
            <div className="mb-4 p-3 rounded-xl border border-amber-300 bg-amber-50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-amber-800">预计接收</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 flex items-center justify-center">
                    <img 
                      src="/defi/lido.svg" 
                      alt="stETH" 
                      className="w-4 h-4"
                    />
                  </div>
                  <span className="text-amber-600 font-medium">stETH</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-amber-900">
                  {ratio ? (Number(amountIn) || 0) * ratio : amountIn || "0.0"}
                </span>
              </div>
              <div className="text-xs text-amber-600">
                汇率: ETH/stETH = {ratio}
              </div>
              <div className="mt-1 text-xs text-amber-600">
                <i className="fa-solid fa-arrow-trend-up mr-1 text-green-500"></i>
                stETH余额会自动增加，每日更新收益
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              </div>
            )}

            {/* 交易结果 */}
            {txResult && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <div className="font-medium mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-circle-check"></i>
                  质押成功！
                </div>
                <div className="mt-1 text-xs break-all">{txResult}</div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading || !amountIn || !password}
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 ${loading || !amountIn || !password
                  ? 'bg-amber-300 cursor-not-allowed'
                  : 'bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 hover:shadow-lg active:scale-[0.98]'
                  } text-white`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    处理中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-lock"></i>
                    确认质押
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}