import React, { useState, useEffect, useRef } from "react";
import QrScanner from 'qr-scanner'; // 你要求的引入方式
import { UserTxInput } from "@/app/chainInteraction/lib/transaction";
export default function QRScanner({ setForm }: { setForm: React.Dispatch<React.SetStateAction<UserTxInput & { password: string }>> }) {

    // 扫码相关
    const [scanOpen, setScanOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const scannerRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
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
    }, []);

    return (
        <>
            <button
                type="button"
                onClick={openScanModal}
                className="shrink-0 px-3 py-2 rounded-lg border border-sky-100 bg-white hover:bg-sky-50 text-sky-700"
                title="扫码填入地址"

            >
                <i className="fa-solid fa-qrcode"></i>
            </button>
            {/* 扫码 Modal */}
            {
                scanOpen && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-white">
                        <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border  border-gray-200/50">
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
                )
            }
        </>
    );
}