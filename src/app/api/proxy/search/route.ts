import { NextRequest, NextResponse } from "next/server";
import { searchProxies } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 24), 50);

  if (!q.trim()) return NextResponse.json([]);

  const proxies = await searchProxies(q, limit);
  return NextResponse.json(proxies);
}

