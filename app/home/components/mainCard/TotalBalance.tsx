// MultiCurrencyRemoteMinimal.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import Select, {
    components,
    SingleValueProps,
    OptionProps,
    DropdownIndicatorProps,
    StylesConfig
} from 'react-select';

type Currency = "USD" | "CNY" | "HKD" | "EUR" | "JPY" | "KRW";

const CURRENCIES: Currency[] = ["USD", "CNY", "HKD", "EUR", "JPY", "KRW"];

const META: Record<Currency, { locale: string; fraction: number }> = {
    USD: { locale: "en-US", fraction: 2 },
    CNY: { locale: "zh-CN", fraction: 2 },
    HKD: { locale: "zh-HK", fraction: 2 },
    EUR: { locale: "de-DE", fraction: 2 },
    JPY: { locale: "ja-JP", fraction: 0 },
    KRW: { locale: "ko-KR", fraction: 0 },
};

const FALLBACK_RATES: Record<Currency, number> = {
    USD: 1,
    CNY: 7.2,
    HKD: 7.8,
    EUR: 0.92,
    JPY: 150,
    KRW: 1400,
};

type Props = {
    usdAmount: number;
    cacheMinutes?: number;
    autoRefreshMinutes?: number | 0;
    className?: string;
};

type CachedPayload = { ts: number; rates: Record<string, number>; source?: string };
const CACHE_KEY = "mc_rates_open_er_api_v1";

type OptionType = {
    value: Currency;
    label: string;
};

const options: OptionType[] = CURRENCIES.map(currency => ({
    value: currency,
    label: currency
}));

const CustomSingleValue = ({ children, ...props }: SingleValueProps<OptionType>) => (
    <components.SingleValue {...props}>
        <span className="text-sm text-gray-700 font-medium">{children}</span>
    </components.SingleValue>
);

const CustomOption = ({ children, ...props }: OptionProps<OptionType>) => (
    <components.Option {...props}>
        <span className="text-sm text-gray-700">{children}</span>
    </components.Option>
);

const CustomDropdownIndicator = (props: DropdownIndicatorProps<OptionType>) => (
    <components.DropdownIndicator {...props}>
        <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </components.DropdownIndicator>
);

const customStyles: StylesConfig<OptionType> = {
    control: (base, state) => ({
        ...base,
        backgroundColor: 'transparent',
        // 去掉边框与阴影，使 SingleValue 看起来无边框
        border: 'none',
        boxShadow: 'none',
        // 保持圆角但不显边框；如果要完全平直可设置为 '0'
        borderRadius: '0.375rem',
        minHeight: '32px',
        minWidth: '80px',
        // hover / focus 时也不要显示边框
        '&:hover': {
            border: 'none',
        },
        // important: 覆盖 react-select 的 focus 样式
        outline: 'none',
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '0 6px', // 让文本和箭头更紧凑
    }),
    singleValue: (base) => ({
        ...base,
        margin: 0,
        padding: '0 0 0 10px',
        // 保证看起来像普通文本
        color: '#374151',
        fontSize: '14px',
        lineHeight: '1',
    }),
    dropdownIndicator: (base) => ({
        ...base,
        padding: '0 6px',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    menu: (base) => ({
        ...base,
        borderRadius: '0.375rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        minWidth: '80px',
    }),
    menuList: (base) => ({
        ...base,
        padding: '4px 0',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#f3f4f6' : 'white',
        color: state.isSelected ? '#111827' : '#374151',
        fontSize: '14px',
        padding: '6px 12px',
        '&:hover': {
            backgroundColor: '#f9fafb',
        },
    }),
};

export default function TotalBalance({
    usdAmount,
    cacheMinutes = 10,
    autoRefreshMinutes = 0,
    className = "",
}: Props) {
    const [currency, setCurrency] = useState<Currency>("USD");
    const [rates, setRates] = useState<Record<Currency, number> | null>(null);

    const cacheMs = cacheMinutes * 60_000;

    const fetchRates = useCallback(async () => {
        try {
            const resp = await fetch("https://open.er-api.com/v6/latest/USD");
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            if (json?.result !== "success" || !json?.rates) throw new Error("Unexpected response");

            const picked: Record<Currency, number> = {} as any;
            CURRENCIES.forEach(c => {
                picked[c] = typeof json.rates[c] === "number" ? json.rates[c] : FALLBACK_RATES[c];
            });

            setRates(picked);
            try {
                const payload: CachedPayload = { ts: Date.now(), rates: picked, source: "open.er-api.com" };
                localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
            } catch {
                // ignore localStorage errors
            }
        } catch (err) {
            console.error("fetchRates error", err);
            const fallback: Record<Currency, number> = {} as any;
            CURRENCIES.forEach(c => (fallback[c] = FALLBACK_RATES[c]));
            setRates(fallback);
        }
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) {
                const parsed: CachedPayload = JSON.parse(raw);
                if (Date.now() - parsed.ts < cacheMs) {
                    const picked: Record<Currency, number> = {} as any;
                    CURRENCIES.forEach(c => {
                        picked[c] = parsed.rates[c] ?? FALLBACK_RATES[c];
                    });
                    setRates(picked);
                    return;
                }
            }
        } catch {
            // ignore parse errors
        }
        fetchRates();
    }, [cacheMs, fetchRates]);

    useEffect(() => {
        if (!autoRefreshMinutes || autoRefreshMinutes <= 0) return;
        const id = setInterval(fetchRates, autoRefreshMinutes * 60_000);
        return () => clearInterval(id);
    }, [autoRefreshMinutes, fetchRates]);

    const formatted = useMemo(() => {
        const effectiveRates = rates ?? FALLBACK_RATES;
        const rate = effectiveRates[currency];
        const converted = usdAmount * rate;
        const meta = META[currency];

        try {
            return new Intl.NumberFormat(meta.locale, {
                style: "currency",
                currency,
                minimumFractionDigits: meta.fraction,
                maximumFractionDigits: meta.fraction,
            }).format(converted);
        } catch {
            return `${currency} ${converted.toFixed(meta.fraction)}`;
        }
    }, [usdAmount, currency, rates]);

    return (
        <div className={`flex items-center ${className}`}>
            {/* 金额部分 - 自适应宽度 */}
            <div className="pl-2 min-w-0">
                <div className="text-2xl font-semibold text-gray-900 truncate" title={formatted}>
                    {formatted}
                </div>
            </div>

            {/* 币种选择器 - 使用 react-select */}
            <div className="shrink-0 mt-2">
                <Select<OptionType>
                    options={options}
                    value={options.find(opt => opt.value === currency)}
                    onChange={(selected) => selected && setCurrency(selected.value)}
                    components={{
                        SingleValue: CustomSingleValue,
                        Option: CustomOption,
                        DropdownIndicator: CustomDropdownIndicator
                    }}
                    styles={customStyles}
                    isSearchable={false}
                    classNamePrefix="currency-select"
                    menuPlacement="auto"
                />
            </div>
        </div>
    );
}