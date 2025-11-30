/**
 * @file HD 钱包导入函数库
 * @description 提供英文/中文助记词导入 HDNodeWallet 的工具函数。
 * 支持 BIP-39 标准：英文直接导入，中文先转换为英文再导入。
 * 使用 ethers.js 的 HDNodeWallet.fromPhrase 方法。
 * @author Guangyang Zhong | github: https://github.com/cgcj0907
 * @date 2025-11-29
 */

import * as bip39 from "bip39";
import { HDNodeWallet, Mnemonic } from "ethers";

// 可选：中文词表（bip39 内置）
const wordlist_zh: string[] = bip39.wordlists.chinese_simplified;

/**
 * 从英文助记词导入 HDNodeWallet。
 * @param {string} phrase - 英文助记词短语（12 或 24 个词，用空格分隔）。
 * @returns {HDNodeWallet} 生成的 HDNodeWallet 实例。
 */
export function importWallet_en(phrase: string) : HDNodeWallet{
    const wallet: HDNodeWallet = HDNodeWallet.fromPhrase(phrase);
    return wallet;
}

/**
 * 从中文助记词异步导入 HDNodeWallet。
 * 先将中文助记词转换为 entropy，再转换为英文助记词，最后调用 importWallet_en 生成钱包。
 * @param {string} phrase - 中文助记词短语（12 或 24 个词，用空格分隔）。
 * @returns {Promise<HDNodeWallet>} Promise 解析为生成的 HDNodeWallet 实例。
 */
export async function importWallet_zh(phrase: string) : Promise<HDNodeWallet> {
   const entropy_zh: string = bip39.mnemonicToEntropy(phrase, wordlist_zh);
   const phrase_en: string = bip39.entropyToMnemonic(entropy_zh);
    const wallet: HDNodeWallet = importWallet_en(phrase_en);
    return wallet;
}