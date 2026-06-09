import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRuntime, countWords } from "@/lib/utils";
import { DeliverableViewer } from "./_components/DeliverableViewer";
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

  const outputs   = runData?.outputs ?? [];
  const searches  = runData?.searches ?? [];
  const run       = runData?.run;
  const briefOnly = project.status === "brief_submitted";
  const hasRun    = outputs.length > 0 || project.status !== "brief_submitted";
  const wordCount = countWords(project.briefText ?? "");

  const research  = outputs.find((o) => o.agentName === "research")?.outputText ?? "";
  const brandCopy = outputs.find((o) => o.agentName === "writer")?.outputText ?? "";
  const proposal  = outputs.find((o) => o.agentName === "proposal")?.outputText ?? "";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-600 mb-4 inline-block">
          ← Back to Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{project.title}</h1>
            <p className="text-neutral-500 mt-1 text-sm">
              {project.clientName} · {project.clientCompany} · {formatDate(project.createdAt)}
            </p>
          </div>
          <Badge
            label={project.status.replace(/_/g, " ")}
            variant={briefOnly ? "default" : project.status === "agents_running" ? "warning" : "success"}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Client Brief — always first */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-neutral-800">Client Brief</h2>
              <span className="text-xs text-neutral-400">{wordCount} words</span>
            </div>
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{project.briefText}</p>
            </div>
            {briefOnly && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-100 px-4 py-3">
                <span className="text-lg">💡</span>
                <p className="text-sm text-neutral-700">
                  Review the brief above, then run BriefCrew to generate the full engagement package.
                </p>
              </div>
            )}
          </Card>

          {/* Deliverables viewer — shown after a run */}
          {hasRun && (research || brandCopy || proposal || pkg?.vercelUrl) && (
            <Card>
              <h2 className="font-semibold text-neutral-800 mb-1">Deliverables</h2>
              <p className="text-xs text-neutral-400 mb-4">Full content generated for this project</p>
              <DeliverableViewer
                research={research}
                brandCopy={brandCopy}
                proposal={proposal}
                vercelUrl={pkg?.vercelUrl}
              />
            </Card>
          )}

          {/* Agent run summary */}
          {run && (
            <Card>
              <h2 className="font-semibold text-neutral-800 mb-4">Agent Run Summary</h2>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-lg font-bold text-brand">{run.totalRuntime ? formatRuntime(run.totalRuntime) : "—"}</p>
                  <p className="text-xs text-neutral-500">Total Runtime</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand">{searches.length}</p>
                  <p className="text-xs text-neutral-500">Tavily Searches</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand">
                    {outputs.reduce((s, o) => s + (o.wordCount ?? 0), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500">Words Generated</p>
                </div>
              </div>
              {searches.length > 0 && (
                <details className="text-xs text-neutral-500">
                  <summary className="cursor-pointer hover:text-neutral-700 font-medium">View Tavily searches ({searches.length})</summary>
                  <div className="mt-2 flex flex-col gap-1 pl-3 border-l-2 border-neutral-200">
                    {searches.map((s, i) => (
                      <p key={i} className="font-mono">{s.query}</p>
                    ))}
                  </div>
                </details>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {briefOnly && (
            <Button asChild size="lg" className="w-full justify-center">
              <Link href={`/projects/${id}/run`}>▶ Run BriefCrew</Link>
            </Button>
          )}

          <Card>
            <h2 className="font-semibold text-neutral-800 mb-3">Client</h2>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-neutral-700">{project.clientName}</p>
              <p className="text-sm text-neutral-500">{project.clientCompany}</p>
              <a href={`mailto:${project.clientEmail}`} className="text-sm text-brand hover:underline">
                {project.clientEmail}
              </a>
              {project.clientTelegram && (
                <p className="text-sm text-neutral-400">Telegram ID: {project.clientTelegram}</p>
              )}
            </div>
          </Card>

          {pkg && (
            <Card>
              <h2 className="font-semibold text-neutral-800 mb-3">Delivery</h2>
              <div className="flex flex-col gap-2">
                {pkg.vercelUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Landing page</span>
                    <a href={pkg.vercelUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">Live ↗</a>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Client notified</span>
                  <Badge
                    label={pkg.telegramStatus === "sent" ? "Yes" : "No"}
                    variant={pkg.telegramStatus === "sent" ? "success" : "default"}
                  />
                </div>
              </div>
            </Card>
          )}

          <Card className="bg-neutral-50">
            <h2 className="font-semibold text-neutral-800 mb-3">Brief Stats</h2>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Word count</span>
                <span className="font-medium text-neutral-700">{wordCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Status</span>
                <span className={`font-medium ${wordCount >= 50 ? "text-brand" : "text-amber-600"}`}>
                  {wordCount >= 50 ? "Ready to run" : "Too short"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
