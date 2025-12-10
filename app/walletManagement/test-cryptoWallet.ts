import * as bip39 from "bip39";
import { HDNodeWallet } from "ethers";

// === 中文词表 ===
const wordlist_zh = bip39.wordlists.chinese_simplified;

// === 你的两个钱包导入函数 ===
export function importWallet_en(phrase: string): HDNodeWallet {
  return HDNodeWallet.fromPhrase(phrase);
}

export function importWallet_zh(phrase: string): HDNodeWallet {
  // 中文 → entropy
  const entropy_zh: string = bip39.mnemonicToEntropy(phrase, wordlist_zh);
  // entropy → 英文助记词
  const phrase_en: string = bip39.entropyToMnemonic(entropy_zh);
  // 英文助记词 → HDNodeWallet
  return importWallet_en(phrase_en);
}

// === 不使用 seed，只对比中英 entropy 和钱包 ===
export function testMnemonicConsistency() {
  console.log("=== 测试 bip39 中文/英文 一致性（无 seed 导入） ===");

  // 1. 生成随机钱包（英文助记词）
  const randomWallet = HDNodeWallet.createRandom();
  const mnemonic_en = randomWallet.mnemonic!.phrase;
  const entropy_en = randomWallet.mnemonic!.entropy.slice(2);

  console.log("\n[英文助记词]");
  console.log(mnemonic_en);

  // 2. entropy → 中文助记词
  const mnemonic_zh = bip39.entropyToMnemonic(entropy_en, wordlist_zh);
  console.log("\n[中文助记词]");
  console.log(mnemonic_zh);

  // 3. 中文 → entropy（验证是否一致）
  const entropy_zh = bip39.mnemonicToEntropy(mnemonic_zh, wordlist_zh);

  console.log("\n[中文反推 entropy]");
  console.log(entropy_zh);

  if (entropy_en !== entropy_zh) {
    console.log("❌ 中英文 entropy 不一致！");
    return;
  }
  console.log("✔ 中英文 entropy 一致");

  // 4. 用三种方式导入钱包（无 seed）
  const wallet_from_en = importWallet_en(mnemonic_en);
  const wallet_from_zh = importWallet_zh(mnemonic_zh);

  console.log("\n=== 地址对比（无 seed 导入） ===");
  console.log("原始随机钱包地址          :", randomWallet.address);
  console.log("英文助记词导入(ethers)     :", wallet_from_en.address);
  console.log("中文助记词导入(import zh) :", wallet_from_zh.address);

  // 5. 验证所有钱包是否一致
  const allEqual =
    randomWallet.privateKey === wallet_from_en.privateKey &&
    randomWallet.privateKey === wallet_from_zh.privateKey;

  console.log("\n=== 最终结果 ===");
  if (allEqual) {
    console.log("✔ 所有导入方式完全一致（无 seed 流程）！");
  } else {
    console.log("❌ 存在不一致！");
  }

  console.log("\n=== 测试结束 ===");
}

testMnemonicConsistency();
