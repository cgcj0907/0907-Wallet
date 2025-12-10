'use client';

import React, { useState, useEffect } from "react";
import { parseEther } from "viem";
import { sendTransactions, UserTxInput } from "@/app/chainInteraction/lib/transaction";
import Avatar from 'boring-avatars';
import QRScanner from "./QRScanner";
import SelectToken from "../SelectToken";
import { NetworkNotice, Layer2Info, EthereumInfo, DataNotice } from "./TransferNotice";
import {
  ERC20TOKEN_LIST,
  NATIVE_TOKEN
} from '@/app/networkManagement/lib/details'

type props = {
  setTransferOpen: (open: boolean) => void,
  address: string | undefined
  network: string | null
}
export default function Transfer({ setTransferOpen, address, network }: props) {
  const [form, setForm] = useState<UserTxInput & { password: string }>({
    to: "" as `0x${string}`,
    value: "",
    data: "" as `0x${string}`,
    gasLimit: "",
    maxFeePerGas: "",
    maxPriorityFeePerGas: "",
    password: "",
  });

  const [keyPath, setKeyPath] = useState<string>("");
  const [token, setToken] = useState<string>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const [showLayer2Info, setShowLayer2Info] = useState(false);
  const [showEthereumInfo, setShowEthereumInfo] = useState(false);

  // 建议值（保底）
  const suggestedMaxFeeGwei = "2";
  const suggestedPriorityFeeGwei = "1";
  const [suggestedGasLimit, setSuggestedGasLimit] = useState<string>("21000");

  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTokens = ERC20TOKEN_LIST[network!] ?? [];

  useEffect(() => {
    const storedKeyPath = localStorage.getItem("currentAddressKeyPath");
    const storedNetwork = localStorage.getItem("currentNetwork");

    if (storedKeyPath) setKeyPath(storedKeyPath);
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

      const hash = await sendTransactions(network!, keyPath, form.password, userInput, token);
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
      setTxHash(hash);

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
      setTimeout(() => {
        setError(null)
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 py-5">
        <div className="bg-white/95 rounded-l-2xl w-full max-w-md overflow-hidden border border-sky-100">
          {/* Header */}
          <div className="bg-sky-100 p-6 text-sky-800">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">交易单</h2>
              <button
                onClick={() => setTransferOpen(false)}
                aria-label="关闭"
                className="text-sky-700 hover:text-sky-900 transition-colors text-2xl font-semibold bg-white bg-opacity-10 rounded-full w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-sky-50 rounded-lg p-3 border border-sky-100">
                <i className="fa-solid fa-globe"></i>
                <div className="text-sky-800 font-medium">{network || "未设置"}</div>
                <NetworkNotice
                  network={network!}
                  setShowLayer2Info={setShowLayer2Info}
                  setShowEthereumInfo={setShowEthereumInfo}
                />
              </div>
              {/* 主网说明面板 */}
              <EthereumInfo showEthereumInfo={showEthereumInfo} />
              {/* Layer2 说明面板 */}
              <Layer2Info showLayer2Info={showLayer2Info} />


            </div>

            <div>
              <label className="text-sm font-medium text-sky-700 block  mb-2">选择代币
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>


            {/* 表单字段 */}
            <div className="space-y-4">
              {/* 代币选择器 */}
              <SelectToken
                network={network!}
                availableTokens={availableTokens}
                token={token}
                setToken={setToken}
                address={address}
              />

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
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-sky-700 block mb-2">
                  接收地址
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="flex gap-2 items-center">
                  {form.to &&
                    <Avatar
                      name={form.to}
                      size={36}
                      variant="beam"
                      colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
                    />
                  }
                  <input
                    name="to"
                    value={form.to}
                    onChange={handleChange}
                    required
                    placeholder="0x..."
                    className="flex-1 px-4 py-3 rounded-lg border border-sky-100 focus:ring-2 focus:ring-sky-200 focus:border-transparent transition-all outline-none font-mono text-sm bg-white"
                  />
                  <QRScanner setForm={setForm} />
                </div>

                {form.to && !isValidEthereumAddress(form.to) && (
                  <p className="text-red-500 text-xs mt-1">请输入有效的以太坊地址</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-sky-700 block mb-2">
                  转账金额 ({token ? token.toUpperCase() : NATIVE_TOKEN[network!]})
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

            {/* 高级选项 */}
            <div className="border-t border-sky-100 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(prev => !prev)}
                    className="flex items-center gap-2 text-left text-sm font-medium text-sky-700 hover:text-sky-900 transition-colors"
                  >
                    {showAdvanced ? <i className="fa-solid fa-caret-up"></i> : <i className="fa-solid fa-caret-down"></i>}
                    <span>高级选项</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedInfo(v => !v)}
                    aria-label="高级选项说明"
                    className=" text-sky-700"
                  >
                    <i className="fa-solid fa-circle-exclamation"></i>
                  </button>
                </div>
              </div>

              <DataNotice showAdvancedInfo={showAdvancedInfo} />

              {showAdvanced && (
                <div className="mt-3 space-y-4">
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
              className="w-full bg-sky-300 text-white py-4 rounded-xl font-semibold text-lg hover:from-sky-350 hover:to-sky-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-3"
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
                <span className="text-sky-800 font-medium">交易已发送!</span>
              </div>
              <p className="text-sky-700 text-sm mt-1 font-mono break-all">Tx Hash: {txHash}</p>
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
          <div className="w-full m-0 bg-sky-100 h-10"></div>
        </div>

      </div>
    </>
  );
}