'use client';

import { useEffect } from 'react';
import { initDB } from '@/app/lib/storage';

type Props = { children: React.ReactNode };

export default function InitProvider({ children }: Props) {

    useEffect(() => {
        initDB();
    }, []);

    return <>{children}</>;
}
