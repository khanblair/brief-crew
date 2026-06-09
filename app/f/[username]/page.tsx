"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

const SAMPLE_BRIEFS = [
  {
    label: "Agri-fintech app",
    text: "We are building a mobile-first lending and savings platform for smallholder farmers in Uganda and Kenya. The product allows farmers to access microloans using their harvest data as collateral, save in group chamas, and receive payouts via mobile money. Our target users are rural farmers aged 25–50 with basic Android smartphones. We need market research on agri-fintech adoption in East Africa, a brand identity, a landing page, and a full project proposal with development costs.",
  },
  {
    label: "Health tech startup",
    text: "We are launching a telemedicine platform in Nigeria that connects patients in underserved areas with licensed doctors via WhatsApp and a lightweight web app. The service covers primary care consultations, prescription delivery, and lab test booking. We need a market analysis of digital health adoption in Nigeria, brand copy including a tagline and hero messaging, a mobile-optimised landing page, and a pitch deck outline for our seed round investor meetings.",
  },
  {
    label: "E-commerce logistics",
    text: "Our company provides last-mile delivery services for e-commerce businesses in Nairobi, Kampala, and Dar es Salaam. We use motorcycle riders and a route optimisation app to deliver packages within 4 hours. We are looking to raise pre-seed funding and need a complete engagement package: a market research report on the logistics gap in East African e-commerce, brand positioning and copy, a professional landing page, and a priced scope of work for building a full customer-facing tracking portal.",
  },
  {
    label: "EdTech platform",
    text: "We are building an offline-first learning platform for secondary school students in Rwanda and Tanzania. The app works without internet, syncs when connected, and covers STEM subjects aligned to the national curriculum. Teachers can assign work and track progress. We need market research on edtech penetration and mobile device usage among students in the region, brand copy for both student and school administrator audiences, a landing page targeting school procurement officers, and a project proposal for the full app build.",
  },
  {
    label: "B2B SaaS tool",
    text: "We have built a payroll and HR management SaaS tool for small businesses in Ghana and Côte d'Ivoire with 5 to 100 employees. The product handles payslips, tax compliance, leave management, and staff records. We currently have 40 paying customers and want to scale. We need a go-to-market research report on SME HR software adoption in West Africa, refreshed brand copy and positioning, a new landing page targeting business owners and finance managers, and a proposal for a full product redesign and feature expansion.",
  },
];

