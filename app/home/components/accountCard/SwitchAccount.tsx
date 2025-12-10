'use client';
import { useEffect, useState } from 'react';
import Select, {
  components,
  SingleValueProps,
  OptionProps,
  DropdownIndicatorProps,
  StylesConfig
} from 'react-select';
import { listAddresses, AddressRecord } from '@/app/walletManagement/lib/saveAddress';
import Avatar from 'boring-avatars';

// 定义选项类型
interface AddressOption {
  value: string;
  label: string;
  addressRecord: AddressRecord;
}

// 自定义单值显示组件
const SingleValue = (props: SingleValueProps<AddressOption>) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-3 py-1">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
            <Avatar
              name={data.addressRecord.address}
              size={40}
              variant="beam"
              colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-linear-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>
      </div>
    </components.SingleValue>
  );
};

// 自定义选项组件 - 美化版本
const Option = (props: OptionProps<AddressOption>) => {
  const { data, isSelected } = props;
  return (
    <components.Option {...props}>
      <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${isSelected
        ? 'bg-linear-to-r from-sky-50/80 to-blue-50/80 border border-sky-200 shadow-sm'
        : 'hover:bg-sky-50/60 border border-transparent hover:border-sky-100'
        }`}>
        <div className="relative">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Avatar
              name={data.addressRecord.address}
              size={44}
              variant="beam"
              colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
            />
          </div>
          {isSelected &&
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-linear-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-semibold text-sky-900 truncate">
              {data.label}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-sky-500 truncate font-mono bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
              {data.addressRecord.address.slice(0, 8)}...{data.addressRecord.address.slice(-6)}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <i className="fa-solid fa-arrow-right text-sky-400 text-xs"></i>
            </div>
          </div>
        </div>
      </div>
    </components.Option>
  );
};

// 自定义下拉指示器
const DropdownIndicator = (props: DropdownIndicatorProps<AddressOption>) => {
  return (
    <components.DropdownIndicator {...props}>
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-linear-to-br from-sky-50 to-blue-50 group-hover:from-sky-100 group-hover:to-blue-100 transition-all duration-300 shadow-sm border border-sky-100">
        <i className="fa-solid fa-chevron-down text-sky-500 text-xs"></i>
      </div>
    </components.DropdownIndicator>
  );
};

// 自定义菜单组件
const Menu = (props: any) => {
  return (
    <components.Menu {...props}>
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-sky-100 shadow-xl shadow-sky-100/30 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-sky-900">选择账户</h3>
              <p className="text-xs text-sky-600 mt-0.5 font-medium">
                共 {props.options.length} 个账户
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-white to-sky-50 flex items-center justify-center shadow-sm border border-sky-100">
              <i className="fa-solid fa-repeat" style={{ color: "#74C0FC" }}></i>
            </div>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-3">
          {props.children}
        </div>
      </div>
    </components.Menu>
  );
};

// 空状态组件
const NoOptionsMessage = (props: any) => {
  return (
    <components.NoOptionsMessage {...props}>
      <div className="py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-linear-to-br from-sky-100 to-blue-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <i className="fa-solid fa-user-plus text-sky-400 text-lg"></i>
        </div>
        <p className="text-sm font-medium text-sky-700">暂无账户</p>
        <p className="text-xs text-sky-400 mt-1">请先添加账户</p>
      </div>
    </components.NoOptionsMessage>
  );
};

// 自定义占位符组件
const Placeholder = (props: any) => {
  return (
    <components.Placeholder {...props}>
      <div className="flex items-center gap-3 py-1">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-sky-100 to-blue-100 flex items-center justify-center shadow-sm border border-sky-100">
          <i className="fa-solid fa-user text-sky-400"></i>
        </div>
      </div>
    </components.Placeholder>
  );
};

// 美化样式配置
const customStyles: StylesConfig<AddressOption, false> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'white',
    borderColor: state.isFocused ? 'rgba(125, 211, 252, 0.8)' : 'rgba(186, 230, 253, 0.6)',
    borderRadius: '16px',
    padding: '6px 16px',
    minHeight: 'auto',
    borderWidth: '1.5px',
    boxShadow: state.isFocused
      ? '0 4px 12px rgba(14, 165, 233, 0.15), 0 0 0 3px rgba(14, 165, 233, 0.1)'
      : '0 2px 8px rgba(14, 165, 233, 0.08)',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      borderColor: 'rgba(125, 211, 252, 1)',
      boxShadow: '0 4px 16px rgba(14, 165, 233, 0.15)',
      transform: 'translateY(-1px)'
    }
  }),
  container: (base) => ({
    ...base,
    minWidth: '180px',
    width: 'auto',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    minWidth: '300px',
    maxHeight: '50vh',
    overflow: 'auto',
    borderRadius: '0.5rem',
    animation: 'slideDown 0.2s ease-out'
  }),
  menuList: (base) => ({
    ...base,
    padding: 0
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: 'transparent',
    padding: '4px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: 'transparent'
    }
  }),
  singleValue: (base) => ({
    ...base,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  }),
  valueContainer: (base) => ({
    ...base,
    padding: 0,
    flex: '1 1 auto',
    minWidth: 0,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  }),
  indicatorSeparator: () => ({
    display: 'none'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#0ea5e9',
    fontWeight: 500,
    fontSize: '0.875rem',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    padding: '0',
    color: state.selectProps.menuIsOpen ? '#0ea5e9' : '#7dd3fc',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none',
    '&:hover': {
      color: '#0ea5e9'
    }
  })
};

export default function SwitchAccount({
  setAddressRecord,
  defaultAddressKey
}: {
  setAddressRecord: (addressRecord: AddressRecord) => void,
  defaultAddressKey?: string | null
}) {
  const [addressList, setAddressList] = useState<Array<{ key: IDBValidKey, addressRecord: AddressRecord }>>([]);
  const [selectedOption, setSelectedOption] = useState<AddressOption | null>(null);

  useEffect(() => {
    (async () => {
      const addressesList = await listAddresses();
      setAddressList(addressesList);

      const currentKey = defaultAddressKey || localStorage.getItem('currentAddressKeyPath');

      if (currentKey && addressesList.length > 0) {
        const currentItem = addressesList.find(item => item.key.toString() === currentKey);

        if (currentItem) {
          const option = {
            value: currentItem.key.toString(),
            label: currentItem.addressRecord.name,
            addressRecord: currentItem.addressRecord
          };
          setSelectedOption(option);
        } else {
          const firstItem = addressesList[0];
          const option = {
            value: firstItem.key.toString(),
            label: firstItem.addressRecord.name,
            addressRecord: firstItem.addressRecord
          };
          setSelectedOption(option);
          localStorage.setItem('currentAddressKeyPath', firstItem.key.toString());
          setAddressRecord(firstItem.addressRecord);
        }
      } else if (addressesList.length > 0) {
        const firstItem = addressesList[0];
        const option = {
          value: firstItem.key.toString(),
          label: firstItem.addressRecord.name,
          addressRecord: firstItem.addressRecord
        };
        setSelectedOption(option);
        localStorage.setItem('currentAddressKeyPath', firstItem.key.toString());
        setAddressRecord(firstItem.addressRecord);
      }
    })();
  }, []);

  const options: AddressOption[] = addressList.map(item => ({
    value: item.key.toString(),
    label: item.addressRecord.name,
    addressRecord: item.addressRecord
  }));

  const handleChange = (option: AddressOption | null) => {
    if (option) {
      setSelectedOption(option);
      localStorage.setItem('currentAddressKeyPath', option.value);

      setAddressRecord(option.addressRecord);
    }
  };

  return (
    <div className="relative">
      <Select<AddressOption>
        value={selectedOption}
        onChange={handleChange}
        options={options}
        components={{
          SingleValue,
          Option,
          DropdownIndicator,
          Menu,
          NoOptionsMessage,
          Placeholder
        }}
        styles={customStyles}
        isSearchable={false}
        placeholder=""
        className="react-select-container"
        classNamePrefix="react-select"
      />

      {/* 添加动画样式 */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .react-select__menu {
          animation: slideDown 0.2s ease-out;
        }
        
        /* 自定义滚动条 */
        .react-select__menu-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .react-select__menu-list::-webkit-scrollbar-track {
          background: rgba(224, 242, 254, 0.3);
          border-radius: 3px;
        }
        
        .react-select__menu-list::-webkit-scrollbar-thumb {
          background: rgba(125, 211, 252, 0.6);
          border-radius: 3px;
        }
        
        .react-select__menu-list::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.8);
        }
      `}</style>
    </div>
  );
}

