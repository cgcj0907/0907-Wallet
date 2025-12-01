import { getWallet } from "@/app/walletManagement/lib/saveWallet";
import { decryptWallet } from "@/app/walletManagement/lib/cryptoWallet";

import { ethers } from 'ethers';

// ================= 工具函数 =================
function getPrivateKeyFromMnemonic(mnemonic: string): string {
    if (!ethers.Mnemonic.isValidMnemonic(mnemonic)) {
        throw new Error("Invalid mnemonic");
    }

    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return wallet.privateKey;
}

export async function getPrivateKey(
    keyPath: string,
    password: string
): Promise<string> {
    const cryptedWallet = await getWallet(keyPath);

    if (!cryptedWallet) throw new Error("钱包读取异常");


    const wallet = await decryptWallet(cryptedWallet, password);


    const privateKey = getPrivateKeyFromMnemonic(wallet.mnemonic!.phrase) as `0x${string}`;
    return privateKey;
}