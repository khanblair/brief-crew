"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AgentLog } from "@/components/AgentLog";
import type { LogEntry } from "@/lib/agents/types";
import type { Id } from "@/convex/_generated/dataModel";

const PHASES = [
  "Phase 1: Research (sequential)",
  "Phase 2: Writing + Proposal (parallel)",
  "Phase 3: Building (sequential)",
  "Phase 4: Assembly (sequential)",
  "Complete",
];

export default function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const router = useRouter();

  const project  = useQuery(api.projects.getById, { id: id as Id<"projects"> });
  const userData = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");

  const [entries, setEntries]   = useState<LogEntry[]>([]);
  const [phase, setPhase]       = useState(PHASES[0]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed]   = useState(0);
  const [complete, setComplete] = useState(false);
  const [started, setStarted]   = useState(false);

  useEffect(() => {
    if (!startTime || complete) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 500);
    return () => clearInterval(interval);
  }, [startTime, complete]);

  const emit = (entry: Omit<LogEntry, "id" | "timestamp">) => {
    setEntries((prev) => [...prev, { id: Math.random().toString(36).slice(2), timestamp: Date.now(), ...entry }]);
    if (entry.message.includes("Phase 2")) setPhase(PHASES[1]);
    else if (entry.message.includes("Phase 3")) setPhase(PHASES[2]);
    else if (entry.message.includes("Phase 4")) setPhase(PHASES[3]);
    else if (entry.message.includes("Package complete")) setPhase(PHASES[4]);
  };

  useEffect(() => {
    if (started || !project || !userData) return;
    setStarted(true);
    setStartTime(Date.now());

    const run = async () => {
      const res = await fetch("/api/run-crew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          briefText: project.briefText,
          clientName: project.clientName,
          clientCompany: project.clientCompany,
          clientEmail: project.clientEmail,
          clientTelegram: project.clientTelegram,
          freelancerName: userData.displayName,
          freelancerTitle: userData.professionalTitle ?? "Freelancer",
          projectTitle: project.title,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "complete") {
              setComplete(true);
              setTimeout(() => router.push(`/projects/${id}`), 3000);
            } else if (data.type === "error") {
              emit({ agent: "Orchestrator", status: "error", message: data.message });
            } else if (data.agent) {
              emit(data);
            }
          } catch { /* ignore */ }
        }
      }
    };

    run().catch((err) => emit({ agent: "Orchestrator", status: "error", message: err.message ?? "Connection failed" }));
  }, [project, userData, started, id, router]);

  if (complete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-brand mb-2">Package Complete</h2>
          <p className="text-neutral-500">Redirecting to project view...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Agent Activity Log</h1>
        {project && (
          <p className="text-sm text-neutral-500 mt-1">{project.title} · {project.clientName}</p>
        )}
      </div>
      <AgentLog entries={entries} phase={phase} elapsed={elapsed} />
    </div>
  );
}
