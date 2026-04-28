"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DEFAULT_AVATAR } from "@/lib/config/constants";
import { ArrowRight, ArrowLeft, Check, Mic, Brain, Lock, Cog, MessageSquare, Loader2, Upload, Sparkles, ArrowUp, Square, Zap, Globe2, ShieldCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import type { Proxy } from "@/lib/db/schema";

const STEPS = [
  { id: 1, label: "Voice", icon: Mic, description: "We'll analyze your X posts to capture your unique voice and writing style." },
  { id: 2, label: "Knowledge", icon: Brain, description: "Review and customize your proxy's knowledge map, beliefs, and opinions." },
  { id: 3, label: "Private Data", icon: Lock, description: "Optionally add private notes, FAQs, or context only you would know." },
  { id: 4, label: "Config", icon: Cog, description: "Set your proxy's pricing, visibility, and behavior preferences." },
  { id: 5, label: "Claim ENS", icon: Globe2, description: "Claim your free proxiagent.eth subname, then test and launch your clone." },
];

function usernameToEnsLabel(username: string) {
  return username
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

function cloneEnsName(username: string) {
  const label = usernameToEnsLabel(username);
  return label ? `${label}.proxiagent.eth` : "yourname.proxiagent.eth";
}

export default function SetupPage() {
  const { user, xHandle, ready, authenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [proxy, setProxy] = useState<Proxy | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing proxy data
  useEffect(() => {
    if (!ready || !authenticated || !user?.id) { setLoading(false); return; }
    fetch(`/api/user/me?privyId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data) => { if (data.proxy) setProxy(data.proxy); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready, authenticated, user?.id]);

  const refreshProxy = useCallback(async () => {
    if (!user?.id) return null;
    const res = await fetch(`/api/user/me?privyId=${encodeURIComponent(user.id)}`);
    const data = await res.json();
    if (data.proxy) { setProxy(data.proxy); return data.proxy; }
    return null;
  }, [user?.id]);

  const step = STEPS[currentStep - 1];

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Setup Wizard</h1>
        <p className="text-gray text-sm mt-0.5">Create and configure your AI clone in 5 steps</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(s.id)}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-colors cursor-pointer",
                currentStep === s.id
                  ? "bg-lime text-black"
                  : currentStep > s.id
                  ? "bg-lime/20 text-lime"
                  : "bg-white/6 text-gray"
              )}
            >
              {currentStep > s.id ? <Check size={14} /> : s.id}
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("w-8 h-[2px] rounded-full", currentStep > s.id ? "bg-lime/30" : "bg-white/6")} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="min-h-[300px] space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-lime/10 flex items-center justify-center">
            <step.icon size={20} className="text-lime" />
          </div>
          <div>
            <h2 className="text-white font-semibold">{step.label}</h2>
            <p className="text-gray text-xs">{step.description}</p>
          </div>
        </div>

        {currentStep === 1 && (
          <VoiceStep
            xHandle={xHandle}
            privyId={user?.id ?? null}
            proxy={proxy}
            onComplete={async () => { await refreshProxy(); setCurrentStep(2); }}
          />
        )}
        {currentStep === 2 && (
          <KnowledgeStep proxy={proxy} privyId={user?.id ?? null} onRefresh={refreshProxy} />
        )}
        {currentStep === 3 && (
          <PrivateDataStep proxy={proxy} />
        )}
        {currentStep === 4 && (
          <ConfigStep proxy={proxy} privyId={user?.id ?? null} onRefresh={refreshProxy} />
        )}
        {currentStep === 5 && (
          <ClaimEnsStep proxy={proxy} privyId={user?.id ?? null} onRefresh={refreshProxy} />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft size={16} /> Back
        </Button>
        {currentStep < STEPS.length ? (
          <Button onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}>
            Next <ArrowRight size={16} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/* ===================== Step 1: Voice Analysis ===================== */

function VoiceStep({
  xHandle,
  privyId,
  proxy,
  onComplete,
}: {
  xHandle: string | null;
  privyId: string | null;
  proxy: Proxy | null;
  onComplete: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">(
    proxy?.voiceProfile ? "done" : "idle"
  );
  const [error, setError] = useState("");

  const startAnalysis = async () => {
    if (!privyId || !xHandle) return;
    setStatus("analyzing");
    setError("");

    try {
      const res = await fetch("/api/proxy/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privyId, xHandle }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to start analysis");
      }

      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const meRes = await fetch(`/api/user/me?privyId=${encodeURIComponent(privyId)}`);
          const meData = await meRes.json();
          if (meData.proxy?.voiceProfile || meData.proxy?.status === "live") {
            clearInterval(poll);
            setStatus("done");
          }
        } catch { /* keep polling */ }
      }, 5000);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(poll);
        if (status === "analyzing") {
          setStatus("done"); // Assume it finished even if we missed the update
        }
      }, 600_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  if (!xHandle) {
    return (
      <div className="text-center py-8">
        <p className="text-gray text-sm">Connect your X account first to analyze your voice.</p>
        <p className="text-gray/50 text-xs mt-1">Go to Settings to connect your X account.</p>
      </div>
    );
  }

  const voiceProfile = proxy?.voiceProfile as Record<string, unknown> | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/4 border border-white/6">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lime font-bold text-sm">
          @
        </div>
        <div>
          <p className="text-white text-sm font-medium">@{xHandle}</p>
          <p className="text-gray text-xs">Your X posts will be analyzed</p>
        </div>
      </div>

      {status === "idle" && (
        <Button onClick={startAnalysis} className="w-full">
          <Sparkles size={16} /> Analyze My Voice
        </Button>
      )}

      {status === "analyzing" && (
        <div className="text-center py-6 space-y-3">
          <Loader2 size={32} className="text-lime animate-spin mx-auto" />
          <p className="text-white text-sm font-medium">Analyzing your voice...</p>
          <p className="text-gray text-xs">
            Fetching your tweets, building voice profile, and creating embeddings.
            This takes 2-5 minutes.
          </p>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Check size={16} /> Voice analysis complete
          </div>
          {voiceProfile && (
            <div className="p-3 rounded-lg bg-white/4 border border-white/6 text-xs text-gray space-y-1">
              {Object.entries(voiceProfile).slice(0, 5).map(([key, val]) => (
                <p key={key}>
                  <span className="text-white capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                  {typeof val === "string" ? val : JSON.stringify(val)}
                </p>
              ))}
            </div>
          )}
          <Button onClick={onComplete} className="w-full">
            Continue <ArrowRight size={14} />
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <Button variant="outline" onClick={startAnalysis}>Retry</Button>
        </div>
      )}
    </div>
  );
}

/* ===================== Step 2: Knowledge Review ===================== */

function KnowledgeStep({
  proxy,
  privyId,
  onRefresh,
}: {
  proxy: Proxy | null;
  privyId: string | null;
  onRefresh: () => Promise<Proxy | null>;
}) {
  const coreBrain = (proxy?.coreBrain as Record<string, unknown>) ?? {};
  const [editing, setEditing] = useState(false);
  const [brainText, setBrainText] = useState(JSON.stringify(coreBrain, null, 2));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!privyId) return;
    setSaving(true);
    try {
      const parsed = JSON.parse(brainText);
      await fetch("/api/proxy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privyId, coreBrain: parsed }),
      });
      await onRefresh();
      setEditing(false);
    } catch { /* invalid JSON */ }
    setSaving(false);
  };

  if (!proxy) {
    return (
      <div className="text-center py-8">
        <p className="text-gray text-sm">Complete voice analysis first to generate knowledge.</p>
      </div>
    );
  }

  const entries = Object.entries(coreBrain);

  return (
    <div className="space-y-4">
      {entries.length === 0 && !editing ? (
        <div className="text-center py-6">
          <Brain size={32} className="text-gray/30 mx-auto mb-2" />
          <p className="text-gray text-sm">No knowledge data yet</p>
          <p className="text-gray/50 text-xs mt-1">Run voice analysis to generate your proxy&apos;s brain</p>
        </div>
      ) : !editing ? (
        <div className="space-y-2">
          {entries.map(([key, val]) => (
            <div key={key} className="p-3 rounded-lg bg-white/4 border border-white/6">
              <p className="text-white text-xs font-medium capitalize mb-1">{key.replace(/_/g, " ")}</p>
              <p className="text-gray text-xs">
                {typeof val === "string" ? val : JSON.stringify(val)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <textarea
          value={brainText}
          onChange={(e) => setBrainText(e.target.value)}
          className="w-full h-64 bg-white/4 border border-white/6 rounded-lg p-3 text-white text-xs font-mono resize-none outline-none focus:border-lime/30"
        />
      )}

      <div className="flex gap-2">
        {editing ? (
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => { setBrainText(JSON.stringify(coreBrain, null, 2)); setEditing(true); }}>
            Edit Knowledge
          </Button>
        )}
      </div>
    </div>
  );
}

/* ===================== Step 3: Private Data Upload ===================== */

function PrivateDataStep({ proxy }: { proxy: Proxy | null }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const handleUpload = async () => {
    if (!proxy?.id || !text.trim()) return;
    setUploading(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proxyId: proxy.id,
          chunks: [{
            text: text.trim(),
            contentType: "private_note",
            priority: 10,
            qualityScore: 1.0,
          }],
        }),
      });
      if (res.ok) {
        setUploaded((prev) => [...prev, text.trim().slice(0, 60) + (text.length > 60 ? "..." : "")]);
        setText("");
      }
    } catch { /* ignore */ }
    setUploading(false);
  };

  if (!proxy) {
    return (
      <div className="text-center py-8">
        <p className="text-gray text-sm">Complete voice analysis first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray text-xs">
        Add private notes, FAQs, or context that isn&apos;t on your public X profile.
        This data improves your proxy&apos;s responses.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Example: I'm a software engineer at Acme Corp. I specialize in React and TypeScript. My favorite programming language is Rust..."
        className="w-full h-32 bg-white/4 border border-white/6 rounded-lg p-3 text-white text-sm placeholder:text-gray/50 resize-none outline-none focus:border-lime/30"
      />

      <Button onClick={handleUpload} disabled={uploading || !text.trim()} className="w-full">
        {uploading ? (
          <><Loader2 size={14} className="animate-spin" /> Uploading...</>
        ) : (
          <><Upload size={14} /> Add to Knowledge Base</>
        )}
      </Button>

      {uploaded.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-gray text-xs font-medium">Uploaded notes:</p>
          {uploaded.map((note, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray p-2 rounded bg-white/4 border border-white/6">
              <Check size={12} className="text-emerald-400 shrink-0" />
              {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== Step 4: Config ===================== */

function ConfigStep({
  proxy,
  privyId,
  onRefresh,
}: {
  proxy: Proxy | null;
  privyId: string | null;
  onRefresh: () => Promise<Proxy | null>;
}) {
  const [price, setPrice] = useState(proxy?.chatPrice?.toString() ?? "0.10");
  const [ticker, setTicker] = useState(proxy?.ticker ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!privyId) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/proxy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privyId,
          chatPrice: parseFloat(price) || 0.1,
          ticker: ticker.trim().toUpperCase() || null,
        }),
      });
      await onRefresh();
      setSaved(true);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (!proxy) {
    return (
      <div className="text-center py-8">
        <p className="text-gray text-sm">Complete voice analysis first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-gray text-xs mb-1.5 block">Chat Price (USD per message)</label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => { setPrice(e.target.value); setSaved(false); }}
          placeholder="0.00"
        />
        <p className="text-gray/50 text-[11px] mt-1">Set to 0 for free chats</p>
      </div>

      <div>
        <label className="text-gray text-xs mb-1.5 block">Ticker Symbol</label>
        <Input
          value={ticker}
          onChange={(e) => { setTicker(e.target.value); setSaved(false); }}
          placeholder="e.g. PROXI"
          maxLength={10}
        />
        <p className="text-gray/50 text-[11px] mt-1">Used when your proxy token is deployed</p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <><Loader2 size={14} className="animate-spin" /> Saving...</>
        ) : saved ? (
          <><Check size={14} /> Saved</>
        ) : (
          <><Cog size={14} /> Save Configuration</>
        )}
      </Button>
    </div>
  );
}

/* ===================== Step 5: ENS Claim + Test Chat ===================== */

function ClaimEnsStep({
  proxy,
  privyId,
  onRefresh,
}: {
  proxy: Proxy | null;
  privyId: string | null;
  onRefresh: () => Promise<Proxy | null>;
}) {
  const handle = proxy?.xHandle ?? "";
  const { messages, isLoading, sendMessage, stop } = useChat({ proxyHandle: handle });
  const [input, setInput] = useState("");
  const [launching, setLaunching] = useState(false);
  const [claimingEns, setClaimingEns] = useState(false);
  const [ensError, setEnsError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleLaunch = async () => {
    if (!privyId || !proxy?.ensName) return;
    setLaunching(true);
    try {
      await fetch("/api/proxy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privyId, status: "live" }),
      });
      await onRefresh();
    } catch { /* ignore */ }
    setLaunching(false);
  };

  const handleClaimEns = async () => {
    if (!privyId || !proxy?.xHandle) return;
    setClaimingEns(true);
    setEnsError(null);
    try {
      const res = await fetch("/api/proxy/ens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privyId,
          name: usernameToEnsLabel(proxy.xHandle),
          mode: "reserve-subname",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not claim ENS");
      await onRefresh();
    } catch (err) {
      setEnsError(err instanceof Error ? err.message : "Could not claim ENS");
    }
    setClaimingEns(false);
  };

  if (!proxy) {
    return (
      <div className="text-center py-8">
        <p className="text-gray text-sm">Complete the previous steps first.</p>
      </div>
    );
  }

  const isLive = proxy.status === "live";
  const generatedEnsName = cloneEnsName(proxy.xHandle);
  const displayEnsName = proxy.ensName ?? generatedEnsName;
  const hasClaimedEns =
    (proxy.ensRegistrationStatus === "claimed" || proxy.ensRegistrationStatus === "published") &&
    !!proxy.ensName;
  const ensRecords = proxy.ensTextRecords && typeof proxy.ensTextRecords === "object"
    ? proxy.ensTextRecords as Record<string, unknown>
    : {};

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-lime/20 bg-lime/5 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-lime/10 flex items-center justify-center shrink-0">
            {hasClaimedEns ? (
              <ShieldCheck size={20} className="text-lime" />
            ) : (
              <Globe2 size={20} className="text-lime" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold">Free ENS identity</p>
              <p className="text-gray text-xs mt-1">
                This publishes a username-based ENS subname to the real ENS registry, owned by your connected Privy wallet, with records synced from the Brain Map.
              </p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-gray">Generated from @{proxy.xHandle}</p>
              <p className="truncate text-lg font-semibold text-white">{displayEnsName}</p>
            </div>
            {hasClaimedEns ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
                <ShieldCheck size={13} /> {proxy.ensRegistrationStatus === "published" ? "Published" : "Claimed"}
              </span>
            ) : (
              <Button onClick={handleClaimEns} disabled={claimingEns || !privyId} size="sm">
                {claimingEns ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                {claimingEns ? "Claiming..." : "Claim Free ENS"}
              </Button>
            )}
          </div>
          {proxy.ensResolvedAddress && (
            <p className="mt-2 text-xs text-gray">
              Owner wallet: {proxy.ensResolvedAddress.slice(0, 6)}...{proxy.ensResolvedAddress.slice(-4)}
            </p>
          )}
        </div>

        {hasClaimedEns && (
          <Button onClick={handleClaimEns} disabled={claimingEns || !privyId} variant="outline" className="w-full">
            {claimingEns ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
            {claimingEns ? "Syncing..." : "Sync Brain Records"}
          </Button>
        )}

        {Object.keys(ensRecords).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white">Brain records prepared for ENS</p>
            {[
              ["Description", ensRecords["clone.description"]],
              ["Capabilities", ensRecords["clone.capabilities"]],
              ["Personality", ensRecords["clone.personality"]],
            ].filter(([, value]) => typeof value === "string" && value.length > 0).map(([label, value]) => (
              <div key={label as string} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray">{label as string}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/80">{value as string}</p>
              </div>
            ))}
          </div>
        )}

        {ensError && <p className="text-coral text-xs">{ensError}</p>}
      </div>

      {/* Inline chat */}
      <div className="border border-white/6 rounded-xl overflow-hidden">
        <div className="bg-white/4 px-4 py-2.5 flex items-center gap-2 border-b border-white/6">
          <img
            src={proxy.avatarUrl ?? DEFAULT_AVATAR}
            alt={handle}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-white text-xs font-medium">@{handle}</span>
          {proxy.ensName && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-lime/10 px-2 py-0.5 text-[10px] font-semibold text-lime">
              <Globe2 size={10} /> {proxy.ensName}
            </span>
          )}
          <span className="ml-auto text-gray text-[11px]">Test Chat</span>
        </div>

        <div className="h-[220px] overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <MessageSquare size={24} className="text-gray mb-2" />
              <p className="text-gray text-xs">Send a message to test your proxy</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-lime text-black rounded-br-md"
                    : "bg-white/6 text-white rounded-bl-md"
                )}
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-gray animate-pulse" />
                    <span className="w-1 h-1 rounded-full bg-gray animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1 h-1 rounded-full bg-gray animate-pulse [animation-delay:0.4s]" />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="px-3 pb-3">
          <div className="flex items-center gap-2 bg-white/4 border border-white/6 rounded-xl px-3 py-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask @${handle} anything...`}
              className="flex-1 bg-transparent text-white text-xs placeholder:text-gray/50 outline-none"
            />
            {isLoading ? (
              <button type="button" onClick={stop} className="p-1 rounded-full bg-red-500/20 text-red-400 cursor-pointer">
                <Square size={10} />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} className="p-1 rounded-full bg-lime text-black disabled:opacity-30 cursor-pointer">
                <ArrowUp size={10} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Launch button */}
      {isLive ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm justify-center">
          <Check size={16} /> Your clone is live!
        </div>
      ) : (
        <Button onClick={handleLaunch} disabled={launching || !hasClaimedEns} className="w-full" size="lg">
          {launching ? (
            <><Loader2 size={16} className="animate-spin" /> Launching...</>
          ) : !hasClaimedEns ? (
            <><Globe2 size={16} /> Claim ENS to Launch</>
          ) : (
            <><Zap size={16} /> Launch Clone</>
          )}
        </Button>
      )}
    </div>
  );
}
