import type { SwapMode, SwapQuote } from './types';
import type { SwapWallet } from './wallet';

interface SendTxInput {
  to: string;
  data: string;
  gasLimit?: number;
  value?: bigint;
}

type SendTransaction = (
  tx: SendTxInput,
  options: { sponsor: boolean; address: string }
) => Promise<{ hash: string }>;

export function createExecuteSwap(
  setLoading: (value: boolean) => void,
  setError: (value: string | null) => void,
  getWallet: () => SwapWallet | null,
  getQuote: (tokenAddress: string, amount: string, mode: SwapMode) => Promise<SwapQuote | null>,
  sendTransaction: SendTransaction
) {
  return async (tokenAddress: string, amount: string, mode: SwapMode): Promise<string | null> => {
    setLoading(true);
    setError(null);

    const wallet = getWallet();
    if (!wallet) {
      setError('No wallet connected');
      setLoading(false);
      return null;
    }

    try {
      const quote = await getQuote(tokenAddress, amount, mode);
      if (!quote) {
        throw new Error('Failed to get swap quote');
      }
      if (!quote.transaction) {
        console.error('[swap] Quote missing transaction data:', JSON.stringify(quote));
        throw new Error('Swap quote has no transaction — the amount may be too small or the token has no liquidity');
      }

      if (quote.cancel) {
        await sendTransaction(toSendTransaction(quote.cancel), { sponsor: true, address: wallet.address });
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      if (quote.approval) {
        await sendTransaction(toSendTransaction(quote.approval), { sponsor: true, address: wallet.address });
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      const { hash } = await sendTransaction(
        toSendTransaction(quote.transaction),
        { sponsor: true, address: wallet.address }
      );

      return hash;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
      return null;
    } finally {
      setLoading(false);
    }
  };
}

function toSendTransaction(tx: {
  to: string;
  data: string;
  gasLimit?: string;
  gas?: string;
  value?: string;
}): SendTxInput {
  const gas = tx.gasLimit ?? tx.gas;
  return {
    to: tx.to,
    data: tx.data,
    gasLimit: gas ? parseQuantity(gas) : undefined,
    value: tx.value ? BigInt(tx.value) : 0n
  };
}

function parseQuantity(value: string) {
  return value.startsWith('0x') ? Number.parseInt(value.slice(2), 16) : Number.parseInt(value, 10);
}
