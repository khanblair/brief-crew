import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; variant: "default" | "warning" | "success" | "info"; desc: string }> = {
  brief_submitted: { label: "Brief Received",   variant: "default",  desc: "Your freelancer has your brief and will start shortly." },
  agents_running:  { label: "Being Prepared",   variant: "warning",  desc: "AI agents are researching, writing, and building your package." },
  package_ready:   { label: "Ready for Review", variant: "success",  desc: "Your engagement package is complete and ready to view." },
  delivered:       { label: "Delivered",         variant: "success",  desc: "Your package has been delivered." },
  complete:        { label: "Complete",          variant: "info",     desc: "Engagement complete." },
};

export default async function MyProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await fetchQuery(api.users.getByClerkId, { clerkId: userId });
  if (!user?.onboardingComplete) redirect("/onboarding");
  if (user.role !== "client") redirect("/dashboard");

  const projects = await fetchQuery(api.projects.listByClient, { clientEmail: user.email });

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">My Projects</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Welcome back, {user.displayName}
          {user.companyName && <span className="text-neutral-400"> · {user.companyName}</span>}
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState email={user.email} />
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => {
            const meta    = STATUS_META[project.status] ?? STATUS_META.brief_submitted;
            const ready   = ["package_ready", "delivered", "complete"].includes(project.status);
            const running = project.status === "agents_running";
            return (
              <Card key={project._id} className="hover:border-neutral-300 transition-colors">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-neutral-900 truncate">{project.title}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{formatDate(project.createdAt)}</p>
                  </div>
                  <Badge label={meta.label} variant={meta.variant} />
                </div>

                {/* Status description */}
                <p className="text-sm text-neutral-500 mb-4">{meta.desc}</p>

                {/* Running animation */}
                {running && (
                  <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
                    <span className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <p className="text-sm text-amber-700">
                      AI agents are working on your package. You&apos;ll receive a Telegram
                      notification when it&apos;s ready to view.
                    </p>
                  </div>
                )}

                {/* Package contents preview */}
                {(ready || running) && (
                  <div className="mb-4 grid grid-cols-5 gap-2">
                    {[
                      { icon: "📊", label: "Research" },
                      { icon: "✍️", label: "Copy" },
                      { icon: "🌐", label: "Landing" },
                      { icon: "📋", label: "Pitch" },
                      { icon: "💼", label: "Proposal" },
                    ].map((doc) => (
                      <div
                        key={doc.label}
                        className={`rounded-lg border text-center py-2 px-1 ${
                          ready
                            ? "border-brand-100 bg-brand-50"
                            : "border-neutral-200 bg-neutral-50 opacity-50"
                        }`}
                      >
                        <p className="text-base mb-0.5">{doc.icon}</p>
                        <p className="text-xs text-neutral-500">{doc.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {ready && (
                  <Button asChild size="sm">
                    <Link href={`/packages/${project._id}`}>View Package →</Link>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Main empty card */}
      <Card className="text-center py-10">
        <p className="text-4xl mb-4">📭</p>
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">No packages yet</h2>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
          Projects sent to <span className="font-medium text-neutral-700">{email}</span> will
          appear here once your freelancer delivers them.
        </p>
      </Card>

      {/* How to get started — two paths */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-brand-50 border-brand-200">
          <div className="text-2xl mb-3">📩</div>
          <h3 className="font-semibold text-neutral-800 mb-2">
            Already submitted a brief?
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            If you filled out a freelancer&apos;s brief form, your project will appear here once
            they review it and begin work. You&apos;ll also receive a Telegram notification.
          </p>
        </Card>

        <Card>
          <div className="text-2xl mb-3">🔗</div>
          <h3 className="font-semibold text-neutral-800 mb-2">
            Need to submit a brief?
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed mb-3">
            Ask your freelancer to share their BriefCrew link. It looks like:
          </p>
          <code className="block rounded-lg bg-neutral-100 px-3 py-2 text-xs font-mono text-neutral-600 break-all">
            briefcrew.app/f/their-name
          </code>
        </Card>
      </div>

      {/* How it works timeline */}
      <Card>
        <h3 className="font-semibold text-neutral-800 mb-5">How it works</h3>
        <div className="relative flex flex-col gap-0">
          {[
            {
              icon: "🔗",
              title: "Freelancer shares their BriefCrew link",
              desc: "They post it on LinkedIn, WhatsApp, email — anywhere they reach clients.",
            },
            {
              icon: "📝",
              title: "You fill in your project brief",
              desc: "Name, company, and a description of what you need. No account required to submit.",
            },
            {
              icon: "🤖",
              title: "AI agents build your package",
              desc: "Five specialised agents research, write, build, and price your engagement — in minutes.",
            },
            {
              icon: "📲",
              title: "You receive a Telegram notification",
              desc: "With a direct link to log in and view your completed deliverables.",
            },
            {
              icon: "📦",
              title: "View and download everything here",
              desc: "Research report, brand copy, live landing page, pitch deck, and priced proposal.",
            },
          ].map((step, i, arr) => (
            <div key={step.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-sm shrink-0">
                  {step.icon}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px flex-1 bg-neutral-200 my-1" />
                )}
              </div>
              <div className="pb-5">
                <p className="text-sm font-medium text-neutral-800">{step.title}</p>
                <p className="text-sm text-neutral-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
