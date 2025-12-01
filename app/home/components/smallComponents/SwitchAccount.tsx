'use client';
import { useEffect, useState } from 'react';
import { listAddresses, AddressRecord } from '@/app/walletManagement/lib/saveAddress';
import Avatar from 'boring-avatars';

export default function SwitchAccount({
    setAddressRecord,
    setSwitchAccountOpen
}: {
    setAddressRecord: (addressRecord: AddressRecord) => void,
    setSwitchAccountOpen: (v: boolean) => void
}) {
    const [addressList, setAddressList] = useState<Array<{ key: IDBValidKey, addressRecord: AddressRecord }>>([]);

    useEffect(() => {
        (async () => {
            const addressesList = await listAddresses();
            setAddressList(addressesList);
        })();
    }, []);

    const handleSwitchAccount = (addressRecord: AddressRecord, keyPath: IDBValidKey) => {
        localStorage.setItem('currentAddressKeyPath', keyPath.toString());
        setAddressRecord(addressRecord);
        setSwitchAccountOpen(false);
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-lg p-4 w-80 relative border border-sky-100 shadow-lg">
                <div className="flex justify-between items-center">


                    <h2 className="text-lg font-semibold mb-4 text-sky-700">切换账户</h2>
                    {/* 关闭按钮 */}
                    <button
                        className="mb-4 ml-12 text-sky-400 hover:text-sky-700"
                        onClick={() => setSwitchAccountOpen(false)}
                    >
                        <i className="fa-regular fa-rectangle-xmark fa-2xl"></i>
                    </button>
                </div>

                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                    {addressList.map(({ key, addressRecord }) => (
                        <div
                            key={key.toString()}
                            className="flex items-center gap-3 p-2 hover:bg-sky-100 rounded cursor-pointer transition-colors duration-200"
                            onClick={() => handleSwitchAccount(addressRecord, key)}
                        >
                            <Avatar
                                name={addressRecord.address}
                                size={36}
                                variant="beam"
                                colors={["#FFFFFF", "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5"]}
                            />
                            <span className="text-sm font-mono truncate text-sky-800">{addressRecord.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
