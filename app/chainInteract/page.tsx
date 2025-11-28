'use client';
import { getEthereumTransactions } from "./etherum/lib/mainnet";
import { getBalance } from "./lib/account";
import { useEffect } from "react";


export default function Page() {

    useEffect(() => {
        (async () => {
            const data = await getBalance('0xda6c186a83F689437dbf9faa56Fc46CF908F8E72', 'zksync');
  
        })()

    }, [])
    return (
        <div>
        </div>
    )
}
