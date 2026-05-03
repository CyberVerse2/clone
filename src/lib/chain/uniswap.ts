import {
  BASE_CHAIN_ID,
  SLIPPAGE_BPS,
  UNISWAP_API_BASE,
  USDC_ADDRESS
} from "@/lib/config/constants";

export type UniswapSwapMode = "buy" | "sell";

export interface UniswapTx {
  to: string;
  from?: string;
  data: string;
  value?: string;
  gas?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId?: number;
}

export interface NormalizedSwapQuote {
  buyAmount: string;
  sellAmount: string;
  gas: string;
  gasPrice: string;
  allowanceTarget: string;
  totalNetworkFee: string;
  approval?: UniswapTx | null;
  cancel?: UniswapTx | null;
  transaction?: UniswapTx;
}

interface UniswapQuoteResponse {
  quote?: {
    input?: { amount?: string };
    output?: { amount?: string };
    gasUseEstimate?: string;
    gasFee?: string;
    gasPrice?: string;
  };
  permitData?: unknown;
  routing?: string;
}

interface UniswapApprovalResponse {
  approval?: UniswapTx | null;
  cancel?: UniswapTx | null;
  gasFee?: string;
}

interface UniswapSwapResponse {
  swap?: UniswapTx;
  gasFee?: string;
}

const PROXY_APPROVAL_ADDRESS = "0x02E5be68D46DAc0B524905bfF209cf47EE6dB2a9";
const PROTOCOLS = ["V2", "V3", "V4"] as const;

export function getUniswapTokens(mode: UniswapSwapMode, tokenAddress: string) {
  const isBuy = mode === "buy";
  return {
    sellToken: isBuy ? USDC_ADDRESS : tokenAddress,
    buyToken: isBuy ? tokenAddress : USDC_ADDRESS
  };
}

export function hasUniswapApiKey() {
  return Boolean(process.env.UNISWAP_API_KEY);
}

export function bpsToPercent(bps: string) {
  return Number.parseInt(bps, 10) / 100;
}

export async function fetchUniswapPrice({
  tokenAddress,
  sellAmount,
  mode,
  swapper
}: {
  tokenAddress: string;
  sellAmount: string;
  mode: UniswapSwapMode;
  swapper: string;
}): Promise<NormalizedSwapQuote> {
  const quote = await requestUniswapQuote({ tokenAddress, sellAmount, mode, swapper });
  return normalizeUniswapQuote(quote);
}

export async function fetchUniswapExecutableQuote({
  tokenAddress,
  sellAmount,
  mode,
  swapper
}: {
  tokenAddress: string;
  sellAmount: string;
  mode: UniswapSwapMode;
  swapper: string;
}): Promise<NormalizedSwapQuote> {
  const { sellToken, buyToken } = getUniswapTokens(mode, tokenAddress);
  const approval = await requestUniswapApproval({
    token: sellToken,
    tokenOut: buyToken,
    amount: sellAmount,
    walletAddress: swapper
  });
  const quote = await requestUniswapQuote({ tokenAddress, sellAmount, mode, swapper });
  const swap = await requestUniswapSwap(quote);
  return {
    ...normalizeUniswapQuote(quote),
    approval: approval.approval ?? null,
    cancel: approval.cancel ?? null,
    totalNetworkFee: swap.gasFee ?? approval.gasFee ?? quote.quote?.gasFee ?? "0",
    transaction: swap.swap
  };
}

async function requestUniswapApproval({
  token,
  tokenOut,
  amount,
  walletAddress
}: {
  token: string;
  tokenOut: string;
  amount: string;
  walletAddress: string;
}): Promise<UniswapApprovalResponse> {
  return requestUniswap<UniswapApprovalResponse>("check_approval", {
    chainId: BASE_CHAIN_ID,
    urgency: "normal",
    includeGasInfo: true,
    walletAddress,
    token,
    tokenOut,
    tokenOutChainId: BASE_CHAIN_ID,
    amount
  });
}

async function requestUniswapQuote({
  tokenAddress,
  sellAmount,
  mode,
  swapper
}: {
  tokenAddress: string;
  sellAmount: string;
  mode: UniswapSwapMode;
  swapper: string;
}): Promise<UniswapQuoteResponse> {
  const { sellToken, buyToken } = getUniswapTokens(mode, tokenAddress);
  return requestUniswap<UniswapQuoteResponse>("quote", {
    type: "EXACT_INPUT",
    tokenInChainId: BASE_CHAIN_ID,
    tokenOutChainId: BASE_CHAIN_ID,
    tokenIn: sellToken,
    tokenOut: buyToken,
    amount: sellAmount,
    swapper,
    slippageTolerance: bpsToPercent(SLIPPAGE_BPS),
    routingPreference: "BEST_PRICE",
    protocols: PROTOCOLS,
    urgency: "normal"
  });
}

async function requestUniswapSwap(quote: UniswapQuoteResponse): Promise<UniswapSwapResponse> {
  const body: Record<string, unknown> = {
    quote: quote.quote,
    simulateTransaction: false,
    refreshGasPrice: true,
    urgency: "normal"
  };

  if (quote.permitData && typeof quote.permitData === "object") {
    body.permitData = quote.permitData;
  }

  return requestUniswap<UniswapSwapResponse>("swap", body);
}

async function requestUniswap<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.UNISWAP_API_KEY;
  if (!apiKey) {
    throw new Error("Uniswap API key not configured");
  }

  const res = await fetch(`${UNISWAP_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
      "x-permit2-disabled": "true",
      "x-permit2-enabled": "false"
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = getUniswapErrorMessage(data);
    const error = new Error(message);
    Object.assign(error, { status: res.status, details: data });
    throw error;
  }

  return data as T;
}

function normalizeUniswapQuote(data: UniswapQuoteResponse): NormalizedSwapQuote {
  const quote = data.quote;
  return {
    buyAmount: quote?.output?.amount ?? "0",
    sellAmount: quote?.input?.amount ?? "0",
    gas: quote?.gasUseEstimate ?? "0",
    gasPrice: quote?.gasPrice ?? "0",
    allowanceTarget: PROXY_APPROVAL_ADDRESS,
    totalNetworkFee: quote?.gasFee ?? "0"
  };
}

function getUniswapErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") return "Uniswap API error";
  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  return "Uniswap API error";
}
