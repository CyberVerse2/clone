import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const rpcUrl =
  process.env.MAINNET_RPC_URL ??
  process.env.ETHEREUM_RPC_URL ??
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ??
  "https://eth.llamarpc.com";

export const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

