import { NextResponse } from "next/server";
import { ETHEREUM_TOKEN_ADDRESS } from "@/app/networkManagement/lib/details";

const BASE_URL = "https://api.0x.org/swap/allowance-holder/quote?";
const API_KEY = process.env.NEXT_PUBLIC_0X_API_KEY!;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const inputToken = searchParams.get("inputToken")!;
    const outputToken = searchParams.get("outputToken")!;
    const sellAmount = searchParams.get("sellAmount")!;
    const chainId = searchParams.get("chainId")!;
    const address = searchParams.get("address")!;

    const inputAddr = ETHEREUM_TOKEN_ADDRESS[inputToken.toLowerCase()];
    const outputAddr = ETHEREUM_TOKEN_ADDRESS[outputToken.toLowerCase()];

    if (!inputAddr || !outputAddr) {
        return NextResponse.json({ error: "Invalid token symbol" }, { status: 400 });
    }

    const url = `${BASE_URL}sellAmount=${sellAmount}&taker=${address}&chainId=${chainId}&sellToken=${inputAddr}&buyToken=${outputAddr}`;

    const res = await fetch(url, {
        headers: {
            "0x-api-key": API_KEY,
            "0x-version": "v2",
        },
    });

    const json = await res.json();
    return NextResponse.json(json);
}
