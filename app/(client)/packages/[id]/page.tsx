"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatRuntime } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

const DOCS = [
  { key: "research",    label: "Market Research",     icon: "📊", desc: "Grounded market analysis with live data" },
  { key: "brandCopy",   label: "Brand Copy",          icon: "✍️", desc: "Taglines, hero copy, features, CTAs, bio" },
  { key: "landingPage", label: "Landing Page",        icon: "🌐", desc: "Live deployed page" },
  { key: "pitchDeck",   label: "Pitch Deck Outline",  icon: "📋", desc: "10-slide structure with speaker notes" },
  { key: "proposal",    label: "Project Proposal",    icon: "💼", desc: "Scoped and priced for your project" },
] as const;

export default function PackageViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();

  const project        = useQuery(api.projects.getById, { id: id as Id<"projects"> });
  const pkg            = useQuery(api.packages.getByProject, { projectId: id as Id<"projects"> });
  const runData        = useQuery(api.runs.getRunWithOutputs, { projectId: id as Id<"projects"> });
  const freelancer     = useQuery(
    api.users.getByClerkId,
    project?.freelancerId ? { clerkId: project.freelancerId } : "skip"
  );
  const createRevision = useMutation(api.packages.createRevision);

  const [activeDoc, setActiveDoc]             = useState<string>("research");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionDoc, setRevisionDoc]         = useState("Market Research Report");
  const [revisionMsg, setRevisionMsg]         = useState("");
  const [revisionSent, setRevisionSent]       = useState(false);

  const isLoading = project === undefined || runData === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-neutral-500">Package not found.</p>
        <Link href="/my-projects" className="text-sm text-brand hover:underline">← Back to My Projects</Link>
      </div>
    );
  }

  const outputs   = runData?.outputs ?? [];
  const research  = outputs.find((o) => o.agentName === "research")?.outputText ?? "";
  const brandCopy = outputs.find((o) => o.agentName === "writer")?.outputText ?? "";
  const proposal  = outputs.find((o) => o.agentName === "proposal")?.outputText ?? "";
  const run       = runData?.run;

  const docContent: Record<string, string> = {
    research,
    brandCopy,
    landingPage: pkg?.vercelUrl ? `Live URL: ${pkg.vercelUrl}` : "",
    pitchDeck: brandCopy,
    proposal,
  };

  const docReady: Record<string, boolean> = {
    research:    !!research,
    brandCopy:   !!brandCopy,
    landingPage: !!pkg?.vercelUrl,
    pitchDeck:   !!brandCopy,
    proposal:    !!proposal,
  };

  const handleRevisionSubmit = async () => {
    if (!user) return;
    await createRevision({
      projectId: id as Id<"projects">,
      clientId: user.id,
      documentType: revisionDoc,
      message: revisionMsg,
    });
    setRevisionSent(true);
  };

  return (
    <div className="max-w-5xl mx-auto">

      {/* Back */}
      <Link href="/my-projects" className="text-sm text-neutral-400 hover:text-neutral-600 mb-5 inline-block">
        ← My Projects
      </Link>

      {/* Package header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 mb-1">{project.title}</h1>
            <p className="text-sm text-neutral-500">
              {project.clientCompany && <span className="font-medium text-neutral-700">{project.clientCompany}</span>}
              {project.completedAt && (
                <span className="text-neutral-400"> · Delivered {formatDate(project.completedAt)}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge
              label={project.status === "complete" ? "Complete" : "Delivered"}
              variant="success"
            />
            <Button variant="secondary" size="sm" onClick={() => setShowRevisionModal(true)}>
              Request Revision
            </Button>
          </div>
        </div>

        {/* Prepared by */}
        {freelancer && (
          <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-sm font-bold text-brand">
              {freelancer.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-neutral-400">Prepared by</p>
              <p className="text-sm font-medium text-neutral-800">
                {freelancer.displayName}
                {freelancer.professionalTitle && (
                  <span className="text-neutral-500 font-normal"> · {freelancer.professionalTitle}</span>
                )}
              </p>
            </div>
            {run?.totalRuntime && (
              <div className="ml-auto text-right">
                <p className="text-xs text-neutral-400">Generated in</p>
                <p className="text-sm font-medium text-neutral-700">{formatRuntime(run.totalRuntime)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Package contents overview */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {DOCS.map((doc) => (
          <button
            key={doc.key}
            onClick={() => setActiveDoc(doc.key)}
            className={`rounded-xl border p-3 text-center transition-all ${
              activeDoc === doc.key
                ? "border-brand bg-brand-50 shadow-sm"
                : "border-neutral-200 bg-white hover:border-brand/40"
            }`}
          >
            <p className="text-xl mb-1">{doc.icon}</p>
            <p className={`text-xs font-medium leading-tight ${activeDoc === doc.key ? "text-brand" : "text-neutral-600"}`}>
              {doc.label}
            </p>
            {docReady[doc.key] ? (
              <p className="text-[10px] text-brand-700 mt-1">✓ Ready</p>
            ) : (
              <p className="text-[10px] text-neutral-400 mt-1">Pending</p>
            )}
          </button>
        ))}
      </div>

      {/* Main content panel */}
      <Card>
        {/* Document header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-neutral-100">
          <span className="text-xl">{DOCS.find((d) => d.key === activeDoc)?.icon}</span>
          <div>
            <h2 className="font-semibold text-neutral-900">{DOCS.find((d) => d.key === activeDoc)?.label}</h2>
            <p className="text-xs text-neutral-400">{DOCS.find((d) => d.key === activeDoc)?.desc}</p>
          </div>
        </div>

        {/* Content */}
        {activeDoc === "landingPage" ? (
          <LandingPageView vercelUrl={pkg?.vercelUrl} />
        ) : docReady[activeDoc] ? (
          <div className="prose prose-sm prose-neutral max-w-none
            prose-headings:font-semibold prose-headings:text-neutral-900
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
            prose-p:text-neutral-700 prose-p:leading-relaxed
            prose-strong:text-neutral-800 prose-strong:font-semibold
            prose-ul:text-neutral-700 prose-ol:text-neutral-700
            prose-li:my-0.5
            prose-table:text-sm prose-th:bg-neutral-50 prose-th:text-neutral-700
            prose-blockquote:border-brand prose-blockquote:text-neutral-600
            prose-code:text-brand prose-code:bg-brand-50 prose-code:px-1 prose-code:rounded
            prose-hr:border-neutral-200">
            <ReactMarkdown>{docContent[activeDoc]}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">⏳</p>
            <p className="text-neutral-500 text-sm">This document is still being prepared.</p>
          </div>
        )}
      </Card>

      {/* Revision modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xl p-6 w-full max-w-md">
            {revisionSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4 text-2xl">✅</div>
                <p className="text-lg font-semibold text-neutral-900 mb-2">Revision Request Sent</p>
                <p className="text-sm text-neutral-500 mb-2">
                  {freelancer?.displayName ?? "Your freelancer"} has been notified and will be in touch.
                </p>
                <Button
                  onClick={() => { setShowRevisionModal(false); setRevisionSent(false); setRevisionMsg(""); }}
                  className="mt-2"
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-neutral-900 mb-1">Request a Revision</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Your request goes directly to {freelancer?.displayName ?? "your freelancer"} via Telegram.
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 block mb-1.5">Which document?</label>
                    <select
                      value={revisionDoc}
                      onChange={(e) => setRevisionDoc(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand/40"
                    >
                      {DOCS.map((d) => <option key={d.key} value={d.label}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 block mb-1.5">What needs to change?</label>
                    <textarea
                      value={revisionMsg}
                      onChange={(e) => setRevisionMsg(e.target.value)}
                      placeholder="Be specific — what was missing, what was off, what do you need instead?"
                      rows={4}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setShowRevisionModal(false)}>Cancel</Button>
                    <Button onClick={handleRevisionSubmit} disabled={!revisionMsg} className="flex-1 justify-center">
                      Send Request
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LandingPageView({ vercelUrl }: { vercelUrl?: string }) {
  if (!vercelUrl) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-3">⏳</p>
        <p className="text-neutral-500 text-sm">Landing page deployment pending.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-brand-50 border border-brand-100">
        <Badge label="Live" variant="success" />
        <a href={vercelUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline font-mono flex-1 truncate">
          {vercelUrl}
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(vercelUrl)}
          className="text-xs text-neutral-500 hover:text-neutral-700 border border-neutral-300 rounded px-2 py-1"
        >
          Copy URL
        </button>
        <a
          href={vercelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white bg-brand hover:bg-brand-hover rounded px-3 py-1 font-medium transition-colors"
        >
          Open ↗
        </a>
      </div>
      <iframe
        src={vercelUrl}
        className="w-full h-[500px] rounded-lg border border-neutral-200"
        title="Landing Page Preview"
      />
    </div>
  );
}
