'use client';

import QRCode from 'react-qr-code';
import { useEffect } from 'react';

export default function Receive({
    address,
    setReceiveOpen
}: {
    address: string | undefined;
    setReceiveOpen: (value: boolean) => void;
}) {


    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setReceiveOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [setReceiveOpen]);
    if (!address || !address.startsWith('0x')) {
        return;
    }

    return (
        <div
            className="fixed inset-0 flex items-center justify-end z-50"
            onClick={() => setReceiveOpen(false)}
        >
            <div
                className="relative p-6 bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-60 h-60">
                    <QRCode
                        value={address}
                        size={240}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                    />

                    <img
                        src="/QRlogo.webp"
                        alt="logo"
                        className="absolute bg-white rounded-2xl top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2"
                    />

                </div>
            </div>
        </div>
    );
}
