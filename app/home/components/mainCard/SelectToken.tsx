'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import * as Web3Icons from '@web3icons/react';
import { getBalance as fetchBalance } from '@/app/chainInteraction/lib/account';
import {
  TOKEN_ICON_MAP,
  NATIVE_TOKEN
} from '@/app/networkManagement/lib/details'

type Props = {
  availableTokens: string[];
  token: string | undefined;
  setToken: React.Dispatch<React.SetStateAction<string | undefined>>;
  address?: string;
  network?: string;
};

type Option = {
  value: string;
  label: string;
  isNative: boolean;
};


function renderIconLocal(token: string, networkOverride?: string) {
  const tryGetFile = (key: string | undefined) => {
    if (!key) return undefined;
    const lower = key.toLowerCase();
    return TOKEN_ICON_MAP[lower] ?? TOKEN_ICON_MAP[key] ?? undefined;
  };

  // 如果传入的 token 为空或 '原生币'，仍然回退到使用 networkOverride 去找资源
  if (!token || token === '原生币') {
    const nk = (networkOverride ?? 'ethereum').toString().toLowerCase();
    const nativeFile = tryGetFile(nk);
    const src = nativeFile ? `/tokens/${nativeFile}` : `/tokens/${nk}.png`;
    return (
      <div className="relative shrink-0">
        <img
          src={src}
          alt={`${nk} logo`}
          className="w-8 h-8 rounded-full object-cover bg-linear-to-br from-blue-50 to-white border border-blue-100 shadow-sm"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            img.src = '/tokens/placeholder.png';
          }}
        />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" />
          </svg>
        </div>
      </div>
    );
  }

  const file = tryGetFile(token) ?? `${token.toLowerCase()}.png`;
  const src = `/tokens/${file}`;
  const compName = `Token${String(token).toUpperCase().replace(/[^A-Za-z0-9]/g, '')}`;
  const IconComp = (Web3Icons as any)[compName];
  
  if (IconComp) {
    try {
      return (
        <div className="shrink-0">
          <IconComp variant="branded" size={32} className="rounded-full" />
        </div>
      );
    } catch {
      // fallback to image
    }
  }

  return (
    <img
      src={src}
      alt={`${token} logo`}
      className="w-8 h-8 rounded-full object-cover bg-linear-to-br from-gray-50 to-white border border-gray-100 shadow-sm shrink-0"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        img.onerror = null;
        img.src = '/tokens/placeholder.png';
      }}
    />
  );
}

