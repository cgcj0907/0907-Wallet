
import React, { useState, useEffect } from "react";
import { LAYER2_LIST } from "@/app/networkManagement/lib/details"

type props_network_notice = {
  network: string,
  setShowLayer2Info: React.Dispatch<React.SetStateAction<boolean>>,
  setShowEthereumInfo: React.Dispatch<React.SetStateAction<boolean>>
}


export function NetworkNotice({ network, setShowLayer2Info, setShowEthereumInfo }: props_network_notice) {

  return (
    <>

      {network === "ethereum" &&
        <button
          type="button"
          onClick={() => setShowEthereumInfo(v => !v)}
          className="ml-auto shrink-0 flex items-center gap-2 px-3 py-1 rounded-lg border border-sky-100 bg-white hover:bg-sky-50 text-sky-700 text-sm"
          title="主网代币转账需知"

        >
          <i className="fa-solid fa-circle-exclamation"></i>
          主网代币转账需知
        </button>

      }
      {
        LAYER2_LIST.includes(network!) &&
        <button
          type="button"
          onClick={() => setShowLayer2Info(v => !v)}
          className="ml-auto shrink-0 flex items-center gap-2 px-3 py-1 rounded-lg border border-sky-100 bg-white hover:bg-sky-50 text-sky-700 text-sm"
          title="Layer2 代币转账需知"

        >
          <i className="fa-solid fa-circle-exclamation"></i>
          Layer2 代币转账需知
        </button>
      }

    </>
  )
}

export function EthereumInfo({ showEthereumInfo }: { showEthereumInfo: boolean }) {
  return (
    <>
      {showEthereumInfo && (
        <div
          className={`mt-2 px-4 py-3 rounded-lg border border-sky-100 bg-sky-50 text-sky-700 text-sm transition-all overflow-hidden ${showEthereumInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ transitionProperty: 'max-height, opacity', transitionDuration: '220ms' }}
        >
          <strong className="block mb-2">主网代币转账需知</strong>

          <ol className="ml-2 list-disc list-inside text-xs">
            <li>采用 EIP-7702 + EIP-4337 模式降低手续费</li>
            <li>使用 USDC 支付，每笔手续费低于 0.1 USDC</li>
            <li>默认使用 EIP-2137 向 Paymaster 提供 1 USDC 使用额度</li>
          </ol>
        </div>
      )}
    </>
  )
}

export function Layer2Info({ showLayer2Info }: { showLayer2Info: boolean }) {
  return (
    <>
      {
        showLayer2Info &&
        <div
          className={`mt-2 px-4 py-3 rounded-lg border border-sky-100 bg-sky-50 text-sky-700 text-sm transition-all overflow-hidden ${showLayer2Info ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ transitionProperty: 'max-height, opacity', transitionDuration: '220ms' }}
        >
          <strong className="block mb-2">Layer2 代币转账需知</strong>
          <p className="text-xs mb-2">
            在某些 Layer2 网络上，代币转账会采用 gasless / paymaster 赞助的机制；一次"用户体验上的单笔转账"背后可能对应多笔链上操作，常见流程示例如下：
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li><span className="font-medium">Paymaster 预支手续费：</span>Paymaster（赞助方）先行为该次操作预支或抵押所需的手续费。</li>
            <li><span className="font-medium">用户转账给目的账户：</span>实际的代币从用户地址转入目标地址（这步是用户意图的转账）。</li>
            <li><span className="font-medium">用户支付手续费给 Paymaster：</span>随后由链上或协议内的结算把手续费回补给 Paymaster（可能在同一笔或另外的交易中完成）。</li>
          </ol>
          <p className="text-xs mt-2 text-sky-600">
            注意：不同 Layer2 / Paymaster 实现细节不同（是否收费、是否需要额外授权、是否产生额外事件等），请以链上合约或钱包文档为准。
          </p>
        </div>
      }
    </>
  )
}
type props_data_notice = {
  showAdvancedInfo: boolean
}
export function DataNotice({ showAdvancedInfo }: props_data_notice) {
  return (

    <div
      className={`mt-1 rounded-lg border border-sky-100 bg-sky-50 text-sky-700 text-sm transition-all overflow-hidden ${showAdvancedInfo ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
      style={{ transitionProperty: 'max-height, opacity', transitionDuration: '250ms' }}
    >
      <ul className="list-disc pl-4 space-y-1">
        <li><span className="font-medium">Gas Limit</span>: 交易计算的 gas 上限，通常为 21000</li>
        <li><span className="font-medium">Max Fee (Gwei)</span>: 每单位 gas 的最高费用（包含基础费用和优先费用）</li>
        <li><span className="font-medium">Max Priority Fee (Gwei)</span>: 支付给验证者的优先费用，影响交易打包速度</li>
      </ul>
    </div>
  )
}