import { USDC_DECIMALS } from '@/lib/config/constants';
import { fetchUniswapPrice, hasUniswapApiKey } from '@/lib/chain/uniswap';

/**
 * Call Uniswap to find how many tokens the proxy's chat price buys (= 1 message).
 * Returns the human-readable token amount (e.g. 1234.56 tokens).
 */
export async function getTokensPerMessage(
  tokenAddress: string,
  pricePerMessage: number
): Promise<number> {
  if (!hasUniswapApiKey()) return 0;
  const swapper = process.env.PLATFORM_WALLET_ADDRESS;
  if (!swapper) return 0;
  try {
    const sellAmount = BigInt(Math.round(pricePerMessage * 10 ** USDC_DECIMALS)).toString();
    const quote = await fetchUniswapPrice({
      tokenAddress,
      sellAmount,
      mode: 'buy',
      swapper
    });
    return Number(quote.buyAmount) / 1e18;
  } catch (error) {
    console.error('[token] Uniswap price API error:', error);
    return 0;
  }
}

/**
 * Same as getTokensPerMessage but returns the raw bigint amount (18 decimals)
 * suitable for ERC-20 transfer calls.
 */
export async function getRawTokensPerMessage(
  tokenAddress: string,
  pricePerMessage: number
): Promise<bigint> {
  if (!hasUniswapApiKey()) return 0n;
  const swapper = process.env.PLATFORM_WALLET_ADDRESS;
  if (!swapper) return 0n;
  try {
    const sellAmount = BigInt(Math.round(pricePerMessage * 10 ** USDC_DECIMALS)).toString();
    const quote = await fetchUniswapPrice({
      tokenAddress,
      sellAmount,
      mode: 'buy',
      swapper
    });
    return BigInt(quote.buyAmount ?? '0');
  } catch (error) {
    console.error('[token] Uniswap price API error:', error);
    return 0n;
  }
}
