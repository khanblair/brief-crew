"use client";

import { useEffect, useRef } from "react";
import type { LogEntry, AgentName } from "@/lib/agents/types";

const AGENT_COLORS: Record<AgentName, string> = {
  Orchestrator:     "text-neutral-200",
  "Research Agent": "text-blue-400",
  "Writer Agent":   "text-amber-400",
  "Builder Agent":  "text-emerald-400",
  "Proposal Agent": "text-purple-400",
  Telegram:         "text-cyan-400",
};

interface AgentLogProps {
  entries: LogEntry[];
  phase?: string;
  elapsed?: number;
}

export function AgentLog({ entries, phase, elapsed }: AgentLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <div className="flex flex-col gap-3">
      {/* Phase status header */}
      <div className="flex items-center justify-between rounded-lg bg-neutral-800 px-4 py-3 border border-neutral-700">
        <div className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-brand animate-pulse" />
          <span className="text-sm font-medium text-neutral-200">{phase ?? "Initialising..."}</span>
        </div>
        {elapsed !== undefined && (
          <span className="font-mono text-sm text-neutral-400">{formatElapsed(elapsed)}</span>
        )}
      </div>

      {/* Terminal log — intentionally dark */}
      <div className="h-[500px] overflow-y-auto rounded-xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-xs leading-relaxed">
        {entries.map((entry) => (
          <LogLine key={entry.id} entry={entry} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const color = AGENT_COLORS[entry.agent] ?? "text-neutral-300";
  const icon =
    entry.status === "running" ? "⚡" : entry.status === "complete" ? "✅" : "❌";

  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="shrink-0 w-4">{icon}</span>
      <span className={`shrink-0 w-36 font-semibold ${color}`}>{entry.agent}</span>
      <span className="text-neutral-300">{entry.message}</span>
      {entry.elapsed !== undefined && (
        <span className="ml-auto shrink-0 text-neutral-600 pl-4">{entry.elapsed}ms</span>
      )}
    </div>
  );
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
