import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRuntime } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [project, pkg, runData] = await Promise.all([
    fetchQuery(api.projects.getById, { id: id as Id<"projects"> }),
    fetchQuery(api.packages.getByProject, { projectId: id as Id<"projects"> }),
    fetchQuery(api.runs.getRunWithOutputs, { projectId: id as Id<"projects"> }),
  ]);

  if (!project || project.freelancerId !== userId) redirect("/dashboard");

  const outputs = runData?.outputs ?? [];
  const searches = runData?.searches ?? [];
  const run = runData?.run;

  const docsByAgent = {
    research: outputs.find((o) => o.agentName === "research"),
    writer:   outputs.find((o) => o.agentName === "writer"),
    builder:  outputs.find((o) => o.agentName === "builder"),
    proposal: outputs.find((o) => o.agentName === "proposal"),
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-600 mb-4 inline-block">
          ← Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{project.title}</h1>
            <p className="text-neutral-500 mt-1">
              {project.clientName} · {project.clientCompany} · {formatDate(project.createdAt)}
            </p>
          </div>
          <Badge
            label={project.status.replace(/_/g, " ")}
            variant={project.status === "complete" || project.status === "delivered" ? "success" : "warning"}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <h2 className="font-semibold text-neutral-800 mb-4">Package Documents</h2>
            <div className="flex flex-col gap-2">
              {[
                { label: "Market Research Report", key: "research" as const },
                { label: "Brand Copy Document",    key: "writer" as const },
                { label: "Pitch Deck Outline",     key: "writer" as const },
                { label: "Project Proposal",       key: "proposal" as const },
              ].map((doc) => {
                const output = docsByAgent[doc.key];
                return (
                  <div key={doc.label} className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{doc.label}</p>
                      {output?.wordCount && <p className="text-xs text-neutral-400">{output.wordCount} words</p>}
                    </div>
                    <Badge label={output ? "Complete" : "Pending"} variant={output ? "success" : "default"} />
                  </div>
                );
              })}
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-800">Landing Page</p>
                  {pkg?.vercelUrl && (
                    <a href={pkg.vercelUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
                      {pkg.vercelUrl}
                    </a>
                  )}
                </div>
                <Badge label={pkg?.vercelUrl ? "Live" : "Pending"} variant={pkg?.vercelUrl ? "success" : "default"} />
              </div>
            </div>
          </Card>

          {run && (
            <Card>
              <h2 className="font-semibold text-neutral-800 mb-4">Agent Run Summary</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-brand">{run.totalRuntime ? formatRuntime(run.totalRuntime) : "—"}</p>
                  <p className="text-xs text-neutral-500">Total Runtime</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand">{searches.length}</p>
                  <p className="text-xs text-neutral-500">Tavily Searches</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand">{outputs.reduce((s, o) => s + (o.wordCount ?? 0), 0).toLocaleString()}</p>
                  <p className="text-xs text-neutral-500">Words Generated</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="font-semibold text-neutral-800 mb-3">Client</h2>
            <p className="text-sm text-neutral-700">{project.clientName}</p>
            <p className="text-sm text-neutral-500">{project.clientCompany}</p>
            <p className="text-sm text-neutral-500">{project.clientEmail}</p>
            {project.clientTelegram && <p className="text-sm text-neutral-400">@{project.clientTelegram}</p>}
          </Card>

          <Card>
            <h2 className="font-semibold text-neutral-800 mb-3">Notifications</h2>
            <Badge
              label={pkg?.telegramStatus === "sent" ? "Notified" : "Not sent"}
              variant={pkg?.telegramStatus === "sent" ? "success" : "default"}
            />
          </Card>

          {project.status === "brief_submitted" && (
            <Button asChild className="w-full justify-center">
              <Link href={`/projects/${id}/run`}>Run BriefCrew</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
