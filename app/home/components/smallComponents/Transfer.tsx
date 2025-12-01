'use client';

import { useState, useEffect, useRef } from "react";
import { WalletClient, parseEther } from "viem";
import { getWalletClient } from "@/app/chainInteraction/lib/client";
import { sendTransactions, UserTxInput } from "@/app/chainInteraction/lib/transaction";
import QrScanner from 'qr-scanner'; // 你要求的引入方式



export default function Transfer({ setSentTransactionOpen

}: {
  setSentTransactionOpen: (open: boolean) => void;
}) {
  const [form, setForm] = useState<UserTxInput & { password: string }>({
    to: "" as `0x${string}`,
    value: "",
    data: "" as `0x${string}`,
    gasLimit: "",
    maxFeePerGas: "",
    maxPriorityFeePerGas: "",
    password: "",
  });

  const [network, setNetwork] = useState<string>("arbitrum_sepolia");
  const [keyPath, setKeyPath] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);

  // 建议值（保底）
  const suggestedMaxFeeGwei = "2";
  const suggestedPriorityFeeGwei = "1";
  const [suggestedGasLimit, setSuggestedGasLimit] = useState<string>("21000");

  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 扫码相关
  const [scanOpen, setScanOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    const storedKeyPath = localStorage.getItem("currentAddressKeyPath");
    const storedNetwork = localStorage.getItem("currentNetwork");

    if (storedKeyPath) setKeyPath(storedKeyPath);
    if (storedNetwork) setNetwork(storedNetwork);
  }, []);

  useEffect(() => {
    setSuggestedGasLimit("21000");
  }, [network]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isValidEthereumAddress = (address: string): boolean => {
    if (!address) return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isValidNumber = (value: string): boolean => {
    if (!value) return true;
    return /^\d*\.?\d+$/.test(value);
  };

  useEffect(() => {
    if (showAdvanced) {
      setForm(prev => {
        const next = { ...prev };
        if (!next.gasLimit) next.gasLimit = suggestedGasLimit;
        if (!next.maxFeePerGas) next.maxFeePerGas = suggestedMaxFeeGwei;
        if (!next.maxPriorityFeePerGas) next.maxPriorityFeePerGas = suggestedPriorityFeeGwei;
        return next;
      });
    }

  }, [showAdvanced]);


  const startScanner = async () => {
    setScanError(null);
    try {
      if (!videoRef.current) throw new Error("video element missing");

      // 清理旧的 scanner
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch { }
        try { scannerRef.current.destroy?.(); } catch { }
        scannerRef.current = null;
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          const text = result.data ?? result; // 兼容详细模式和字符串模式
          console.log("decoded:", text);

          // 匹配 ethereum 地址
          const m = text.match(/0x[a-fA-F0-9]{40}/);
          if (m) {
            const address = m[0] as `0x${string}`;

            // 写入表单
            setForm(prev => ({ ...prev, to: address }));

            // 关闭扫码弹窗
            setScanOpen(false);

            // 停止扫描，避免重复触发
            scanner.stop();
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      scannerRef.current = scanner;
      await scanner.start();
    } catch (err: any) {
      console.error("startScanner error:", err);
      setScanError("无法打开相机或浏览器不支持相机访问。请允许相机权限或使用图片上传。");
    }
  };


  const stopScanner = () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy?.();
        scannerRef.current = null;
      }
    } catch (e) {
      console.warn("stopScanner error:", e);
    }
  };

  const openScanModal = () => {
    setScanOpen(true);
    setTimeout(() => startScanner(), 60);
  };

  const closeScanModal = () => {
    stopScanner();
    setScanOpen(false);
    setScanError(null);
  };

  const handleFileScan = async (file?: File) => {
    setScanError(null);
    if (!file) return;

    try {
      // 关键：第二个参数传入 { returnDetailedScanResult: true }
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });

      // result 现在是一个对象 { data: string, cornerPoints: ... }
      // 所以要用 result.data 取内容
      const content = result.data;

      if (!content) {
        setScanError("未能识别图片中的二维码，请更换图片或使用相机扫码。");
        return;
      }

      // 自动提取以太坊地址
      const match = content.match(/0x[a-fA-F0-9]{40}/i);
      const address = match ? match[0] : content.trim();

      setForm(prev => ({ ...prev, to: address as `0x${string}` }));
      closeScanModal();
    } catch (err: any) {
      console.error("handleFileScan error:", err);
      setScanError("图片识别失败，请确保是二维码图片。");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileScan(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== 表单提交（保持你原逻辑） ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      if (!form.password) throw new Error("请输入钱包密码");
      if (!form.to) throw new Error("请输入接收地址");
      if (!isValidEthereumAddress(form.to)) throw new Error("请输入有效的以太坊地址 (0x...)");
      if (!form.value) throw new Error("请输入转账金额");
      if (!isValidNumber(form.value)) throw new Error("请输入有效的金额数值");

      if (showAdvanced) {
        if (form.gasLimit && !isValidNumber(form.gasLimit)) throw new Error("Gas Limit 必须是有效的数字");
        if (form.maxFeePerGas && !isValidNumber(form.maxFeePerGas)) throw new Error("Max Fee Per Gas 必须是有效的数字");
        if (form.maxPriorityFeePerGas && !isValidNumber(form.maxPriorityFeePerGas)) throw new Error("Max Priority Fee Per Gas 必须是有效的数字");
      }

      const walletClient: WalletClient = await getWalletClient(network, keyPath, form.password);

      const gweiToWeiString = (gweiStr?: string) => {
        if (!gweiStr || gweiStr.trim() === "") return undefined;
        const gweiNum = Number(gweiStr);
        const weiBigInt = BigInt(Math.round(gweiNum * 1e9));
        return weiBigInt.toString();
      };

      const userInput: UserTxInput = {
        to: form.to as `0x${string}`,
        value: parseEther(form.value).toString(),
      };

      if (form.data && form.data.trim() !== "") {
        userInput.data = form.data as `0x${string}`;
      }

      if (showAdvanced) {
        if (form.gasLimit && form.gasLimit.trim() !== "") {
          userInput.gasLimit = form.gasLimit;
        }
        if (form.maxFeePerGas && form.maxFeePerGas.trim() !== "") {
          userInput.maxFeePerGas = gweiToWeiString(form.maxFeePerGas);
        }
        if (form.maxPriorityFeePerGas && form.maxPriorityFeePerGas.trim() !== "") {
          userInput.maxPriorityFeePerGas = gweiToWeiString(form.maxPriorityFeePerGas);
        }
      }

      const hash = await sendTransactions(network, walletClient, userInput);
      setTxHash(hash);

      setTimeout(() => {
        setSentTransactionOpen(false);
      }, 2000);
    } catch (err: any) {
      console.error("Transaction error:", err);
      let errorMessage = "转账失败";
      if (err && err.message) {
        if (err.message.includes("startsWith")) {
          errorMessage = "地址格式错误，请检查接收地址";
        } else if (err.message.includes("password") || err.message.includes("密码")) {
          errorMessage = "钱包密码错误";
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "余额不足";
        } else if (err.message.includes("ChainMismatch")) {
          errorMessage = "链不匹配，请切换到目标网络";
        } else if (err.message.includes("network")) {
          errorMessage = "网络连接失败，请检查网络设置";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ========== UI ==========
  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
        <div className="bg-white/95 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-sky-100">
          {/* Header */}
          <div className="bg-linear-to-r from-sky-200 to-sky-100 p-6 text-sky-800">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">交易单</h2>
              <button
                onClick={() => setSentTransactionOpen(false)}
                aria-label="关闭"
                className="text-sky-700 hover:text-sky-900 transition-colors text-2xl font-semibold bg-white bg-opacity-10 rounded-full w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-sky-50 rounded-lg p-3 border border-sky-100">
                <i className="fa-solid fa-globe"></i>
                <div className="text-sky-800 font-medium">{network || "未设置"}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-sky-700 block mb-2">
                  钱包密码
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="请输入您的钱包密码"
                  className="w-full px-4 py-3 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-sky-700 block mb-2">
                  接收地址
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="flex gap-2">
                  <input
                    name="to"
                    value={form.to}
                    onChange={handleChange}
                    required
                    placeholder="0x..."
                    className="flex-1 px-4 py-3 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none font-mono text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={openScanModal}
                    className="shrink-0 px-3 py-2 rounded-lg border border-sky-100 bg-white hover:bg-sky-50 text-sky-700"
                    title="扫码填入地址"
                  >
                    <i className="fa-solid fa-qrcode"></i>
                  </button>
                </div>

                {form.to && !isValidEthereumAddress(form.to) && (
                  <p className="text-red-500 text-xs mt-1">请输入有效的以太坊地址</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-sky-700 block mb-2">
                  转账金额 (ETH)
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  name="value"
                  value={form.value}
                  onChange={handleChange}
                  required
                  placeholder="0.0"
                  className="w-full px-4 py-3 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none text-lg font-semibold bg-white"
                />
                {form.value && !isValidNumber(form.value) && (
                  <p className="text-red-500 text-xs mt-1">请输入有效的数字</p>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="border-t border-sky-100 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(prev => !prev)}
                    className="flex items-center gap-2 text-left text-sm font-medium text-sky-700 hover:text-sky-900 transition-colors"
                  >
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-sky-200 shadow-sm bg-white`}>
                      <svg className={`w-4 h-4 transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                    <span>高级选项</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedInfo(v => !v)}
                    aria-label="高级选项说明"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-sky-100 shadow-sm text-sky-600 hover:bg-sky-50 transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1" />
                      <circle cx="12" cy="8" r="1" strokeWidth="0" fill="currentColor" />
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div
                className={`mt-3 p-3 rounded-lg border border-sky-100 bg-sky-50 text-sky-700 text-sm transition-all overflow-hidden ${showAdvancedInfo ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                style={{ transitionProperty: 'max-height, opacity', transitionDuration: '250ms' }}
              >
                <strong className="block mb-1">高级选项说明</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li><span className="font-medium">Gas Limit</span>: 交易计算的 gas 上限，通常为 21000</li>
                  <li><span className="font-medium">Max Fee (Gwei)</span>: 每单位 gas 的最高费用（包含基础费用和优先费用）</li>
                  <li><span className="font-medium">Max Priority Fee (Gwei)</span>: 支付给验证者的优先费用，影响交易打包速度</li>
                </ul>
              </div>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-sky-700 block mb-2">Data (可选)</label>
                    <input
                      name="data"
                      value={form.data || ""}
                      onChange={handleChange}
                      placeholder="0x..."
                      className="w-full px-4 py-3 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none font-mono text-sm bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-sky-700 block mb-2">Gas Limit</label>
                      <input
                        name="gasLimit"
                        value={form.gasLimit || ""}
                        onChange={handleChange}
                        placeholder={suggestedGasLimit}
                        className="w-full px-3 py-2 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none bg-white"
                      />
                      <p className="text-xs text-sky-500 mt-1">建议: {suggestedGasLimit}</p>
                      {form.gasLimit && !isValidNumber(form.gasLimit) && (
                        <p className="text-red-500 text-xs mt-1">请输入数字</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-sky-700 block mb-2">Max Fee (gwei)</label>
                      <input
                        name="maxFeePerGas"
                        value={form.maxFeePerGas || ""}
                        onChange={handleChange}
                        placeholder={suggestedMaxFeeGwei}
                        className="w-full px-3 py-2 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none bg-white"
                      />
                      <p className="text-xs text-sky-500 mt-1">建议: {suggestedMaxFeeGwei} gwei</p>
                      {form.maxFeePerGas && !isValidNumber(form.maxFeePerGas) && (
                        <p className="text-red-500 text-xs mt-1">请输入数字</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-sky-700 block mb-2">Max Priority Fee (gwei)</label>
                    <input
                      name="maxPriorityFeePerGas"
                      value={form.maxPriorityFeePerGas || ""}
                      onChange={handleChange}
                      placeholder={suggestedPriorityFeeGwei}
                      className="w-full px-4 py-3 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none bg-white"
                    />
                    <p className="text-xs text-sky-500 mt-1">建议: {suggestedPriorityFeeGwei} gwei</p>
                    {form.maxPriorityFeePerGas && !isValidNumber(form.maxPriorityFeePerGas) && (
                      <p className="text-red-500 text-xs mt-1">请输入数字</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-sky-300 to-sky-200 text-white py-4 rounded-xl font-semibold text-lg hover:from-sky-350 hover:to-sky-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  发送中...
                </div>
              ) : (
                "确认发送交易"
              )}
            </button>
          </form>

          {txHash && (
            <div className="mx-6 mb-6 p-4 bg-sky-50 border border-sky-200 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-sky-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sky-800 font-medium">交易成功!</span>
              </div>
              <p className="text-sky-700 text-sm mt-1 font-mono break-all">哈希: {txHash}</p>
              <p className="text-sky-600 text-xs mt-2">弹窗将在2秒后自动关闭...</p>
            </div>
          )}

          {error && (
            <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">交易失败</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* 扫码 Modal */}
      {scanOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          {/* 模糊背景层 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"></div>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
            {/* 标题和关闭按钮 */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">扫码填入地址</h3>
                <p className="text-sm text-gray-500 mt-1">对准二维码自动识别</p>
              </div>
              <button
                onClick={closeScanModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                aria-label="关闭"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 扫码区域 */}
            <div className="p-6 flex flex-col items-center">
              <div className="relative w-72 h-72 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  muted
                />
                {/* 四角装饰 */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  上传二维码图片
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </div>

              {/* 提示信息 */}
              {scanError && (
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-red-500 bg-red-50 py-2 rounded-lg w-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{scanError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



    </>
  );
}
