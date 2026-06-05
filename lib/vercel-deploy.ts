export interface DeployResult {
  url: string;
  deploymentId: string;
}

export async function deployToVercel(
  html: string,
  projectName: string
): Promise<DeployResult> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN not set");

  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  const body: Record<string, unknown> = {
    name: slug,
    files: [
      {
        file: "index.html",
        data: Buffer.from(html).toString("base64"),
        encoding: "base64",
      },
    ],
    projectSettings: { framework: null },
    target: "production",
  };

  if (process.env.VERCEL_TEAM_ID) {
    body.teamId = process.env.VERCEL_TEAM_ID;
  }

  const res = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel deploy failed: ${err}`);
  }

  const data = await res.json();
  return {
    deploymentId: data.id,
    url: `https://${data.url}`,
  };
}
