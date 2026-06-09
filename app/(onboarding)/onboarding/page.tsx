"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Role = "freelancer" | "client";
type Step = "role" | "profile";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.fullName ?? "",
    professionalTitle: "",
    companyName: "",
    telegramChatId: "",
  });

  const handleRoleSelect = (r: Role) => { setRole(r); setStep("profile"); };

  const handleSubmit = async () => {
    if (!role || !user) return;
    setLoading(true);
    try {
      await completeOnboarding({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        role,
        displayName: form.displayName,
        professionalTitle: form.professionalTitle || undefined,
        companyName: form.companyName || undefined,
        telegramChatId: form.telegramChatId || undefined,
      });
      router.push(role === "freelancer" ? "/dashboard" : "/my-projects");
    } finally {
      setLoading(false);
    }
  };

  if (step === "role") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-brand">Welcome to BriefCrew</h1>
            <p className="mt-2 text-neutral-500">Select your role to get started</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Card onClick={() => handleRoleSelect("freelancer")} className="text-center hover:border-brand/40 hover:shadow-md transition-all">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">I am a Freelancer</h2>
              <p className="text-sm text-neutral-500">
                I take client briefs and deliver engagement packages using AI agents.
              </p>
            </Card>
            <Card onClick={() => handleRoleSelect("client")} className="text-center hover:border-brand/40 hover:shadow-md transition-all">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">I am a Client</h2>
              <p className="text-sm text-neutral-500">
                I have received a link to view my project deliverables from my freelancer.
              </p>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Set Up Your Profile</h1>
          <p className="mt-1 text-sm text-neutral-500">You&apos;re joining as a {role}</p>
        </div>
        <Card>
          <div className="flex flex-col gap-4">
            <Input
              label="Display Name"
              placeholder="How you appear to others"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
            {role === "freelancer" && (
              <Input
                label="Professional Title"
                placeholder="e.g. Product Strategist, Digital Consultant"
                value={form.professionalTitle}
                onChange={(e) => setForm((f) => ({ ...f, professionalTitle: e.target.value }))}
              />
            )}
            {role === "client" && (
              <Input
                label="Company Name"
                placeholder="Your company or organisation"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            )}
            <Input
              label="Telegram Chat ID (optional)"
              placeholder="e.g. 5367731807 — message @userinfobot to find yours"
              value={form.telegramChatId}
              onChange={(e) => setForm((f) => ({ ...f, telegramChatId: e.target.value.trim() }))}
            />
            <Button onClick={handleSubmit} loading={loading} disabled={!form.displayName} className="mt-2 w-full justify-center">
              Complete Setup
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
