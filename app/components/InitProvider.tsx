// app/components/InitProvider.tsx
/**
 * @file 应用全局初始化提供器（客户端组件）
 * @description 
 *   在应用最外层提前初始化 IndexedDB（火力全开，不阻塞渲染），
 *   确保后续所有 storage 操作都能直接使用已就绪的数据库连接。
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

'use client';

import { useEffect } from 'react';
import { initDB } from '@/app/lib/storage';

interface InitProviderProps {
  /** 需要接收初始化的子应用内容 */
  children: React.ReactNode;
}

/**
 * 全局 IndexedDB 初始化 Provider
 *
 * 为什么使用 fire-and-forget（不 await）？
 * - initDB 本身是幂等的，多次调用不会重复创建版本
 * - 提前触发即可，后续 storage 操作会自动等待 ensureStore 完成版本升级
 * - 避免阻塞首屏渲染，保持极致启动速度
 *
 * @param children 子树内容
 */
export default function InitProvider({ children }: InitProviderProps): React.ReactElement {
  useEffect(() => {
    // 故意不 await：让初始化在后台静默进行
    // 出现异常也会被 initDB 内部捕获并打印，不会影响主流程
    initDB().catch((error) => {
      console.error('[InitProvider] IndexedDB 初始化失败（非致命）:', error);
      // 这里不抛错，因为即使 IndexedDB 不可用，应用仍可降级运行
    });
  }, []);

  // 直接透传 children，无任何额外 UI
  return <>{children}</>;
}