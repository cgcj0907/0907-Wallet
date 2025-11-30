'use client';

import { useState } from "react";
import GenerateWallet from "./components/GenerateWallet";
import ImportWallet from "./components/ImportWallet";

/**
 * @file 钱包生成/导入页面入口
 * @description 
 *  - 作为 /wallet 页面主体，提供“创建钱包 / 导入钱包” UI 切换
 *  - 页面将切换按钮和对应组件放在同一个白色卡片块内（视觉统一）
 *  - GenerateWallet 与 ImportWallet 组件保持独立（业务逻辑各自管理）
 * 
 * @author 
 *   Guangyang Zhong | github: https://github.com/cgcj0907
 *
 * @date 2025-11-28
 */
export default function Page() {
  const [mode, setMode] = useState<'generate' | 'import'>('generate');

  return (
    <div className="flex justify-center mt-6 px-4">
      {/* 整个内容放在同一个白色卡片块内 */}
      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl w-md">
        <h1 className="text-xl font-semibold text-blue-700 mb-4 text-center">钱包管理</h1>

        {/* 模式切换按钮（同卡片内） */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setMode('generate')}
            className={`px-4 py-2 rounded-lg border transition-all ${
              mode === 'generate'
                ? 'bg-sky-500 text-white shadow'
                : 'bg-white text-sky-700 border-sky-300 hover:bg-sky-50'
            }`}
            aria-pressed={mode === 'generate'}
          >
            生成随机钱包
          </button>

          <button
            onClick={() => setMode('import')}
            className={`px-4 py-2 rounded-lg border transition-all ${
              mode === 'import'
                ? 'bg-sky-500 text-white shadow'
                : 'bg-white text-sky-700 border-sky-300 hover:bg-sky-50'
            }`}
            aria-pressed={mode === 'import'}
          >
            导入助记词
          </button>
        </div>

        {/* 分割线（可选） */}
        <div className="border-t border-gray-100 mb-6" />

        {/* 渲染对应组件（组件本身是卡片式样，此处直接嵌入） */}
        <div className="w-full">
          {mode === 'generate' ? <GenerateWallet /> : <ImportWallet />}
        </div>
      </div>
    </div>
  );
}
