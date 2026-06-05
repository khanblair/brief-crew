"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function FreelancersPage() {
  const freelancers = useQuery(api.users.listFreelancers);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Find a Freelancer</h1>
        <p className="text-neutral-500 mt-1 max-w-xl">
          Every freelancer on BriefCrew uses AI agents to deliver a complete engagement package.
          Pick one and submit your brief — no back-and-forth, no waiting weeks.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-8 rounded-xl border border-brand-200 bg-brand-50 px-6 py-5">
        <p className="text-sm font-semibold text-neutral-800 mb-3">How it works</p>
        <div className="grid gap-3 sm:grid-cols-3 text-sm text-neutral-600">
          <div className="flex items-start gap-2">
            <span className="text-brand font-bold shrink-0">1.</span>
            <span>Pick a freelancer below and submit your project brief on their page.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-brand font-bold shrink-0">2.</span>
            <span>AI agents research, write, build, and price your engagement — in minutes.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-brand font-bold shrink-0">3.</span>
            <span>You get a Telegram notification and your package appears in My Projects.</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {freelancers === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-neutral-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-neutral-100 rounded" />
                <div className="h-3 bg-neutral-100 rounded w-4/5" />
              </div>
              <div className="h-9 bg-neutral-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-neutral-300 bg-white">
          <p className="text-4xl mb-4">👤</p>
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">No freelancers yet</h2>
          <p className="text-sm text-neutral-500">
            Freelancers will appear here once they set up their public page.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {freelancers.map((f) => (
            <FreelancerCard key={f._id} freelancer={f} />
          ))}
        </div>
      )}
    </div>
  );
}

type Freelancer = {
  _id: string;
  displayName: string;
  professionalTitle?: string;
  username?: string;
};

function FreelancerCard({ freelancer }: { freelancer: Freelancer }) {
  const initials = freelancer.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 flex flex-col hover:border-brand/40 hover:shadow-sm transition-all">
      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-base font-bold text-brand shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900 truncate">{freelancer.displayName}</p>
          <p className="text-sm text-neutral-500 truncate">
            {freelancer.professionalTitle ?? "Agentic Freelancer"}
          </p>
        </div>
      </div>

      {/* Deliverables */}
      <div className="mb-5 flex-1">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Delivers</p>
        <div className="flex flex-wrap gap-1.5">
          {["📊 Research", "✍️ Copy", "🌐 Landing page", "📋 Pitch deck", "💼 Proposal"].map((item) => (
            <span key={item} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/f/${freelancer.username}`}
        className="block w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-brand-hover transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        Submit a brief →
      </Link>
    </div>
  );
}
