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

  const teamId = process.env.VERCEL_TEAM_ID;
  const url = teamId
    ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
    : "https://api.vercel.com/v13/deployments";

  const body = {
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

  const res = await fetch(url, {
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
  const deployUrl = `https://${data.url}`;

  // Disable SSO/authentication protection so landing pages are publicly accessible
  if (data.projectId) {
    try {
      await fetch(
        `https://api.vercel.com/v9/projects/${data.projectId}${teamId ? `?teamId=${teamId}` : ""}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ssoProtection: null }),
        }
      );
    } catch {
      // Non-fatal — page may require auth but deployment succeeded
    }
  }

  return {
    deploymentId: data.id,
    url: deployUrl,
  };
}
