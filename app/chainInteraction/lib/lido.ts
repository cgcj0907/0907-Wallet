import { createEthereumBundlerClient, createEthereumPublicClient } from "../etherum/lib/mainnet";
import { DECIMALS } from "@/app/networkManagement/lib/details";
import { parseUnits, formatUnits } from "viem";
import { LIDO_ABI } from "../abi/LidoAbi";
import { getPrice } from "./priceFeed";
const CONTRACT_ADDRESS = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';



export async function submitToLido(keyPath: string, password: string, amountIn: string) {
    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);
    const hash = await bundlerClient.sendUserOperation({
        account: simple7702Account,
        calls: [
            {
                to: CONTRACT_ADDRESS,
                abi: LIDO_ABI,
                functionName: "submit",
                args: ["0x0000000000000000000000000000000000000000" as const],
                value: parseUnits(amountIn, DECIMALS["ethereum"])
            },
        ],
        authorization: authorization,
    });
    return hash;

}

export async function getLidoApr() {
    const res = await fetch("https://eth-api.lido.fi/v1/protocol/steth/apr/sma");
    const raw = await res.json();
    const apr = raw.data.smaApr;
    return apr;
}

export async function getRewardsHistory(address: string) {
    const res = await fetch(`https://reward-history-backend.lido.fi/?address=${address}`);
    const raw = await res.json();

    const {
        events = [],
        totals = {},
        averageApr = 0,
        ethToStEthRatio = 1,
        stETHCurrencyPrice = {},
        totalItems = 0,
    } = raw ?? {};

    // helper: 把 wei(string|number|bigint) 转成标准十进制 ETH 字符串（自动去尾零）
    function formatWeiToEth(weiVal: string | number | bigint | undefined | null) {
        if (weiVal === undefined || weiVal === null) return null;
        try {
            const wei = BigInt(String(weiVal));
            const WEI = 10n ** 18n;
            const whole = wei / WEI;
            const frac = wei % WEI;
            if (frac === 0n) return whole.toString();
            let fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
            return `${whole.toString()}.${fracStr}`;
        } catch (e) {
            return null;
        }
    }

    // 排序事件，取最新事件推断用户 balance
    const sortedByTime = Array.isArray(events)
        ? events.slice().sort((a: any, b: any) => {
            const ta = Number(a?.blockTime ?? a?.timestamp ?? 0);
            const tb = Number(b?.blockTime ?? b?.timestamp ?? 0);
            return ta - tb;
        })
        : [];

    const latestEvent = sortedByTime.length ? sortedByTime[sortedByTime.length - 1] : null;
    function pickBalanceFromEvent(ev: any) {
        if (!ev) return { balanceRaw: null, balanceETH: null, sharesRaw: null, shares: null, latestEventTimestamp: null };
        const balanceRaw =
            ev.balance ?? ev.balanceAfterIncrease ?? ev.balanceAfterDecrease ?? ev.balanceBeforeIncrease ?? null;
        const sharesRaw =
            ev.shares ?? ev.sharesAfterIncrease ?? ev.sharesAfterDecrease ?? ev.sharesBeforeIncrease ?? null;
        const latestEventTimestamp = Number(ev.blockTime ?? ev.timestamp ?? 0) || null;
        return {
            balanceRaw,
            balanceETH: formatWeiToEth(balanceRaw),
            sharesRaw,
            shares: sharesRaw ? String(sharesRaw) : null,
            latestEventTimestamp,
        };
    }

    const userBalance = pickBalanceFromEvent(latestEvent);

    // 提取奖励事件（type === "reward"）
    const rewardEvents = Array.isArray(events)
        ? events
            .filter((e: any) => e.type === "reward")
            .map((ev: any) => {
                const amountETH = (() => {
                    try {
                        if (ev.balanceAfterIncrease != null && ev.balanceBeforeIncrease != null) {
                            return formatWeiToEth(
                                BigInt(String(ev.balanceAfterIncrease)) - BigInt(String(ev.balanceBeforeIncrease))
                            );
                        }
                    } catch (e) { }
                    if (ev.change != null) return formatWeiToEth(ev.change);
                    if (ev.balanceAfterIncrease != null) return formatWeiToEth(ev.balanceAfterIncrease);
                    return null;
                })();

                const amountShares = (() => {
                    try {
                        if (ev.sharesAfterIncrease != null && ev.sharesBeforeIncrease != null) {
                            return String(BigInt(String(ev.sharesAfterIncrease)) - BigInt(String(ev.sharesBeforeIncrease)));
                        }
                    } catch (e) { }
                    if (ev.sharesAfterIncrease != null) return String(ev.sharesAfterIncrease);
                    return null;
                })();

                return {
                    timestamp: Number(ev.blockTime ?? ev.timestamp ?? 0),
                    amountETH,
                    amountShares,
                    txHash: ev.transactionHash ?? ev.txHash,
                    raw: ev,
                };
            })
        : [];

    return {
        /** 是否有 reward（布尔） */
        hasRewards: rewardEvents.length > 0,

        /** reward 事件数组 */
        rewardEvents,

        /** 累计奖励（后端提供） */
        totalRewardsETH: formatUnits(totals.ethRewards, DECIMALS['ethereum']) ?? 0,
        totalRewardsUSD: totals.currencyRewards ?? 0,

        /** APR（一般是 7 日 SMA） */
        averageApr: Number(averageApr),

        /** stETH 与 ETH 的兑换率 */
        ratio: typeof ethToStEthRatio === "string" || typeof ethToStEthRatio === "number"
            ? Number(ethToStEthRatio)
            : ethToStEthRatio ?? 1,

        /** stETH 的市场价格 */
        stethPriceETH: stETHCurrencyPrice?.eth ?? null,
        stethPriceUSD: stETHCurrencyPrice?.usd ?? null,

        /** 用户最新余额 */
        userBalance: {
            address,
            latestEventTimestamp: userBalance.latestEventTimestamp,
            balanceRaw: userBalance.balanceRaw ?? null,
            balanceETH: userBalance.balanceETH ?? null,
            sharesRaw: userBalance.sharesRaw ?? null,
            shares: userBalance.shares ?? null,
        },

        /** 原始事件数量 */
        totalItems,

        /** 原始后端返回 */
        _raw: raw,
    };
}


export async function getLidoTVL() {
    const client = createEthereumPublicClient();
    const data = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: LIDO_ABI,
        functionName: 'getTotalPooledEther',
    })
    const priceOfeth = await getPrice('ethereum', 'ethereum');
    const tvl = Number(formatUnits(data, DECIMALS['ethereum'])) * priceOfeth;
    console.log(tvl)
    return tvl;

}