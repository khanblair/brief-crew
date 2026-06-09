"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";

const TABS = [
  { key: "research",  label: "Market Research", icon: "📊" },
  { key: "brandCopy", label: "Brand Copy",       icon: "✍️" },
  { key: "proposal",  label: "Proposal",         icon: "💼" },
  { key: "landing",   label: "Landing Page",     icon: "🌐" },
] as const;

type TabKey = typeof TABS[number]["key"];

interface Props {
  research:  string;
  brandCopy: string;
  proposal:  string;
  vercelUrl?: string;
}

export function DeliverableViewer({ research, brandCopy, proposal, vercelUrl }: Props) {
  const [active, setActive] = useState<TabKey>("research");

  const content: Record<TabKey, string> = {
    research,
    brandCopy,
    proposal,
    landing: vercelUrl ?? "",
  };

  const available: Record<TabKey, boolean> = {
    research:  !!research,
    brandCopy: !!brandCopy,
    proposal:  !!proposal,
    landing:   !!vercelUrl,
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            disabled={!available[tab.key]}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              active === tab.key
                ? "bg-brand text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {available[tab.key] && active !== tab.key && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand/60" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        {active === "landing" ? (
          <LandingTab vercelUrl={vercelUrl} />
        ) : available[active] ? (
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap font-sans">
            {content[active]}
          </p>
        ) : (
          <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
            This document is not yet available.
          </div>
        )}
      </div>
    </div>
  );
}

function LandingTab({ vercelUrl }: { vercelUrl?: string }) {
  if (!vercelUrl) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
        Landing page not yet deployed.
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-white border border-neutral-200">
        <Badge label="Live" variant="success" />
        <a
          href={vercelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand hover:underline font-mono flex-1 truncate"
        >
          {vercelUrl}
        </a>
        <a
          href={vercelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white bg-brand hover:bg-brand-hover rounded px-2.5 py-1 font-medium transition-colors shrink-0"
        >
          Open ↗
        </a>
      </div>
      <iframe
        src={vercelUrl}
        className="w-full h-80 rounded-lg border border-neutral-200"
        title="Landing Page Preview"
      />
    </div>
  );
}
