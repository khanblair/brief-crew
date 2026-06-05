"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface BriefAnalysis {
  valid: boolean;
  message?: string;
  deliverables?: { name: string; agent: string }[];
  estimatedRuntime?: string;
}

type Step = "client" | "brief";

export default function NewProjectPage() {
  const { user } = useUser();
  const router = useRouter();
  const createProject = useMutation(api.projects.create);
  const userData = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");

  const [step, setStep] = useState<Step>("client");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<BriefAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [clientForm, setClientForm] = useState({
    clientName: "", clientCompany: "", clientEmail: "", clientTelegram: "", title: "",
  });
  const [briefText, setBriefText] = useState("");
  const debouncedBrief = useDebounce(briefText, 2000);

  const analyzeBrief = useCallback(async (text: string) => {
    if (!text || text.trim().split(/\s+/).length < 10) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefText: text }),
      });
      setAnalysis(await res.json());
    } catch { setAnalysis(null); }
    finally { setAnalyzing(false); }
  }, []);

  useEffect(() => {
    if (debouncedBrief) analyzeBrief(debouncedBrief);
  }, [debouncedBrief, analyzeBrief]);

  const handleRun = async () => {
    if (!user || !userData) return;
    setLoading(true);
    try {
      const projectId = await createProject({
        title: clientForm.title,
        freelancerId: user.id,
        clientName: clientForm.clientName,
        clientCompany: clientForm.clientCompany,
        clientEmail: clientForm.clientEmail,
        clientTelegram: clientForm.clientTelegram || undefined,
        briefText,
      });
      router.push(`/projects/${projectId}/run`);
    } finally { setLoading(false); }
  };

  const clientReady = clientForm.clientName && clientForm.clientCompany && clientForm.clientEmail && clientForm.title;
  const briefReady = briefText.trim().split(/\s+/).length >= 50 && analysis?.valid !== false;

  if (step === "client") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">New Project</h1>
          <p className="text-sm text-neutral-500 mt-1">Step 1 of 2 — Client Details</p>
        </div>
        <Card>
          <div className="flex flex-col gap-4">
            <Input label="Project Title" placeholder="Short internal name for this project" value={clientForm.title} onChange={(e) => setClientForm((f) => ({ ...f, title: e.target.value }))} />
            <Input label="Client Name" placeholder="Full name" value={clientForm.clientName} onChange={(e) => setClientForm((f) => ({ ...f, clientName: e.target.value }))} />
            <Input label="Company Name" placeholder="Client's company or organisation" value={clientForm.clientCompany} onChange={(e) => setClientForm((f) => ({ ...f, clientCompany: e.target.value }))} />
            <Input label="Client Email" type="email" placeholder="client@company.com" value={clientForm.clientEmail} onChange={(e) => setClientForm((f) => ({ ...f, clientEmail: e.target.value }))} />
            <Input label="Client Telegram (optional)" placeholder="@username — leave blank to skip notification" value={clientForm.clientTelegram} onChange={(e) => setClientForm((f) => ({ ...f, clientTelegram: e.target.value }))} />
            <Button onClick={() => setStep("brief")} disabled={!clientReady} className="mt-2 w-full justify-center">
              Continue to Brief →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">New Project</h1>
        <p className="text-sm text-neutral-500 mt-1">Step 2 of 2 — The Brief</p>
      </div>

      <Card className="mb-6">
        <Textarea
          label="Client Brief"
          placeholder="Paste the client's brief exactly as received. WhatsApp message, email, voice note transcript — any format works. Minimum 50 words."
          value={briefText}
          onChange={(e) => { setBriefText(e.target.value); setAnalysis(null); }}
          className="min-h-[300px]"
        />
        <p className="text-xs text-neutral-400 mt-2">
          {briefText.trim().split(/\s+/).filter(Boolean).length} words
        </p>
      </Card>

      {(analyzing || analysis) && (
        <Card className="mb-6 bg-neutral-50">
          {analyzing ? (
            <div className="flex items-center gap-3 text-sm text-neutral-500">
              <span className="size-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              Analysing brief...
            </div>
          ) : analysis?.valid === false ? (
            <p className="text-sm text-amber-700">{analysis.message}</p>
          ) : analysis?.deliverables ? (
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-3">Detected deliverables:</p>
              <div className="flex flex-col gap-2">
                {analysis.deliverables.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="text-brand">✅</span>
                    <span className="text-neutral-800">{d.name}</span>
                    <span className="text-neutral-400">→ {d.agent}</span>
                  </div>
                ))}
              </div>
              {analysis.estimatedRuntime && (
                <p className="text-xs text-neutral-400 mt-3">
                  All five agents will be engaged. Estimated runtime: {analysis.estimatedRuntime}
                </p>
              )}
            </div>
          ) : null}
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setStep("client")}>← Back</Button>
        <Button onClick={handleRun} loading={loading} disabled={!briefReady} className="flex-1 justify-center">
          Run BriefCrew
        </Button>
      </div>
    </div>
  );
}
