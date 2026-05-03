import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getAddress,
  http,
  isAddressEqual,
  keccak256,
  toBytes,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";
import { mainnet } from "viem/chains";
import { namehash, normalize } from "viem/ens";
import { privateKeyToAccount } from "viem/accounts";
import { ENS_PARENT_NAME } from "./config";

const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

const registryAbi = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "resolver",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "setSubnodeRecord",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "label", type: "bytes32" },
      { name: "owner", type: "address" },
      { name: "resolver", type: "address" },
      { name: "ttl", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setSubnodeOwner",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "label", type: "bytes32" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
] as const;

const resolverAbi = [
  {
    type: "function",
    name: "setAddr",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "a", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setText",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "multicall",
    stateMutability: "nonpayable",
    inputs: [{ name: "data", type: "bytes[]" }],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
] as const;

function ethereumRpcUrl() {
  return (
    process.env.MAINNET_RPC_URL ??
    process.env.ETHEREUM_RPC_URL ??
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL ??
    "https://ethereum-rpc.publicnode.com"
  );
}

function labelFromSubname(name: string) {
  const normalized = normalize(name);
  const suffix = `.${ENS_PARENT_NAME}`;
  if (!normalized.endsWith(suffix)) {
    throw new Error(`ENS name must be a ${ENS_PARENT_NAME} subname`);
  }
  return normalized.slice(0, -suffix.length);
}

export async function publishProxiAgentSubname({
  name,
  ownerAddress,
  records,
}: {
  name: string;
  ownerAddress: Address;
  records: Record<string, string>;
}) {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY is required to publish ENS records onchain");
  }

  const account = privateKeyToAccount(privateKey);
  const transport = http(ethereumRpcUrl());
  const publicClient = createPublicClient({ chain: mainnet, transport });
  const walletClient = createWalletClient({ account, chain: mainnet, transport });

  const parentNode = namehash(ENS_PARENT_NAME);
  const normalizedName = normalize(name);
  const node = namehash(normalizedName);
  const label = keccak256(toBytes(labelFromSubname(normalizedName)));

  const [parentOwner, parentResolver] = await Promise.all([
    publicClient.readContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: registryAbi,
      functionName: "owner",
      args: [parentNode],
    }),
    publicClient.readContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: registryAbi,
      functionName: "resolver",
      args: [parentNode],
    }),
  ]);

  if (!isAddressEqual(parentOwner, account.address)) {
    throw new Error(`${account.address} does not control ${ENS_PARENT_NAME}`);
  }

  if (parentResolver === zeroAddress) {
    throw new Error(`${ENS_PARENT_NAME} does not have a resolver configured`);
  }

  const safeOwner = getAddress(ownerAddress);
  const textEntries = Object.entries(records).filter(([, value]) => value.length > 0);
  const hashes: Hex[] = [];

  hashes.push(
    await walletClient.writeContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: registryAbi,
      functionName: "setSubnodeRecord",
      args: [parentNode, label, account.address, parentResolver, 0n],
    }),
  );

  const resolverCalls = [
    encodeFunctionData({
      abi: resolverAbi,
      functionName: "setAddr",
      args: [node, safeOwner],
    }),
    ...textEntries.map(([key, value]) =>
      encodeFunctionData({
        abi: resolverAbi,
        functionName: "setText",
        args: [node, key, value],
      }),
    ),
  ];

  try {
    hashes.push(
      await walletClient.writeContract({
        address: parentResolver,
        abi: resolverAbi,
        functionName: "multicall",
        args: [resolverCalls],
      }),
    );
  } catch {
    hashes.push(
      await walletClient.writeContract({
        address: parentResolver,
        abi: resolverAbi,
        functionName: "setAddr",
        args: [node, safeOwner],
      }),
    );

    for (const [key, value] of textEntries) {
      hashes.push(
        await walletClient.writeContract({
          address: parentResolver,
          abi: resolverAbi,
          functionName: "setText",
          args: [node, key, value],
        }),
      );
    }
  }

  hashes.push(
    await walletClient.writeContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: registryAbi,
      functionName: "setSubnodeOwner",
      args: [parentNode, label, safeOwner],
    }),
  );

  return {
    name: normalizedName,
    node,
    ownerAddress: safeOwner,
    resolverAddress: parentResolver,
    transactionHashes: hashes,
  };
}
