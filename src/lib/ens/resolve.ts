import { getAddress, isAddressEqual } from "viem";
import { namehash, normalize } from "viem/ens";
import { ensClient } from "./client";
import { ENS_TEXT_KEYS, type EnsTextKey } from "./config";

const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

const ENS_REGISTRY_ABI = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export type CloneEnsTextRecords = Partial<Record<EnsTextKey, string>>;

export interface ResolvedCloneEns {
  name: string;
  node: `0x${string}`;
  ownerAddress: `0x${string}` | null;
  resolvedAddress: `0x${string}` | null;
  avatarUrl: string | null;
  description: string | null;
  textRecords: CloneEnsTextRecords;
}

export function normalizeEnsName(input: string) {
  const name = input.trim().replace(/^@/, "");
  if (!name) throw new Error("Enter an ENS name");
  return normalize(name);
}

export function buildProxiAgentSubname(label: string) {
  const cleanLabel = label.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9-]{3,63}$/.test(cleanLabel)) {
    throw new Error("Use 3-63 lowercase letters, numbers, or hyphens for the subname");
  }
  return normalize(`${cleanLabel}.proxiagent.eth`);
}

export async function resolveCloneEns(nameInput: string): Promise<ResolvedCloneEns> {
  const name = normalizeEnsName(nameInput);
  const node = namehash(name);

  const [ownerAddress, resolvedAddress, avatarUrl, description, textRecords] = await Promise.all([
    ensClient
      .readContract({
        address: ENS_REGISTRY_ADDRESS,
        abi: ENS_REGISTRY_ABI,
        functionName: "owner",
        args: [node],
      })
      .then((address) => (address === "0x0000000000000000000000000000000000000000" ? null : address))
      .catch(() => null),
    ensClient.getEnsAddress({ name }).catch(() => null),
    ensClient.getEnsAvatar({ name }).catch(() => null),
    ensClient.getEnsText({ name, key: "description" }).catch(() => null),
    readCloneTextRecords(name),
  ]);

  return {
    name,
    node,
    ownerAddress,
    resolvedAddress,
    avatarUrl,
    description,
    textRecords,
  };
}

async function readCloneTextRecords(name: string): Promise<CloneEnsTextRecords> {
  const entries = await Promise.all(
    ENS_TEXT_KEYS.map(async (key) => {
      const value = await ensClient.getEnsText({ name, key }).catch(() => null);
      return [key, value] as const;
    }),
  );

  return entries.reduce<CloneEnsTextRecords>((records, [key, value]) => {
    if (value) records[key] = value;
    return records;
  }, {});
}

export function resolvedAddressMatchesWallet(
  resolvedAddress: `0x${string}` | null,
  walletAddress: string | null | undefined,
) {
  if (!resolvedAddress || !walletAddress) return false;
  try {
    return isAddressEqual(resolvedAddress, getAddress(walletAddress));
  } catch {
    return false;
  }
}

