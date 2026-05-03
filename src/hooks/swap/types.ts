export interface SwapQuote {
  buyAmount: string;
  sellAmount: string;
  gas: string;
  gasPrice: string;
  allowanceTarget: string;
  approval?: {
    to: string;
    data: string;
    gasLimit?: string;
    gas?: string;
    value?: string;
  } | null;
  cancel?: {
    to: string;
    data: string;
    gasLimit?: string;
    gas?: string;
    value?: string;
  } | null;
  transaction?: {
    to: string;
    data: string;
    gas?: string;
    gasLimit?: string;
    gasPrice?: string;
    value?: string;
  };
  totalNetworkFee: string;
}

export type SwapMode = 'buy' | 'sell';
