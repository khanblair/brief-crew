"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function MyPagePage() {
  const { user } = useUser();
  const userData   = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");
  const setUsername = useMutation(api.users.setUsername);

  const [slug, setSlug]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  const currentSlug = userData?.username ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = currentSlug ? `${appUrl}/f/${currentSlug}` : null;

  const handleSaveSlug = async () => {
    if (!user || !slug.trim()) return;
    setSaving(true);
    setError("");
    try {
      const result = await setUsername({ clerkId: user.id, username: slug.trim() });
      setSaved(true);
      setSlug("");
      setTimeout(() => setSaved(false), 3000);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">My Public Page</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Share this link with clients so they can submit briefs directly to you.
        </p>
      </div>

      {/* Current link */}
      {publicUrl ? (
        <Card className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">Your brief submission link</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg bg-brand-50 border border-brand-100 px-4 py-3">
              <span className="text-sm font-mono text-brand break-all">{publicUrl}</span>
            </div>
            <Button onClick={handleCopy} variant="secondary" size="sm" className="shrink-0">
              {copied ? "Copied ✓" : "Copy"}
            </Button>
            <a
              href={`/f/${currentSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Preview ↗
            </a>
          </div>

          {/* Share instructions */}
          <div className="mt-5 rounded-lg bg-neutral-50 border border-neutral-200 p-4">
            <p className="text-xs font-medium text-neutral-600 mb-2">Share this link via</p>
            <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
              {["Email signature", "WhatsApp status", "LinkedIn bio", "Twitter/X bio", "Instagram bio"].map((ch) => (
                <span key={ch} className="rounded-full bg-white border border-neutral-200 px-2.5 py-1">{ch}</span>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 border-dashed border-brand-200 bg-brand-50/30">
          <div className="text-center py-4">
            <p className="text-2xl mb-3">🔗</p>
            <p className="font-medium text-neutral-700 mb-1">No public page yet</p>
            <p className="text-sm text-neutral-500">Set a username below to activate your brief submission link.</p>
          </div>
        </Card>
      )}

      {/* Username editor */}
      <Card className="mb-6">
        <h2 className="font-semibold text-neutral-800 mb-4">
          {currentSlug ? "Change username" : "Set your username"}
        </h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Username"
              placeholder={currentSlug || "e.g. blair-k"}
              value={slug}
              onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setError(""); }}
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              {appUrl}/f/<span className="font-mono text-neutral-600">{slug || currentSlug || "your-name"}</span>
            </p>
          </div>
          <Button onClick={handleSaveSlug} loading={saving} disabled={!slug.trim()} className="shrink-0 mb-6">
            {saved ? "Saved ✓" : "Save"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Card>

      {/* How it works */}
      <Card className="bg-neutral-50">
        <h2 className="font-semibold text-neutral-800 mb-4">How it works</h2>
        <div className="flex flex-col gap-4">
          {[
            { step: "1", title: "Client visits your link", desc: "They fill in their name, company, email, and project brief. No account needed." },
            { step: "2", title: "Brief lands in your dashboard", desc: "It appears as a new project in \"Brief Submitted\" state, ready for you to review." },
            { step: "3", title: "You run BriefCrew", desc: "Click Run — the agent crew handles research, writing, building, and proposal." },
            { step: "4", title: "Client gets notified", desc: "A Telegram message goes to the client with a link to their completed package." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">{item.title}</p>
                <p className="text-sm text-neutral-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
