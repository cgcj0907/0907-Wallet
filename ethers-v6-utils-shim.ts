/**
 * shim: 将 ethers v6 的导出重新命名为 v5 风格常用工具函数集
 * 如果 SDK 需要更多函数，可在这里继续从 'ethers' 导出并添加到下面的 export 列表中
 */

import {
  isAddress,
  getAddress,
  formatEther,
  parseEther,
  formatUnits,
  parseUnits,
  hexlify,
  concat,
  keccak256,
  toUtf8Bytes,

  // 如需其它函数，继续在这里导入
} from "ethers";

export {
  isAddress,
  getAddress,
  formatEther,
  parseEther,
  formatUnits,
  parseUnits,
  hexlify,

  concat,
  keccak256,
  toUtf8Bytes,
};
