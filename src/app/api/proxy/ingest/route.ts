import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import {
  getUserByPrivyId,
  getProxyByCreatorId,
  getProxyByHandle,
  createProxy,
  updateProxy,
  updateUser,
} from "@/lib/db/queries";
import { getUserByUsername } from "@/lib/x/client";

/**
 * POST /api/proxy/ingest
 * Triggers the ingest-proxy Trigger.dev task from the setup wizard.
 * Creates the proxy record if needed.
 */
export async function POST(request: Request) {
  const { privyId, xHandle } = await request.json();
  const cleanHandle = typeof xHandle === "string" ? xHandle.trim().replace(/^@/, "") : "";

  if (!privyId || !cleanHandle) {
    return NextResponse.json({ error: "Missing privyId or xHandle" }, { status: 400 });
  }

  const user = await getUserByPrivyId(privyId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let displayName = cleanHandle;
  let avatarUrl: string | undefined;
  let bio: string | undefined;
  try {
    const xUser = await getUserByUsername(cleanHandle);
    if (xUser) {
      displayName = xUser.name ?? cleanHandle;
      avatarUrl = xUser.profile_image_url?.replace("_normal", "_400x400");
      bio = xUser.description;

      await updateUser(user.id, {
        xHandle: cleanHandle,
        displayName,
        xProfileImageUrl: avatarUrl,
        bio,
      }).catch(() => {});
    }
  } catch {
    // Fall back to the submitted handle. X lookup failures should not detach
    // setup from the authenticated app user.
  }

  let proxy = await getProxyByCreatorId(user.id);
  const handleProxy = await getProxyByHandle(cleanHandle);

  if (proxy && proxy.xHandle.toLowerCase() !== cleanHandle.toLowerCase()) {
    return NextResponse.json(
      { error: `Your account already owns @${proxy.xHandle}.` },
      { status: 409 }
    );
  }

  if (handleProxy && handleProxy.creatorId && handleProxy.creatorId !== user.id) {
    return NextResponse.json(
      { error: `@${cleanHandle} already has a claimed proxy.` },
      { status: 409 }
    );
  }

  if (!proxy && handleProxy) {
    proxy = await updateProxy(handleProxy.id, {
      creatorId: user.id,
      xHandle: cleanHandle,
      displayName,
      avatarUrl,
      bio,
      status: handleProxy.status === "live" ? "live" : "building",
    });
  }

  if (!proxy) {
    proxy = await createProxy({
      creatorId: user.id,
      xHandle: cleanHandle,
      displayName,
      avatarUrl,
      bio,
      status: "building",
    });
  } else if (proxy.status !== "live") {
    proxy = await updateProxy(proxy.id, {
      creatorId: user.id,
      xHandle: cleanHandle,
      displayName,
      avatarUrl,
      bio,
      status: "building",
    });
  }

  // Wallet is required for token deployment
  if (!user.walletAddress) {
    return NextResponse.json(
      { error: "No wallet address found. Please reconnect your account." },
      { status: 400 }
    );
  }

  // Trigger the ingestion via Inngest
  try {
    await inngest.send({
      name: "proxy/ingest.requested",
      data: {
        proxyId: proxy.id,
        xHandle: cleanHandle,
        maxTweets: 500,
        walletAddress: user.walletAddress,
      },
    });

    return NextResponse.json({ proxyId: proxy.id });
  } catch (error) {
    console.error("[setup] Failed to trigger ingestion:", error);
    await updateProxy(proxy.id, { status: "failed" }).catch(() => {});
    return NextResponse.json(
      { error: "Failed to start ingestion." },
      { status: 500 }
    );
  }
}
