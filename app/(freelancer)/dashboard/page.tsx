import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "info" | "warning" | "success" | "error" }> = {
  brief_submitted: { label: "Awaiting Run",  variant: "default" },
  agents_running:  { label: "Running",       variant: "warning" },
  package_ready:   { label: "Package Ready", variant: "success" },
  delivered:       { label: "Delivered",     variant: "success" },
  complete:        { label: "Complete",      variant: "info" },
};

type Project = Awaited<ReturnType<typeof fetchQuery<typeof api.projects.listByFreelancer>>>[number];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await fetchQuery(api.users.getByClerkId, { clerkId: userId });
  if (!user?.onboardingComplete) redirect("/onboarding");
  if (user.role !== "freelancer") redirect("/my-projects");

  const [projects, stats] = await Promise.all([
    fetchQuery(api.projects.listByFreelancer, { freelancerId: userId }),
    fetchQuery(api.projects.getFreelancerStats, { freelancerId: userId }),
  ]);

  // Section grouping
  const needsAction  = projects.filter((p) => p.status === "brief_submitted");
  const inProgress   = projects.filter((p) => p.status === "agents_running");
  const packageReady = projects.filter((p) => p.status === "package_ready" || p.status === "delivered");
  const completed    = projects.filter((p) => p.status === "complete");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
          <p className="text-sm text-neutral-500 mt-1">Welcome back, {user.displayName}</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">New Project</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-10 sm:grid-cols-4">
        {[
          { label: "Total Projects",  value: stats.totalProjects },
          { label: "Delivered",       value: stats.totalDelivered },
          { label: "Active",          value: stats.totalProjects - stats.totalDelivered },
          { label: "Completion Rate", value: stats.totalProjects > 0 ? `${Math.round((stats.totalDelivered / stats.totalProjects) * 100)}%` : "—" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className="text-2xl font-bold text-brand">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-neutral-500 mb-4">No projects yet</p>
          <Button asChild><Link href="/projects/new">Create your first project</Link></Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          <Section
            title="Needs Your Attention"
            emoji="🔔"
            projects={needsAction}
            ctaLabel="Run BriefCrew"
            ctaHref={(p) => `/projects/${p._id}`}
            accent
          />
          <Section
            title="In Progress"
            emoji="⚡"
            projects={inProgress}
            ctaLabel="View Log"
            ctaHref={(p) => `/projects/${p._id}/run`}
          />
          <Section
            title="Package Ready"
            emoji="📦"
            projects={packageReady}
            ctaLabel="View Project"
            ctaHref={(p) => `/projects/${p._id}`}
          />
          <Section
            title="Completed"
            emoji="✅"
            projects={completed}
            ctaLabel="View"
            ctaHref={(p) => `/projects/${p._id}`}
            muted
          />
        </div>
      )}
    </div>
  );
}

function Section({
  title, emoji, projects, ctaLabel, ctaHref, accent, muted,
}: {
  title: string;
  emoji: string;
  projects: Project[];
  ctaLabel: string;
  ctaHref: (p: Project) => string;
  accent?: boolean;
  muted?: boolean;
}) {
  if (projects.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span>{emoji}</span>
        <h2 className="font-semibold text-neutral-700">{title}</h2>
        <span className="rounded-full bg-neutral-100 text-neutral-500 text-xs px-2 py-0.5">{projects.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {projects.map((project) => {
          const badge    = STATUS_BADGE[project.status] ?? { label: project.status, variant: "default" as const };
          const preview  = project.briefText?.slice(0, 120).trim();

          return (
            <Link key={project._id} href={ctaHref(project)}>
              <Card className={`hover:shadow-sm transition-all ${accent ? "border-amber-200 bg-amber-50/30" : muted ? "opacity-75 hover:opacity-100" : "hover:border-neutral-300"}`}>
                <div className="flex items-start justify-between gap-4 mb-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-semibold text-neutral-900">{project.title}</h3>
                    <Badge label={badge.label} variant={badge.variant} />
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">{formatDate(project.createdAt)}</span>
                </div>

                <p className="text-sm text-neutral-500 mb-2">
                  {project.clientName} · {project.clientCompany} · {project.clientEmail}
                </p>

                {preview && (
                  <p className="text-sm text-neutral-600 line-clamp-1 border-l-2 border-brand/30 pl-3">
                    {preview}{project.briefText.length > 120 ? "…" : ""}
                  </p>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
