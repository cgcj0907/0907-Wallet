import GenerateWallet from "./components/GenerateWallet";

/**
 * @file 钱包生成页面入口
 * @description 
 *  - 作为 /wallet/ 页面主体，直接渲染 GenerateWallet 组件
 *  - 页面结构保持最简，仅负责呈现组件，不包含业务逻辑
 *
 * @author 
 *   Guangyang Zhong | github: https://github.com/cgcj0907
 *
 * @date 
 *   2025-11-28
 */


export default function Page() {
    return (
        <GenerateWallet/>
    )
}