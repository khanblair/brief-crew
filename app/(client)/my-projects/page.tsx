import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, countWords } from "@/lib/utils";

const DOCS = [
  { icon: "📊", label: "Research" },
  { icon: "✍️", label: "Copy" },
  { icon: "🌐", label: "Landing" },
  { icon: "📋", label: "Pitch" },
  { icon: "💼", label: "Proposal" },
];

export default async function MyProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await fetchQuery(api.users.getByClerkId, { clerkId: userId });
  if (!user?.onboardingComplete) redirect("/onboarding");
  if (user.role !== "client") redirect("/dashboard");

  const projects = await fetchQuery(api.projects.listByClient, { clientEmail: user.email });

  // Fetch freelancer info for each project
  const freelancerMap = new Map<string, { displayName: string; professionalTitle?: string }>();
  if (projects.length > 0) {
    const uniqueIds = [...new Set(projects.map((p) => p.freelancerId))];
    const freelancers = await Promise.all(
      uniqueIds.map((clerkId) => fetchQuery(api.users.getByClerkId, { clerkId }))
    );
    uniqueIds.forEach((id, i) => {
      const f = freelancers[i];
      if (f) freelancerMap.set(id, { displayName: f.displayName, professionalTitle: f.professionalTitle });
    });
  }

  // Section grouping
  const deliveredProjects = projects.filter((p) =>
    ["package_ready", "delivered", "complete"].includes(p.status)
  );
  const inProgressProjects = projects.filter((p) =>
    ["brief_submitted", "agents_running"].includes(p.status)
  );

  return (
    <div className="max-w-3xl mx-auto">
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
        <div className="flex flex-col gap-10">

          {/* Delivered packages — primary section */}
          {deliveredProjects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span>📦</span>
                <h2 className="font-semibold text-neutral-700">Your Packages</h2>
                <span className="rounded-full bg-brand-50 text-brand text-xs px-2 py-0.5 border border-brand-100">
                  {deliveredProjects.length} ready
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {deliveredProjects.map((project) => {
                  const freelancer = freelancerMap.get(project.freelancerId);
                  const briefPreview = project.briefText?.slice(0, 160).trim();
                  const isComplete = project.status === "complete";

                  return (
                    <Card key={project._id} className="border-brand-200 bg-brand-50/20 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-semibold text-neutral-900">{project.title}</h3>
                        <Badge
                          label={isComplete ? "Complete" : "Ready to View"}
                          variant={isComplete ? "info" : "success"}
                        />
                      </div>

                      {freelancer && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-neutral-500">
                          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand text-[10px] font-bold flex items-center justify-center shrink-0">
                            {freelancer.displayName.charAt(0).toUpperCase()}
                          </span>
                          <span>
                            Prepared by <span className="font-medium text-neutral-700">{freelancer.displayName}</span>
                            {freelancer.professionalTitle && ` · ${freelancer.professionalTitle}`}
                          </span>
                          <span>·</span>
                          <span>{formatDate(project.createdAt)}</span>
                        </div>
                      )}

                      {/* Package contents */}
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {DOCS.map((doc) => (
                          <div key={doc.label} className="rounded-lg border border-brand-200 bg-white text-center py-2.5 px-1">
                            <p className="text-base mb-0.5">{doc.icon}</p>
                            <p className="text-xs text-neutral-500">{doc.label}</p>
                            <p className="text-[10px] text-brand mt-0.5">✓</p>
                          </div>
                        ))}
                      </div>

                      {/* Brief reminder */}
                      {briefPreview && (
                        <div className="mb-4">
                          <p className="text-xs text-neutral-400 mb-1">Your brief</p>
                          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">
                            {briefPreview}{project.briefText.length > 160 ? "…" : ""}
                          </p>
                        </div>
                      )}

                      <Button asChild size="sm">
                        <Link href={`/packages/${project._id}`}>View Full Package →</Link>
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* In-progress */}
          {inProgressProjects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span>⚡</span>
                <h2 className="font-semibold text-neutral-700">In Progress</h2>
                <span className="rounded-full bg-neutral-100 text-neutral-500 text-xs px-2 py-0.5">
                  {inProgressProjects.length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {inProgressProjects.map((project) => {
                  const running    = project.status === "agents_running";
                  const waiting    = project.status === "brief_submitted";
                  const freelancer = freelancerMap.get(project.freelancerId);
                  const briefWords = countWords(project.briefText ?? "");
                  const briefPreview = project.briefText?.slice(0, 160).trim();

                  return (
                    <Card key={project._id} className={running ? "border-amber-200 bg-amber-50/30" : ""}>
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-semibold text-neutral-900">{project.title}</h3>
                        <Badge
                          label={running ? "Being Prepared" : "Brief Received"}
                          variant={running ? "warning" : "default"}
                        />
                      </div>

                      {freelancer && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-neutral-500">
                          <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {freelancer.displayName.charAt(0).toUpperCase()}
                          </span>
                          <span>
                            {freelancer.displayName}
                            {freelancer.professionalTitle && ` · ${freelancer.professionalTitle}`}
                          </span>
                          <span>·</span>
                          <span>{formatDate(project.createdAt)}</span>
                        </div>
                      )}

                      {/* Status message */}
                      {running ? (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                          <span className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                          <p className="text-sm text-amber-700">
                            AI agents are actively building your package. You&apos;ll receive a Telegram notification when it&apos;s ready.
                          </p>
                        </div>
                      ) : (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2.5">
                          <span className="size-2 rounded-full bg-neutral-400 shrink-0" />
                          <p className="text-sm text-neutral-500">
                            Brief received — your freelancer will review and run the AI crew shortly.
                          </p>
                        </div>
                      )}

                      {/* Brief preview */}
                      {briefPreview && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Your brief</p>
                            <span className="text-xs text-neutral-400">{briefWords} words</span>
                          </div>
                          <div className="rounded-lg bg-white border border-neutral-200 px-4 py-3">
                            <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">
                              {briefPreview}{project.briefText.length > 160 ? "…" : ""}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* What you'll receive preview */}
                      <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                          {running ? "Being built now" : "What you'll receive"}
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                          {DOCS.map((doc) => (
                            <div
                              key={doc.label}
                              className={`rounded-lg border text-center py-2.5 px-1 transition-all ${
                                running
                                  ? "border-amber-200 bg-amber-50 animate-pulse"
                                  : "border-neutral-200 bg-neutral-50"
                              }`}
                            >
                              <p className="text-base mb-0.5">{doc.icon}</p>
                              <p className="text-xs text-neutral-500">{doc.label}</p>
                              <p className={`text-[10px] mt-0.5 ${running ? "text-amber-500" : "text-neutral-400"}`}>
                                {running ? "●" : "Soon"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="text-center py-10">
        <p className="text-4xl mb-4">📭</p>
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">No packages yet</h2>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
          Projects sent to <span className="font-medium text-neutral-700">{email}</span> will
          appear here once your freelancer delivers them.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-brand-50 border-brand-200">
          <div className="text-2xl mb-3">📩</div>
          <h3 className="font-semibold text-neutral-800 mb-2">Already submitted a brief?</h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Your project will appear here once your freelancer reviews it and begins work.
            You&apos;ll also receive a Telegram notification when it&apos;s ready.
          </p>
        </Card>
        <Card>
          <div className="text-2xl mb-3">🔗</div>
          <h3 className="font-semibold text-neutral-800 mb-2">Need to submit a brief?</h3>
          <p className="text-sm text-neutral-600 leading-relaxed mb-3">
            Ask your freelancer to share their BriefCrew link:
          </p>
          <code className="block rounded-lg bg-neutral-100 px-3 py-2 text-xs font-mono text-neutral-600 break-all">
            brief-crew.vercel.app/f/their-name
          </code>
        </Card>
      </div>
    </div>
  );
}
