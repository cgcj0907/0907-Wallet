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
    EUR: { locale: "en-US", fraction: 2 },
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
    address: string | undefined;
    cacheMinutes?: number;
    autoRefreshMinutes?: number | 0;
    className?: string;
};

type CachedPayload = { ts: number; rates: Record<string, number>; source?: string };
const CACHE_KEY = "mc_rates_open_er_api_v1";

/**
 * LAST_TOTAL_KEY 存储结构现在为：
 * {
 *   [addressLower]: {
 *     [currency]: { amount: number, ts: number }
 *   },
 *   ...
 * }
 *
 * localStorage key: "lastTotalBalance"
 */
const LAST_TOTAL_KEY = "lastTotalBalance";

type LastEntry = { amount: number; ts: number };

type LastRoot = Record<string, Record<string, LastEntry>>; // address -> currency -> LastEntry

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
        border: 'none',
        boxShadow: 'none',
        borderRadius: '0.375rem',
        minHeight: '32px',
        minWidth: '80px',
        '&:hover': {
            border: 'none',
        },
        outline: 'none',
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '0 6px',
    }),
    singleValue: (base) => ({
        ...base,
        margin: 0,
        padding: '0 0 0 10px',
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
    address,
    cacheMinutes = 10,
    autoRefreshMinutes = 0,
    className = "",
}: Props) {
    const [currency, setCurrency] = useState<Currency>("USD");
    const [rates, setRates] = useState<Record<Currency, number> | null>(null);
    const [lastBalanceRefresh, setLastBalanceRefresh] = useState<number>(Date.now()); // 新增：用于触发刷新

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

    // numeric converted amount (in selected currency)
    const numericConverted = useMemo(() => {
        const effectiveRates = rates ?? FALLBACK_RATES;
        const rate = effectiveRates[currency];
        return usdAmount * rate;
    }, [usdAmount, currency, rates]);

    const formatted = useMemo(() => {
        const meta = META[currency];
        try {
            return new Intl.NumberFormat(meta.locale, {
                style: "currency",
                currency,
                minimumFractionDigits: meta.fraction,
                maximumFractionDigits: meta.fraction,
            }).format(numericConverted);
        } catch {
            return `${currency} ${numericConverted.toFixed(META[currency].fraction)}`;
        }
    }, [numericConverted, currency]);

    // 新增：手动刷新lastTotalBalance的函数
    const refreshLastTotalBalance = useCallback(() => {
        if (!address) return;
        try {
            const raw = localStorage.getItem(LAST_TOTAL_KEY);
            let root: LastRoot = {};
            if (raw) {
                try {
                    root = JSON.parse(raw) || {};
                } catch {
                    root = {};
                }
            }

            const addrKey = address.toLowerCase();
            const bucket = root[addrKey] || {};
            // 强制更新为当前值，无论时间间隔
            bucket[currency] = { amount: numericConverted, ts: Date.now() };
            root[addrKey] = bucket;
            localStorage.setItem(LAST_TOTAL_KEY, JSON.stringify(root));
            
            // 触发重新计算百分比变化
            setLastBalanceRefresh(Date.now());
            
        } catch (err) {
            console.error("刷新基准值失败", err);
        }
    }, [address, currency, numericConverted]);

    /**
     * lastTotalBalance 管理逻辑（按地址关联）：
     * - localStorage key: LAST_TOTAL_KEY ("lastTotalBalance")
     * - value: JSON object { [addressLower]: { [currency]: { amount, ts } } }
     * - 规则：如果没有历史记录 -> 创建；如果有记录且 (now - ts) > 24h -> 更新为当前值；否则不更新
     *
     * 注意：如果 address 未提供，则不会读写历史记录（避免混淆不同用户）
     */
    useEffect(() => {
        if (!address) return; // 无地址则不读写
        try {
            const raw = localStorage.getItem(LAST_TOTAL_KEY);
            const now = Date.now();
            let root: LastRoot = {};
            if (raw) {
                try {
                    root = JSON.parse(raw) || {};
                } catch {
                    root = {};
                }
            }

            const addrKey = address.toLowerCase();
            const bucket = root[addrKey] || {};
            const existing = bucket[currency];
            const ONE_DAY = 24 * 60 * 60 * 1000;

            if (!existing) {
                // 没有历史，写入当前作为基准
                bucket[currency] = { amount: numericConverted, ts: now };
                root[addrKey] = bucket;
                localStorage.setItem(LAST_TOTAL_KEY, JSON.stringify(root));
            } else {
                // 有历史：只有在超过 24h 时才更新为当前值（否则保持旧的）
                if (now - existing.ts > ONE_DAY) {
                    bucket[currency] = { amount: numericConverted, ts: now };
                    root[addrKey] = bucket;
                    localStorage.setItem(LAST_TOTAL_KEY, JSON.stringify(root));
                }
            }
        } catch (err) {
            // ignore localStorage errors
            console.error("lastTotalBalance storage error", err);
        }
    }, [numericConverted, currency, address]);

    // 计算与 lastTotalBalance 的百分比变化（用于显示），按地址查找
    const pctChangeInfo = useMemo(() => {
        if (!address) return null;
        try {
            const raw = localStorage.getItem(LAST_TOTAL_KEY);
            if (!raw) return null;
            const root = JSON.parse(raw) as LastRoot;
            const addrKey = address.toLowerCase();
            const bucket = root?.[addrKey];
            const entry = bucket?.[currency];
            if (!entry) return null;
            const last = entry.amount;
            const now = numericConverted;
            if (typeof last !== "number" || last === 0) return null; // 无法计算或除以0
            const diff = now - last;
            const pct = (diff / last) * 100;
            return {
                pct,
                isPositive: pct > 0,
                last,
                lastTs: entry.ts,
            };
        } catch {
            return null;
        }
    }, [numericConverted, currency, address, lastBalanceRefresh]); // 新增：依赖lastBalanceRefresh

    // 格式化百分比展示
    const pctDisplay = useMemo(() => {
        if (!pctChangeInfo) return null;
        const { pct, isPositive } = pctChangeInfo;
        const sign = pct > 0 ? "+" : "";
        // 保留两位小数
        return {
            text: `${sign}${pct.toFixed(2)}%`,
            className: isPositive ? "text-green-600" : "text-red-600"
        };
    }, [pctChangeInfo]);

    return (
        <div className={`flex items-center ${className}`}>
            {/* 金额部分 - 自适应宽度 */}
            <div className="pl-2 min-w-0">
                <div className="text-4xl font-semibold text-gray-900 truncate" title={formatted}>
                    {formatted}
                </div>

                {/* 新增：涨跌百分比展示，及可选的历史时间提示 */}
                <div className="mt-1 flex items-center gap-2">
                    {pctDisplay ? (
                        <div className={`text-sm font-medium ${pctDisplay.className}`}>
                            {pctDisplay.text}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400">0.00%</div>
                    )}

                    {pctChangeInfo && (
                        <>
                            <div
                                className="text-xs text-gray-500"
                                title={`基准时间: ${new Date(pctChangeInfo.lastTs).toLocaleString()}; 基准值: ${pctChangeInfo.last}`}
                            >
                                (基准：{new Intl.NumberFormat(META[currency].locale, {
                                    style: "currency",
                                    currency,
                                    minimumFractionDigits: META[currency].fraction,
                                    maximumFractionDigits: META[currency].fraction,
                                }).format(pctChangeInfo.last)})
                            </div>
                            
                            {/* 新增：刷新按钮 */}
                            <button
                                onClick={refreshLastTotalBalance}
                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                                title="刷新基准值（校准不同步问题）"
                                aria-label="刷新基准值"
                            >
                                <svg
                                    className="w-3 h-3 text-gray-500 hover:text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            </button>
                        </>
                    )}
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