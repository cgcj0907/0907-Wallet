import { useMemo, useState } from 'react';
import Select, { components, SingleValueProps, OptionProps, DropdownIndicatorProps } from 'react-select';
import * as Web3Icons from '@web3icons/react';
import {
    TOKEN_ICON_MAP,
    TOKEN_SYMBOL_MAP,
    TOKEN_LIST
} from '@/app/networkManagement/lib/details'

type Props = {
    network: string | null;
    token: string | null;
    setToken: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

type OptionType = {
    value: string;
    label: string;
};

const customStyles = {
    control: (base: any, state: any) => ({
        ...base,
        minHeight: '48px',
        backgroundColor: '#FFFFFF',
        borderColor: state.isFocused ? '#38BDF8' : '#E2E8F0',
        borderWidth: '2px',
        borderRadius: '12px',
        boxShadow: state.isFocused
            ? '0 0 0 4px rgba(56, 189, 248, 0.08)'
            : '0 2px 8px rgba(148, 163, 184, 0.04)',
        transition: 'all 200ms ease-in-out',
        cursor: 'pointer',
        '&:hover': {
            borderColor: '#7DD3FC',
        },
        opacity: state.isDisabled ? 0.6 : 1,
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: '#FFFFFF',
        border: '2px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(56, 189, 248, 0.06)',
        marginTop: '8px',
        zIndex: 9999,
    }),
    menuList: (base: any) => ({
        ...base,
        padding: '8px',
        overflowY: 'auto'
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
            ? '#F0F9FF'
            : state.isFocused
                ? '#EFF9FF'
                : 'transparent',
        color: state.isSelected ? '#0C4A6E' : '#334155',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 150ms ease',
    }),
    placeholder: (base: any) => ({
        ...base,
        color: '#94A3B8',
        fontSize: '14px',
        fontWeight: 400,
    }),
    singleValue: (base: any) => ({
        ...base,
        color: '#0C4A6E',
        fontWeight: 600,
    }),
    dropdownIndicator: (base: any, state: any) => ({
        ...base,
        color: '#7DD3FC',
        padding: '0 16px',
        transition: 'all 200ms ease',
        transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0)',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    input: (base: any) => ({
        ...base,
        color: '#0C4A6E',
    }),
    noOptionsMessage: (base: any) => ({
        ...base,
        color: '#94A3B8',
        padding: '24px 16px',
        textAlign: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: '8px',
    }),
    loadingMessage: (base: any) => ({
        ...base,
        color: '#7DD3FC',
        padding: '24px',
    }),
};

// 自定义下拉指示器
const DropdownIndicator = (props: DropdownIndicatorProps<OptionType>) => {
    return (
        <components.DropdownIndicator {...props}>
            <div className="flex items-center justify-center">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                    style={{
                        transform: props.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0)'
                    }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>
        </components.DropdownIndicator>
    );
};

export default function SelectToken({
    network,
    token,
    setToken,
    disabled = false,
    className = ''
}: Props) {
    const [isLoading, setIsLoading] = useState(false);

    if (!network) {
        return (
            <div className={`relative ${className}`}>
                <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 text-center shadow-sm">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-blue-900 font-semibold text-sm mb-1">Select Network First</h3>
                    <p className="text-blue-600 text-xs">
                        Choose a network to see available tokens
                    </p>
                </div>
            </div>
        );
    }

    const tokenList = TOKEN_LIST[network] ?? [];


    const options: OptionType[] = useMemo(() => {
        return tokenList.map((t: string) => ({
            value: t,
            label: TOKEN_SYMBOL_MAP[t] ?? t,
        }));
    }, [tokenList]);

    const getLocalLogoUrl = (tokenId: string) => {
        const iconFile = TOKEN_ICON_MAP[tokenId];
        if (iconFile) return `/tokens/${iconFile}`;
        return null;
    };

    // ---------- 简化后的 renderIcon：去掉外层包裹与复杂光效，使用单一淡蓝背景 ----------
    const renderIcon = (tokenId?: string, sizeClass: string = "w-7 h-7") => {
        if (!tokenId) return null;
        const symbol = TOKEN_SYMBOL_MAP[tokenId] ?? tokenId;
        const compName = `Token${String(symbol).replace(/[^A-Za-z0-9]/g, '')}`;
        const IconComp = (Web3Icons as any)[compName];



        if (IconComp) {
            try {
                return (
                    <div >
                        <IconComp variant="branded" size={Math.min(22, 24)} />
                    </div>
                );
            } catch (e) {
                // fallback to image/text
            }
        }

        const local = getLocalLogoUrl(tokenId);
        if (local) {
            return (
                <img
                    src={local}
                    alt={`${tokenId} logo`}
                    onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.style.display = 'none';
                    }}
                />
            );
        }

        // Fallback initials (两字母)
        const initials = symbol.substring(0, 2).toUpperCase();
        return (
            <div className={" font-semibold text-sm"}>
                {initials}
            </div>
        );
    };

    // 自定义 Option
    const CustomOption = (props: OptionProps<OptionType>) => {
        const { data, isSelected, isFocused } = props;

        return (
            <components.Option {...props}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        {renderIcon(data.value, "w-8 h-8")}
                        <div className="text-sm font-semibold text-blue-900">
                            {data.label}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center">
                                <svg className="w-3 h-3 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </components.Option>
        );
    };

    // 自定义 SingleValue
    const CustomSingleValue = (props: SingleValueProps<OptionType>) => {
        const { data } = props;

        return (
            <components.SingleValue {...props}>
                <div className="flex items-center gap-3">
                    {renderIcon(data.value, "w-8 h-8")}
                    <span className="text-sm font-bold text-blue-900">
                        {data.label}
                    </span>
                </div>
            </components.SingleValue>
        );
    };

    // 自定义占位符（也简化颜色）
    const CustomPlaceholder = (props: any) => {
        return (
            <components.Placeholder {...props}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <span className="text-blue-800 font-medium">Select Token</span>
                </div>
            </components.Placeholder>
        );
    };

    const currentValue = options.find(o => o.value === token) ?? null;

    return (
        <div className={`relative ${className}`}>

            {/* 选择器 */}
            <div className="relative">
                <Select<OptionType>
                    options={options}
                    value={currentValue}
                    onChange={(opt) => {
                        setIsLoading(true);
                        setTimeout(() => {
                            setToken(opt ? opt.value : '');
                            setIsLoading(false);
                        }, 200);
                    }}
                    isClearable={false}
                    isDisabled={disabled || tokenList.length === 0}
                    isLoading={isLoading}
                    components={{
                        Option: CustomOption,
                        SingleValue: CustomSingleValue,
                        DropdownIndicator,
                        Placeholder: CustomPlaceholder,
                        IndicatorSeparator: null,
                    }}
                    placeholder="Select token"
                    classNamePrefix="custom-select"
                    styles={customStyles}
                    noOptionsMessage={() => (
                        <div className="py-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="text-blue-800 font-medium mb-1">No tokens found</div>
                            <div className="text-blue-600/70 text-sm">Try selecting a different network</div>
                        </div>
                    )}
                    loadingMessage={() => (
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                            <div className="text-blue-600 text-sm">Loading tokens...</div>
                        </div>
                    )}
                />
            </div>

            {/* 加载遮罩 */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 border-2 border-blue-100">
                    <div className="text-center">
                        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-blue-600 text-sm font-medium">Updating...</p>
                    </div>
                </div>
            )}

        </div>

    );
}