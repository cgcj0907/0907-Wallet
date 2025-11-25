import { Wallet } from "ethers";
import * as bip39 from "bip39";
import { HDNodeWallet } from "ethers";

// 可选：中文词表
const wordlist_zh: string[] = bip39.wordlists.chinese_simplified;

export interface WalletResult {
  wallet: HDNodeWallet;
  mnemonic_en: string;
  mnemonic_zh: string;
}

export function generateWallet(): WalletResult {
  // 生成随机钱包
  const random: HDNodeWallet = Wallet.createRandom();

  // 英文助记词
  const entropy_en: string = random.mnemonic!.entropy.slice(2);
  const mnemonic_en = random.mnemonic!.phrase;

  // 中文助记词
  const mnemonic_zh: string = bip39.entropyToMnemonic(entropy_en, wordlist_zh);

  // 验证一致性
  const entropy_zh: string = bip39.mnemonicToEntropy(mnemonic_zh, wordlist_zh);
  if (entropy_en !== entropy_zh) {
    throw new Error("中文助记词生成异常!");
  }

  return {
    wallet: random,
    mnemonic_en,
    mnemonic_zh,
  };
}