export default function SelectToken({
  availableTokens,
  token,
  setToken,
  address,
  network = 'ethereum',
}: Props) {
  const networkKey = (network ?? 'ethereum').toString().toLowerCase();

  const options: Option[] = useMemo(
    () => [
      { value: network, label: '原生币', isNative: true },
      ...availableTokens.map((t) => ({ 
        value: t.toUpperCase(), 
        label: t.toUpperCase(),
        isNative: false 
      })),
    ],
    [availableTokens]
  );

  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBalances({});
      return;
    }

    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const entries = await Promise.all(
          options.map(async (opt) => {
            try {
              const tokenParam = opt.isNative ? networkKey || networkKey : opt.value;
              const b = await fetchBalance(network, address, tokenParam);
              return [opt.value, b ?? '0'] as [string, string];
            } catch (e) {
              console.error(`Error fetching balance for ${opt.value}:`, e);
              return [opt.value, '-'] as [string, string];
            }
          })
        );

        if (!mounted) return;
        const map: Record<string, string> = {};
        for (const [k, v] of entries) map[k] = v;
        setBalances(map);
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [address, networkKey, JSON.stringify(options)]);

  const balanceText = (optValue: string) => {
    if (!address) return '';
    const b = balances[optValue];
    if (b === undefined) return loading ? '加载中...' : '-';
    return `${b}`;
  };

  const formatOptionLabel = (option: Option, ctx: any) => {
    const optValue = option.value;
    const label = option.label;
    const bal = balanceText(optValue);

    if (option.isNative) {
      // 使用 NATIVE_TOKEN[networkKey] 作为 token 名来获取 icon（优先）
      const displayLabel = NATIVE_TOKEN[networkKey] ?? (networkKey.toUpperCase() || '原生');
      const nativeIconKey = NATIVE_TOKEN[networkKey] ?? networkKey;
      return (
        <div className="flex items-center justify-between m-0 px-3 py-3 hover:bg-blue-50 transition-colors rounded-lg">
          <div className="flex items-center gap-3">
            {renderIconLocal(nativeIconKey, networkKey)}
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-900">{displayLabel}</span>
              <span className="text-xs text-gray-500">native</span>
            </div>
          </div>
          <div className="flex flex-col  items-end">
            <span className="font-medium text-gray-900">{bal}</span>
          </div>
        </div>
      );
    }

    const displayLabel = label || optValue;
    return (
      <div className="flex items-center justify-between w-full px-3 py-3 hover:bg-blue-50 transition-colors rounded-lg">
        <div className="flex items-center gap-3">
          {renderIconLocal(label)}
          <div className="flex flex-col items-start">
            <span className="font-medium text-gray-900">{displayLabel}</span>
            <span className="text-xs text-gray-500">ERC-20</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-medium text-gray-900">{bal}</span>
        </div>
      </div>
    );
  };

  const SingleValue = (props: any) => {
    const opt: Option = props.data;
    const bal = balanceText(opt.value);

    if (opt.isNative) {
      const displayLabel = NATIVE_TOKEN[networkKey] ?? networkKey.toUpperCase();
      const nativeIconKey = NATIVE_TOKEN[networkKey] ?? networkKey;
      return (
        <div className="flex items-center gap-3 w-full">
          {renderIconLocal(nativeIconKey, networkKey)}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{displayLabel}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">native</span>
            </div>
            {address && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500 whitespace-nowrap">余额:</span>
                <span className="font-medium text-gray-700 truncate">{bal}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 w-full">
        {renderIconLocal(opt.label)}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{opt.label}</span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">ERC-20</span>
          </div>
          {address && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-500 whitespace-nowrap">余额:</span>
              <span className="font-medium text-gray-700 truncate">{bal}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">

      <div className="relative">
        <Select
          options={options}
          value={token ? options.find(opt => opt.value === token.toLowerCase()) : options[0]}
          onChange={(opt: any) => {
            const v = opt?.value;
            setToken(v ? v.toLowerCase() : undefined);
          }}
          formatOptionLabel={formatOptionLabel}
          // 禁用搜索
          isSearchable={false}
          components={{ 
            SingleValue,
            DropdownIndicator: () => (
              <div className="pr-3 flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            ),
            IndicatorSeparator: null,
          }}
          styles={{
            control: (base: any, state: any) => ({
              ...base,
              background: '#ffffff',
              borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
              borderWidth: '2px',
              boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
              borderRadius: '12px',
              padding: '8px 0',
              minHeight: '64px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#93c5fd',
              },
              display: 'flex',
              alignItems: 'center',
            }),
            valueContainer: (base: any) => ({
              ...base,
              margin: 0,
              padding: '0 12px',
              paddingBottom: 0,
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              flex: 1,
              '& > div': {
                display: 'flex !important',
                alignItems: 'center',
                width: '50%',
              },
            }),
            singleValue: (base: any) => ({
              ...base,
              margin: 0,
              padding: 0,
              paddingBottom: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gridArea: 'unset !important',
            }),
            placeholder: (base: any) => ({
              ...base,
              margin: 0,
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
            }),
            option: (base: any, state: any) => ({
              ...base,
              padding: 0,
              margin: ' ',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: state.isSelected ? '#1e40af' : '#374151',
              '&:hover': {
                backgroundColor: '#eff6ff',
              },
              '&:active': {
                backgroundColor: '#dbeafe',
              },
            }),
            menu: (base: any) => ({
              ...base,
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              marginTop: '4px',
              zIndex: 9999,
            }),
            menuList: (base: any) => ({
              ...base,
              padding: '8px',
              maxHeight: '280px',
            }),
            input: (base: any) => ({
              ...base,
              display: 'none',
            }),
          }}
          className="w-full"
          classNamePrefix="select-token"
          isClearable={false}
          placeholder={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-500">选择代币...</span>
            </div>
          }
        />
        
        {loading && address && (
          <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
    </div>
  );
}