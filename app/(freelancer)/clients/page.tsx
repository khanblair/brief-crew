import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export default async function ClientsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await fetchQuery(api.projects.listByFreelancer, { freelancerId: userId });

  const clientMap = new Map<string, { name: string; company: string; email: string; projects: typeof projects }>();
  for (const p of projects) {
    const existing = clientMap.get(p.clientEmail);
    if (existing) existing.projects.push(p);
    else clientMap.set(p.clientEmail, { name: p.clientName, company: p.clientCompany, email: p.clientEmail, projects: [p] });
  }

  const clients = Array.from(clientMap.values()).sort((a, b) => b.projects[0].createdAt - a.projects[0].createdAt);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-8">Clients</h1>

      {clients.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-neutral-500">No clients yet. Create a project to get started.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {clients.map((client) => (
            <Card key={client.email}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900">{client.name}</h3>
                  <p className="text-sm text-neutral-500">{client.company}</p>
                  <p className="text-xs text-neutral-400 mt-1">{client.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-brand">{client.projects.length} project{client.projects.length !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-neutral-400 mt-1">Last: {formatDate(client.projects[0].createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
