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
  const userData    = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");
  const updateProfile = useMutation(api.users.updateProfile);

  const [form, setForm] = useState({ displayName: "", professionalTitle: "", companyName: "", telegramUsername: "" });
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);

  if (userData && !form.displayName && userData.displayName) {
    setForm({
      displayName:      userData.displayName,
      professionalTitle: userData.professionalTitle ?? "",
      companyName:      userData.companyName ?? "",
      telegramUsername: userData.telegramUsername ?? "",
    });
  }

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile({
        clerkId: user.id,
        displayName: form.displayName,
        professionalTitle: form.professionalTitle || undefined,
        companyName: form.companyName || undefined,
        telegramUsername: form.telegramUsername || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setLoading(false); }
  };

  const isFreelancer = userData?.role === "freelancer";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={isFreelancer ? FREELANCER_NAV : CLIENT_NAV} title={isFreelancer ? "Freelancer" : "Client Portal"} />
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-neutral-900 mb-8">Account Settings</h1>

          <Card className="mb-6">
            <h2 className="font-semibold text-neutral-800 mb-4">Profile</h2>
            <div className="flex flex-col gap-4">
              <Input label="Display Name" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
              {isFreelancer && (
                <Input label="Professional Title" placeholder="e.g. Product Strategist" value={form.professionalTitle} onChange={(e) => setForm((f) => ({ ...f, professionalTitle: e.target.value }))} />
              )}
              {!isFreelancer && (
                <Input label="Company Name" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
              )}
              <Input label="Telegram Username" placeholder="@username" value={form.telegramUsername} onChange={(e) => setForm((f) => ({ ...f, telegramUsername: e.target.value }))} />
              <Button onClick={handleSave} loading={loading} className="w-full justify-center">
                {saved ? "Saved ✓" : "Save Changes"}
              </Button>
            </div>
          </Card>

          {isFreelancer && (
            <Card>
              <h2 className="font-semibold text-neutral-800 mb-3">Declared Base Code</h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Built on KolaAgent (Agent Economy Hackathon, May 2026) and KolaMatch Intelligence (Build Challenge, April 2026).
                Declared for Kolaborate ETDI Capstone Hackathon compliance transparency.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
