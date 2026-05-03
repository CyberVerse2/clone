import { NextResponse } from "next/server";
import {
  fetchUniswapExecutableQuote,
  fetchUniswapPrice,
  hasUniswapApiKey,
  type UniswapSwapMode
} from "@/lib/chain/uniswap";

/**
 * GET /api/swap?type=price|quote&mode=buy|sell&tokenAddress=0x...&sellAmount=123&taker=0x...
 *
 * Proxies to the Uniswap Trading API, keeping the API key server-side.
 *
 * Buy mode:  sell USDC → buy proxy token
 * Sell mode: sell proxy token → buy USDC
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "price"; // "price" or "quote"
  const mode = (searchParams.get("mode") ?? "buy") as UniswapSwapMode;
  const tokenAddress = searchParams.get("tokenAddress");
  const sellAmount = searchParams.get("sellAmount");
  const taker = searchParams.get("taker");

  if (!tokenAddress || !sellAmount) {
    return NextResponse.json(
      { error: "Missing tokenAddress or sellAmount" },
      { status: 400 },
    );
  }

  if (mode !== "buy" && mode !== "sell") {
    return NextResponse.json(
      { error: "Invalid swap mode" },
      { status: 400 },
    );
  }

  if (!hasUniswapApiKey()) {
    return NextResponse.json(
      { error: "Uniswap API key not configured" },
      { status: 500 },
    );
  }

  try {
    if (type === "quote") {
      if (!taker) {
        return NextResponse.json(
          { error: "Missing taker for executable quote" },
          { status: 400 },
        );
      }
      const quote = await fetchUniswapExecutableQuote({
        tokenAddress,
        sellAmount,
        mode,
        swapper: taker
      });
      return NextResponse.json(quote);
    }

    const swapper = taker ?? process.env.PLATFORM_WALLET_ADDRESS;
    if (!swapper) {
      return NextResponse.json(
        { error: "Missing taker or PLATFORM_WALLET_ADDRESS for price quote" },
        { status: 400 },
      );
    }

    const price = await fetchUniswapPrice({
      tokenAddress,
      sellAmount,
      mode,
      swapper
    });
    return NextResponse.json(price);
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status: unknown }).status)
        : 500;
    const details =
      typeof error === "object" && error && "details" in error
        ? (error as { details: unknown }).details
        : undefined;
    console.error("[swap] Uniswap API error:", error);

    if (type === "price" && status === 404) {
      return NextResponse.json({
        buyAmount: "0",
        sellAmount,
        gas: "0",
        gasPrice: "0",
        allowanceTarget: "",
        totalNetworkFee: "0"
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch swap quote",
        details
      },
      { status: Number.isFinite(status) ? status : 500 },
    );
  }
}
