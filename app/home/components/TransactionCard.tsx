'use client';


import { useState } from 'react';
import ConfirmedTransaction from './transactionCard/ConfirmedTransaction'
import PendingTransaction from './transactionCard/PendingTransaction';
import SelectToken from './transactionCard/SelectToken';


type props = {
  address: string | undefined,
  network: string | null,
}

export default function TransactionCard({ address, network }: props) {

  const [token, setToken] = useState<string | null>(network)

  return (
    <div className="caret-transparent min-h-90 max-h-[40vh] overflow-y-auto">
      <PendingTransaction network={network} address={address} />
      <SelectToken network={network} token={token} setToken={setToken} />
      <ConfirmedTransaction network={network} address={address} token={token} />
    </div>
  );
}
