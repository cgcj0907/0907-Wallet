//app/walletManagement/lib/generateWallet.ts
/**
 * @file HD 钱包生成工具
 * @description 生成包含英文和中文助记词的钱包，使用 bip39 + ethers 实现。
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-28
 */

import * as bip39 from "bip39";
import { HDNodeWallet } from "ethers";

// 可选：中文词表（bip39 内置）
const wordlist_zh: string[] = bip39.wordlists.chinese_simplified;

export interface WalletResult {
  wallet: HDNodeWallet;
  mnemonic_en: string;
  mnemonic_zh: string;
}

/**
 * 生成包含英文与中文助记词的新钱包。
 *
 * 流程：
 * 1. 使用 ethers.Wallet.createRandom() 生成随机钱包（包含英文助记词）
 * 2. 使用钱包英文助记词的 entropy 作为基础
 * 3. 基于 entropy 转换为中文助记词
 * 4. 反算中文助记词的 entropy，确保与英文一致（一致性校验）
 *
 * @returns WalletResult - 包含钱包、英文助记词、中文助记词
 *
 * @throws Error - 当中文助记词反推的 entropy 与英文不一致时抛出异常
 */
export function generateWallet(): WalletResult {
  // 生成随机钱包（自动附带英文助记词）
  const random: HDNodeWallet = HDNodeWallet.createRandom();

  // 英文助记词（从随机钱包中解析）
  const entropy_en: string = random.mnemonic!.entropy.slice(2); // 去掉 "0x"
  const mnemonic_en = random.mnemonic!.phrase;

  // 根据英文 entropy 生成中文助记词
  const mnemonic_zh: string = bip39.entropyToMnemonic(entropy_en, wordlist_zh);

  // 中文助记词逆向推导 entropy，用于一致性验证
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
