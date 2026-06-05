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
  brief_submitted: { label: "Brief Submitted", variant: "default" },
  agents_running:  { label: "Running",          variant: "warning" },
  package_ready:   { label: "Package Ready",    variant: "success" },
  delivered:       { label: "Delivered",        variant: "success" },
  complete:        { label: "Complete",         variant: "info" },
};

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

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        {[
          { label: "Total Projects", value: stats.totalProjects },
          { label: "Delivered",      value: stats.totalDelivered },
          { label: "Active",         value: stats.totalProjects - stats.totalDelivered },
          { label: "Completion Rate", value: stats.totalProjects > 0 ? `${Math.round((stats.totalDelivered / stats.totalProjects) * 100)}%` : "—" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className="text-2xl font-bold text-brand">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-neutral-500 mb-4">No projects yet</p>
          <Button asChild>
            <Link href="/projects/new">Create your first project</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => {
            const badge = STATUS_BADGE[project.status] ?? { label: project.status, variant: "default" as const };
            return (
              <Link key={project._id} href={`/projects/${project._id}`}>
                <Card className="hover:border-neutral-300 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-neutral-900">{project.title}</h3>
                        <Badge label={badge.label} variant={badge.variant} />
                      </div>
                      <p className="text-sm text-neutral-500">{project.clientName} · {project.clientCompany}</p>
                    </div>
                    <span className="text-xs text-neutral-400">{formatDate(project.createdAt)}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
