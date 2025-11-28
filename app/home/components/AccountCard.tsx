'use client';
import { useState, useRef, useEffect } from 'react';
import { getNetwork } from '@/app/networkManage/lib/storage';
import Avatar from 'boring-avatars';
/* 打开区块链浏览器 */
const openExplorer = async (addr?: string) => {
    if (!addr) return;
    const currentNetworkName = localStorage.getItem("currentNetwork");
    if (!currentNetworkName) {
        alert("未选择网络");
        return;
    }
    const net = await getNetwork(currentNetworkName);
    if (!net || !net.explorer) {
        alert("当前网络没有配置区块链浏览器");
        return;
    }
    const url = `${net.explorer}/address/${addr}`;
    window.open(url, "_blank");
};
export default function AccountCard({ address }: { address: string | undefined }) {
    const [accountPanelOpen, setAccountPanelOpen] = useState(false);
    // ✔ 小卡片复制后绿色状态
    const [copiedGreen, setCopiedGreen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    // 画布：左右手
    const armCanvasRefLeft = useRef<HTMLCanvasElement>(null);
    const armCanvasRefRight = useRef<HTMLCanvasElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const copyAddress = async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopiedGreen(true);
        setTimeout(() => setCopiedGreen(false), 1500);
    };
    const short = (addr?: string) => {
        if (!addr) return '';
        if (addr.length <= 12) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };
    /** ------------------ 手臂绘制 ------------------ **/
    useEffect(() => {
        const left = armCanvasRefLeft.current;
        const right = armCanvasRefRight.current;
        if (!left || !right) return;
        const lctx = left.getContext("2d")!;
        const rctx = right.getContext("2d")!;
        function drawArm(ctx: CanvasRenderingContext2D, mirror = false) {
            ctx.clearRect(0, 0, 200, 200);
            ctx.strokeStyle = "#0ea5e9";
            ctx.lineWidth = 0.5;
            ctx.lineCap = "round";
            ctx.save();
            if (mirror) {
                ctx.translate(120, 0);
                ctx.scale(-1, 1);
            }
            // 手臂线条（柔和）
            ctx.beginPath();
            ctx.moveTo(20, 20);
            ctx.quadraticCurveTo(0, 40, 20, 80);
            ctx.quadraticCurveTo(40, 110, 70, 115);
            ctx.stroke();
            // 爪子
            drawClaw(ctx, 70, 115);
            ctx.restore();
        }
        function drawClaw(ctx: CanvasRenderingContext2D, x: number, y: number) {
            const fingers = [-0.3, 0, 0.3];
            fingers.forEach((a) => {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18);
                ctx.stroke();
            });
        }
        drawArm(lctx, false);
        drawArm(rctx, true);
    }, []);
    return (
        <>
            <div className="flex flex-col items-center gap-1 relative">
                {/* ===== 顶部按钮 ===== */}
                <div
                    className="relative group"
                    onMouseEnter={() => {
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                        }
                        setIsHovered(true);
                    }}
                    onMouseLeave={() => {
                        hoverTimeoutRef.current = setTimeout(() => {
                            setIsHovered(false);
                            hoverTimeoutRef.current = null;
                        }, 300); // 延迟 2 秒
                    }}
                >
                    <button
                        onClick={() => setAccountPanelOpen(true)}
                        className="relative min-w-40 z-10 flex justify-center items-center gap-3 bg-white px-3 py-1 rounded-lg border border-sky-200 shadow-sm hover:shadow-md"
                    >
                        <div className="relative w-9 h-9 shrink-0">
                            <Avatar
                                name={address}
                                size={36}
                                variant="beam"
                                colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
                            />

                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-sky-800">0907</div>
                        </div>
                    </button>

                    {/* ===== 左右手臂 ===== */}
                    <canvas
                        ref={armCanvasRefLeft}
                        width={120}
                        height={120}
                        className={`pointer-events-none absolute left-[-25px] top-2 transition duration-500 ease-out ${isHovered ? 'opacity-100 translate-y-0 smoothSwing' : 'opacity-0'}`}
                        style={{ zIndex: 1 }}
                    />
                    <canvas
                        ref={armCanvasRefRight}
                        width={120}
                        height={120}
                        className={`pointer-events-none absolute right-[-25px] top-2 transition duration-500 ease-out ${isHovered ? 'opacity-100 translate-y-0 smoothSwing' : 'opacity-0'}`}
                        style={{ zIndex: 1 }}
                    />

                    <div
                        onClick={copyAddress}
                        className={`absolute left-1/2 -translate-x-1/2 top-[70px] cursor-pointer select-none smallCard transition-all duration-500 ease-out ${isHovered ? 'opacity-100 translate-y-0 smoothSwing' : 'opacity-0'
                            }`}

                    >
                        {/* 淡蓝色渐变边框 - 更可爱的版本 */}
                        <div className="rounded-2xl p-1 mt-6 z-2 bg-linear-to-r from-blue-200 via-sky-200 to-cyan-200 shadow-sm">
                            <div className="bg-white/90 rounded-xl px-4 py-1.5 flex justify-center items-center backdrop-blur-sm">
                                <span
                                    className="font-mono text-xs leading-none transition-colors duration-300 font-medium"
                                    style={{ color: copiedGreen ? "#16a34a" : "#0c4a6e" }}
                                >
                                    {short(address)}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* ============ 弹窗部分保持原样 ============ */}
            {accountPanelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-sky-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={address}
                                    size={48}
                                    variant="beam"
                                    colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
                                />
                                <div>
                                    <div className="text-lg font-semibold text-sky-800">账户详情</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setAccountPanelOpen(false)}
                                className="text-sky-600 text-sm"
                            >
                                关闭
                            </button>
                        </div>
                        <div className="bg-sky-50 p-1 rounded-lg border border-sky-100 mb-4">
                            <div className="text-xs text-sky-500">完整地址</div>
                            <div className="text-sm font-mono text-sky-800 mt-2">{address}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigator.clipboard.writeText(address!)}
                                className="py-3 rounded-lg bg-white border border-sky-200 text-sky-700"
                            >
                                复制
                            </button>
                            <button
                                onClick={() => openExplorer(address)}
                                className="py-3 rounded-lg bg-white border border-sky-200 text-sky-700"
                            >
                                在浏览器查看
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ====== 样式（更丝滑）====== */}
            <style jsx>{`
                .smoothSwing {
                    transform-origin: 50% 10%;
                    animation: smoothSwingAnim 3200ms ease-in-out infinite;
                }
                @keyframes smoothSwingAnim {
                    0% { transform: rotate(0deg); }
                    3.33% { transform: rotate(0.32deg); }
                    6.66% { transform: rotate(0.64deg); }
                    10% { transform: rotate(0.96deg); }
                    13.33% { transform: rotate(1.28deg); }
                    16.66% { transform: rotate(1.6deg); }
                    20% { transform: rotate(1.92deg); }
                    23.33% { transform: rotate(2.24deg); }
                    26.66% { transform: rotate(2.4deg); } /* 接近最大角度 */
                    30% { transform: rotate(2.24deg); }
                    33.33% { transform: rotate(1.92deg); }
                    36.66% { transform: rotate(1.6deg); }
                    40% { transform: rotate(1.28deg); }
                    43.33% { transform: rotate(0.96deg); }
                    46.66% { transform: rotate(0.64deg); }
                    50% { transform: rotate(0.32deg); }
                    53.33% { transform: rotate(0deg); }
                    56.66% { transform: rotate(-0.32deg); }
                    60% { transform: rotate(-0.64deg); }
                    63.33% { transform: rotate(-0.96deg); }
                    66.66% { transform: rotate(-1.28deg); }
                    70% { transform: rotate(-1.6deg); }
                    73.33% { transform: rotate(-1.92deg); }
                    76.66% { transform: rotate(-2.24deg); }
                    80% { transform: rotate(-2.4deg); } /* 接近最小角度 */
                    83.33% { transform: rotate(-2.24deg); }
                    86.66% { transform: rotate(-1.92deg); }
                    90% { transform: rotate(-1.6deg); }
                    93.33% { transform: rotate(-1.28deg); }
                    96.66% { transform: rotate(-0.96deg); }
                    100% { transform: rotate(0deg); }
                }
                .smallCard {
                    transition: transform 0.2s ease;
                }
                .speech-bubble {
                    position: relative;
                }
                .speech-bubble:after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    border: 4px solid transparent;
                    border-top-color: rgb(224 242 241); /* bg-sky-100 */
                }
            `}</style>
        </>
    );
}