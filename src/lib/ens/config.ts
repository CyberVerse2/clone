export const ENS_PARENT_NAME = "proxiagent.eth";

export const ENS_TEXT_KEYS = [
  "clone.handle",
  "clone.avatar",
  "clone.description",
  "clone.capabilities",
  "clone.topic_map",
  "clone.personality",
  "clone.background",
  "clone.beliefs",
  "clone.opinions",
  "clone.reasoning_style",
  "clone.price",
  "clone.agent_url",
] as const;

export type EnsTextKey = (typeof ENS_TEXT_KEYS)[number];