export default function PublicBriefPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user: clerkUser } = useUser();

  const freelancer  = useQuery(api.users.getByUsername, { username });
  const clientData  = useQuery(
    api.users.getByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  const [form, setForm] = useState({
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientTelegram: "",
    briefText: "",
  });
  const [prefilled, setPrefilled]   = useState(false);
  const [status, setStatus]         = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg]     = useState("");
  const [activeSample, setActiveSample] = useState<number | null>(null);

  // Auto-fill from logged-in client profile once loaded
  useEffect(() => {
    if (prefilled || !clientData) return;
    setForm((f) => ({
      clientName:     f.clientName     || clientData.displayName    || "",
      clientCompany:  f.clientCompany  || clientData.companyName    || "",
      clientEmail:    f.clientEmail    || clientData.email          || "",
      clientTelegram: f.clientTelegram || clientData.telegramChatId || "",
      briefText:      f.briefText,
    }));
    setPrefilled(true);
  }, [clientData, prefilled]);

  if (freelancer === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="size-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!freelancer || freelancer.role !== "freelancer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-semibold text-neutral-800 mb-2">Page not found</h1>
          <p className="text-neutral-500 text-sm">This freelancer page doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const wordCount = form.briefText.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit  = form.clientName && form.clientCompany && form.clientEmail && wordCount >= 30;

  const handleSampleClick = (i: number) => {
    setActiveSample(i);
    setForm((f) => ({ ...f, briefText: SAMPLE_BRIEFS[i].text }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/submit-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          clientTelegram: form.clientTelegram || undefined,
          freelancerClerkId: freelancer.clerkId,
          freelancerUsername: username,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Submission failed");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Brief received!</h1>
          <p className="text-neutral-500 leading-relaxed mb-2">
            Thanks, <span className="font-medium text-neutral-700">{form.clientName}</span>.
          </p>
          <p className="text-neutral-500 leading-relaxed">
            <span className="font-medium text-neutral-700">{freelancer.displayName}</span> has
            received your brief and will be in touch shortly.
          </p>
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 text-left">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
              What happens next
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: "👀", text: "Your freelancer reviews your brief" },
                { icon: "🤖", text: "AI agents research, write, and build your package" },
                { icon: "📲", text: "You receive a Telegram notification with a link to your deliverables" },
              ].map((step) => (
                <div key={step.icon} className="flex items-start gap-3 text-sm text-neutral-600">
                  <span>{step.icon}</span>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <span className="text-sm font-bold text-brand">BriefCrew</span>
          <span className="text-xs text-neutral-400">Agentic Freelancer System</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Freelancer profile */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-2xl font-bold text-brand shrink-0">
              {freelancer.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{freelancer.displayName}</h1>
              {freelancer.professionalTitle && (
                <p className="text-sm text-neutral-500">{freelancer.professionalTitle}</p>
              )}
            </div>
          </div>
          <p className="text-neutral-600 leading-relaxed text-sm">
            Submit your project brief below. {freelancer.displayName.split(" ")[0]} will review it
            and deliver a complete engagement package — market research, brand copy, a live landing
            page, pitch deck, and a priced proposal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Contact details */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-neutral-800">Your details</p>
              {clientData && (
                <span className="text-xs text-brand bg-brand-50 border border-brand-100 rounded-full px-2.5 py-0.5">
                  ✓ Pre-filled from your profile
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your Name" required>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  className="input-base"
                  required
                />
              </Field>
              <Field label="Company / Organisation" required>
                <input
                  type="text"
                  placeholder="Company name"
                  value={form.clientCompany}
                  onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))}
                  className="input-base"
                  required
                />
              </Field>
            </div>

            <Field label="Email Address" required>
              <input
                type="email"
                placeholder="you@company.com"
                value={form.clientEmail}
                onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                className="input-base"
                required
              />
            </Field>

            <Field
              label="Telegram Chat ID"
              hint="Optional — for delivery notification"
            >
              <input
                type="text"
                placeholder="e.g. 5367731807 — message @userinfobot to find yours"
                value={form.clientTelegram}
                onChange={(e) => setForm((f) => ({ ...f, clientTelegram: e.target.value.trim() }))}
                className="input-base"
              />
            </Field>
          </div>

          {/* Brief */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col gap-4">
            <p className="text-sm font-semibold text-neutral-800">Your project brief</p>

            {/* Sample briefs */}
            <div>
              <p className="text-xs text-neutral-400 mb-2">
                Need inspiration? Pick a sample to get started:
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_BRIEFS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSampleClick(i)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      activeSample === i
                        ? "border-brand bg-brand text-white"
                        : "border-neutral-300 bg-white text-neutral-600 hover:border-brand/50 hover:text-brand"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Project Brief"
              required
              hint={
                wordCount < 30
                  ? `${wordCount} words — ${30 - wordCount} more to go`
                  : `${wordCount} words ✓`
              }
            >
              <textarea
                placeholder="Describe your project. What are you building? Who is it for? What problem does it solve? What do you need delivered? The more context you give, the better the output."
                value={form.briefText}
                onChange={(e) => {
                  setForm((f) => ({ ...f, briefText: e.target.value }));
                  setActiveSample(null);
                }}
                className="input-base min-h-[220px] resize-y"
                required
              />
            </Field>
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || status === "submitting"}
            className="w-full rounded-xl bg-brand px-4 py-3.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-brand/20"
          >
            {status === "submitting" ? (
              <>
                <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Sending brief...
              </>
            ) : (
              "Submit Brief →"
            )}
          </button>

          <p className="text-xs text-neutral-400 text-center">
            Sent directly to {freelancer.displayName}. No account required.
          </p>
        </form>
      </div>

      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-base:focus {
          border-color: #2a8a35;
          box-shadow: 0 0 0 3px rgba(42,138,53,0.12);
        }
        .input-base::placeholder { color: #9ca3af; }
      `}</style>
    </div>
  );
}

function Field({
  label, required, hint, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-xs text-neutral-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
