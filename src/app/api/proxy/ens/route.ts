import { NextRequest, NextResponse } from "next/server";
import { getProxyByCreatorId, getProxyByEnsName, getUserByPrivyId, updateProxy } from "@/lib/db/queries";
import {
  buildProxiAgentSubname,
  normalizeEnsName,
  resolveCloneEns,
  resolvedAddressMatchesWallet,
} from "@/lib/ens/resolve";
import { buildCloneEnsTextRecords, buildOnchainCloneEnsTextRecords } from "@/lib/ens/records";
import { publishProxiAgentSubname } from "@/lib/ens/publish";

type EnsMode = "attach" | "reserve-subname";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const privyId = typeof body.privyId === "string" ? body.privyId : "";
    const mode = (body.mode === "reserve-subname" ? body.mode : "attach") as EnsMode;
    const input = typeof body.name === "string" ? body.name : "";

    if (!privyId || !input.trim()) {
      return NextResponse.json({ error: "Missing privyId or ENS name" }, { status: 400 });
    }

    const user = await getUserByPrivyId(privyId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const proxy = await getProxyByCreatorId(user.id);
    if (!proxy) return NextResponse.json({ error: "Create your clone before connecting ENS" }, { status: 404 });

    const ensName = mode === "reserve-subname" ? buildProxiAgentSubname(input) : normalizeEnsName(input);

    const existing = await getProxyByEnsName(ensName);
    if (existing && existing.id !== proxy.id) {
      return NextResponse.json({ error: `${ensName} is already connected to another clone` }, { status: 409 });
    }

    const resolved = await resolveCloneEns(ensName);
    const matchesWallet = resolvedAddressMatchesWallet(resolved.resolvedAddress, user.walletAddress);

    if (mode === "attach" && !matchesWallet) {
      return NextResponse.json(
        {
          error: "That ENS name does not resolve to your connected wallet",
          resolvedAddress: resolved.resolvedAddress,
          walletAddress: user.walletAddress,
        },
        { status: 403 },
      );
    }

    if (mode === "reserve-subname" && resolved.resolvedAddress && !matchesWallet) {
      return NextResponse.json(
        {
          error: `${ensName} already resolves to a different wallet`,
          resolvedAddress: resolved.resolvedAddress,
        },
        { status: 409 },
      );
    }

    let registrationStatus = mode === "reserve-subname" ? "claimed" : "verified";
    const ownerAddress = mode === "reserve-subname"
      ? user.walletAddress
      : resolved.ownerAddress;
    const resolvedAddress = mode === "reserve-subname"
      ? user.walletAddress
      : resolved.resolvedAddress;
    const textRecords = {
      ...resolved.textRecords,
      ...buildCloneEnsTextRecords(proxy, new URL(`/${proxy.xHandle}`, request.url).toString()),
    };

    let publishResult: Awaited<ReturnType<typeof publishProxiAgentSubname>> | null = null;
    if (mode === "reserve-subname") {
      if (!user.walletAddress) {
        return NextResponse.json(
          { error: "Connect a wallet before claiming a proxiagent.eth subname" },
          { status: 400 },
        );
      }

      publishResult = await publishProxiAgentSubname({
        name: resolved.name,
        ownerAddress: user.walletAddress as `0x${string}`,
        records: buildOnchainCloneEnsTextRecords(textRecords),
      });
      registrationStatus = "published";
    }

    const updated = await updateProxy(proxy.id, {
      ensName: resolved.name,
      ensNode: resolved.node,
      ensOwnerAddress: ownerAddress,
      ensResolvedAddress: resolvedAddress,
      ensAvatarUrl: resolved.avatarUrl ?? proxy.avatarUrl,
      ensDescription: textRecords["clone.description"] ?? resolved.description,
      ensTextRecords: textRecords,
      ensRegistrationStatus: registrationStatus,
      ensVerifiedAt: new Date(),
    });

    return NextResponse.json({ proxy: updated, resolved, registrationStatus, publishResult });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to connect ENS" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const privyId = searchParams.get("privyId");

  if (!privyId) {
    return NextResponse.json({ error: "Missing privyId" }, { status: 400 });
  }

  const user = await getUserByPrivyId(privyId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const proxy = await getProxyByCreatorId(user.id);
  if (!proxy) return NextResponse.json({ error: "Clone not found" }, { status: 404 });

  const updated = await updateProxy(proxy.id, {
    ensName: null,
    ensNode: null,
    ensOwnerAddress: null,
    ensResolvedAddress: null,
    ensAvatarUrl: null,
    ensDescription: null,
    ensTextRecords: null,
    ensRegistrationStatus: null,
    ensVerifiedAt: null,
  });

  return NextResponse.json({ proxy: updated });
}
