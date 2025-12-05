'use client';


import ConfirmedTransaction from './transactionCard/ConfirmedTransaction'
import PendingTransaction from './transactionCard/PendingTransaction';


type props = {
  address: string | undefined,
  network: string | null,
}

export default function TransactionCard({ address, network }: props) {



  return (
    <div className="p-4 space-y-1 caret-transparent min-h-80">
      <h2 className="text-2xl font-semibold mb-2">Transactions</h2>

      <PendingTransaction network={network} address={address} />

      <ConfirmedTransaction network={network} address={address} />
    </div>
  );
}
