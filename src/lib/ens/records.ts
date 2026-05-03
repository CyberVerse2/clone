import type { Proxy } from "@/lib/db/schema";

interface CoreBrain {
  beliefs?: string[];
  opinions?: Record<string, string>;
  topicMap?: Record<string, string[]>;
  personality?: string;
  background?: string;
  reasoningStyle?: string;
}

function compact(value: string, max = 420) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function asBrain(proxy: Proxy) {
  if (!proxy.coreBrain || typeof proxy.coreBrain !== "object") return null;
  return proxy.coreBrain as CoreBrain;
}

function topicMapToCapabilities(topicMap: Record<string, string[]> | undefined) {
  if (!topicMap || Object.keys(topicMap).length === 0) {
    return "chat with this clone based on its profile and learned writing style";
  }

  return Object.entries(topicMap)
    .slice(0, 8)
    .map(([topic, subtopics]) => {
      const details = subtopics.slice(0, 5).join(", ");
      return details ? `${topic}: ${details}` : topic;
    })
    .join(" | ");
}

function stableJson(value: unknown, max = 900) {
  return compact(JSON.stringify(value), max);
}

export function buildCloneEnsTextRecords(proxy: Proxy, agentUrl: string) {
  const brain = asBrain(proxy);
  const topicMap = brain?.topicMap ?? {};
  const description =
    brain?.background ||
    brain?.personality ||
    proxy.bio ||
    `AI clone of @${proxy.xHandle}`;

  return {
    "clone.handle": proxy.xHandle,
    "clone.avatar": proxy.avatarUrl ?? "",
    "clone.description": compact(description, 520),
    "clone.capabilities": compact(topicMapToCapabilities(topicMap), 700),
    "clone.topic_map": stableJson(topicMap),
    "clone.personality": compact(brain?.personality ?? "", 900),
    "clone.background": compact(brain?.background ?? "", 700),
    "clone.beliefs": stableJson((brain?.beliefs ?? []).slice(0, 8)),
    "clone.opinions": stableJson(Object.fromEntries(Object.entries(brain?.opinions ?? {}).slice(0, 8))),
    "clone.reasoning_style": compact(brain?.reasoningStyle ?? "", 700),
    "clone.price": String(proxy.chatPrice ?? 0.1),
    "clone.agent_url": agentUrl,
  };
}

export function buildOnchainCloneEnsTextRecords(records: Record<string, string>) {
  return {
    "clone.handle": compact(records["clone.handle"] ?? "", 80),
    "clone.avatar": compact(records["clone.avatar"] ?? "", 240),
    "clone.description": compact(records["clone.description"] ?? "", 240),
    "clone.capabilities": compact(records["clone.capabilities"] ?? "", 320),
    "clone.topic_map": compact(records["clone.topic_map"] ?? "", 420),
    "clone.personality": compact(records["clone.personality"] ?? "", 280),
    "clone.background": compact(records["clone.background"] ?? "", 280),
    "clone.reasoning_style": compact(records["clone.reasoning_style"] ?? "", 260),
    "clone.price": compact(records["clone.price"] ?? "", 40),
    "clone.agent_url": compact(records["clone.agent_url"] ?? "", 240),
  };
}
