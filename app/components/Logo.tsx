'use client'

import { useState } from 'react';
import clsx from 'clsx';

/**
 * @file Logo 组件（首页/导航栏主 Logo）
 * @description 带悬停交互的圆形 Logo，鼠标悬停时向上浮起并展示文字说明，支持缓慢弹跳动画
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-27
 */

/**
 * 主 Logo 组件
 * - 默认状态：Logo 向下位移一半，遮挡下方文字区域（视觉上形成“半隐藏”效果）
 * - 悬停状态：Logo 上移至正常位置，同时下方文字卡片从 0 高度展开
 * - 使用 z-[-1]/z-[-2] 保证图片始终在文字卡片上方，但整体被外部容器裁剪
 */
export default function Logo() {
    // hover 状态控制整个交互动画的开启与关闭
    const [hover, setHover] = useState(false);

    return (
        // 外层容器：相对定位，用于控制子元素的绝对/固定定位基准，同时垂直居中排列
        <div
            className="relative flex flex-col items-center caret-transparent"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* 图片 Logo（主视觉元素） */}
            <div
                className={clsx(
                    // 负 z-index 让图片在文字卡片之下，但通过 translate-y 制造“浮在前面”的视觉错位
                    // w-86/h-86 ≈ 344px（Tailwind 自定义单位），圆形裁剪 + 溢出隐藏 + 阴影 + 平滑位移动画
                    "z-[-1] w-86 h-86 rounded-full overflow-hidden cursor-pointer shadow-lg transition-transform duration-300",
                    // 未悬停时向下位移 48（192px），刚好遮住下方文字卡片一半，形成悬念感
                    // 悬停时恢复原位，视觉上像“Logo 向上浮起”
                    hover ? "translate-y-0" : "translate-y-48"
                )}
            >
                {/* Logo 图片自适应铺满容器，保持原始比例不被拉伸 */}
                <img
                    src="/logo.webp"
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover"
                    fetchPriority="high"
                />
            </div>

            {/* 文字说明卡片区域（默认完全收起，悬停时通过 max-h 展开） */}
            <div
                className={clsx(
                    // 使用 overflow-hidden + max-h 实现平滑的展开/收起动画
                    // mt-2 给卡片留出一点上边距，避免紧贴 Logo
                    "z-[-2] overflow-hidden transition-all duration-300 mt-2",
                    hover ? "max-h-40" : "max-h-0"
                )}
            >
                {/* 文字卡片本体：圆角背景 + 内边距 + 固定宽度 + 文字居中 + 缓慢弹跳动画 */}
                <div className="rounded-2xl p-3 w-40 text-center flex flex-col items-center gap-1 animate-bounce-slow">
                    {/* 主标题 */}
                    <p className="text-sm font-semibold text-blue-500 flex items-center justify-center gap-1">
                        0907 Wallet
                    </p>
                    {/* 副标题（技术支持声明） */}
                    <p className="text-xs text-blue-300">Supported by SST</p>
                </div>
            </div>
        </div>
    );
}