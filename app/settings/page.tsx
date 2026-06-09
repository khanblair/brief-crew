"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/ui/Sidebar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const FREELANCER_NAV = [
  { href: "/dashboard",    label: "Projects",    icon: <span>📋</span> },
  { href: "/projects/new", label: "New Project", icon: <span>➕</span> },
  { href: "/clients",      label: "Clients",     icon: <span>👥</span> },
  { href: "/my-page",      label: "My Page",     icon: <span>🔗</span> },
  { href: "/settings",     label: "Settings",    icon: <span>⚙️</span> },
];

const CLIENT_NAV = [
  { href: "/my-projects", label: "My Projects",       icon: <span>📦</span> },
  { href: "/freelancers", label: "Find a Freelancer", icon: <span>🔍</span> },
  { href: "/settings",    label: "Settings",          icon: <span>⚙️</span> },
];

export default function SettingsPage() {
  const { user } = useUser();
  const userData      = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");
  const updateProfile = useMutation(api.users.updateProfile);

  const [form, setForm] = useState({
    displayName: "",
    professionalTitle: "",
    companyName: "",
    telegramChatId: "",
  });
  const [prefilled, setPrefilled]   = useState(false);
  const [saved, setSaved]           = useState(false);
  const [loading, setLoading]       = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<"sent" | "failed" | "no_recipient" | "network_error" | "bot_rejected" | null>(null);

  // Prefill once data loads
  if (userData && !prefilled && userData.displayName) {
    setForm({
      displayName:       userData.displayName,
      professionalTitle: userData.professionalTitle ?? "",
      companyName:       userData.companyName ?? "",
      telegramChatId:    userData.telegramChatId ?? "",
    });
    setPrefilled(true);
  }

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile({
        clerkId: user.id,
        displayName:       form.displayName,
        professionalTitle: form.professionalTitle || undefined,
        companyName:       form.companyName       || undefined,
        telegramChatId:    form.telegramChatId    || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res  = await fetch("/api/telegram/test", { method: "POST" });
      const data = await res.json();
      setTestResult(data.ok ? "sent" : (data.reason ?? "failed"));
    } catch {
      setTestResult("failed");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 8000);
    }
  };

  const isFreelancer = userData?.role === "freelancer";
  const hasChatId    = Boolean(userData?.telegramChatId);

  const telegramStatus = hasChatId
    ? { label: "Connected", color: "text-green-600 bg-green-50 border-green-200", icon: "🟢" }
    : { label: "Not connected", color: "text-neutral-500 bg-neutral-50 border-neutral-200", icon: "⚪" };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        navItems={isFreelancer ? FREELANCER_NAV : CLIENT_NAV}
        title={isFreelancer ? "Freelancer" : "Client Portal"}
      />
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-neutral-900 mb-8">Account Settings</h1>

          {/* Profile */}
          <Card className="mb-6">
            <h2 className="font-semibold text-neutral-800 mb-4">Profile</h2>
            <div className="flex flex-col gap-4">
              <Input
                label="Display Name"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
              {isFreelancer && (
                <Input
                  label="Professional Title"
                  placeholder="e.g. Product Strategist"
                  value={form.professionalTitle}
                  onChange={(e) => setForm((f) => ({ ...f, professionalTitle: e.target.value }))}
                />
              )}
              {!isFreelancer && (
                <Input
                  label="Company Name"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                />
              )}
              <Button onClick={handleSave} loading={loading} className="w-full justify-center">
                {saved ? "Saved ✓" : "Save Changes"}
              </Button>
            </div>
          </Card>

          {/* Telegram */}
          <Card className="mb-6">
            <h2 className="font-semibold text-neutral-800 mb-1">Telegram Notifications</h2>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              {isFreelancer
                ? "Get notified when a client submits a brief."
                : "Get notified when your package is ready."}
            </p>

            {/* Status pill */}
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium mb-5 ${telegramStatus.color}`}>
              <span>{telegramStatus.icon}</span>
              {telegramStatus.label}
            </div>

            {/* How to find chat ID */}
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 leading-relaxed">
              <p className="font-medium mb-1">How to find your Chat ID</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-600">
                <li>Open Telegram and message <b>@userinfobot</b></li>
                <li>It replies instantly with your numeric Chat ID</li>
                <li>Paste it below and save</li>
                <li>Make sure you&apos;ve also started <b>@brief_crew_bot</b> (so it can message you)</li>
              </ol>
            </div>

            {/* Chat ID input + save */}
            <div className="flex flex-col gap-3 mb-4">
              <Input
                label="Your Telegram Chat ID"
                placeholder="e.g. 5367731807"
                value={form.telegramChatId}
                onChange={(e) => setForm((f) => ({ ...f, telegramChatId: e.target.value.trim() }))}
              />
              <div className="flex items-center gap-3">
                <Button onClick={handleSave} loading={loading} className="flex-1 justify-center">
                  {saved ? "Saved ✓" : "Save Chat ID"}
                </Button>

                {hasChatId && (
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testing ? (
                      <>
                        <span className="size-3.5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>📨 Test</>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                testResult === "sent"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : testResult === "no_recipient"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {testResult === "sent" && (
                  <>✅ <span>Message sent! Check your Telegram.</span></>
                )}
                {testResult === "no_recipient" && (
                  <>⚠️ <span>No Chat ID saved yet. Enter your Chat ID above and save first.</span></>
                )}
                {testResult === "network_error" && (
                  <>🌐 <span>
                    Couldn&apos;t reach Telegram (network timeout). Works fine on the deployed app —
                    if testing locally, deploy to Vercel first.
                  </span></>
                )}
                {testResult === "bot_rejected" && (
                  <>❌ <span>
                    Telegram rejected the message. Make sure you&apos;ve started <b>@brief_crew_bot</b> first,
                    then try again.
                  </span></>
                )}
                {testResult === "failed" && (
                  <>❌ <span>Unexpected error. Check server logs for details.</span></>
                )}
              </div>
            )}
          </Card>

          {isFreelancer && (
            <Card>
              <h2 className="font-semibold text-neutral-800 mb-3">Declared Base Code</h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Built on KolaAgent (Agent Economy Hackathon, May 2026) and KolaMatch Intelligence
                (Build Challenge, April 2026). Declared for Kolaborate ETDI Capstone Hackathon
                compliance transparency.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
