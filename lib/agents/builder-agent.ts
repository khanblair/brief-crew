import { chat } from "../deepseek";
import { deployToVercel } from "../vercel-deploy";
import type { RunContext } from "./types";

export interface BuilderOutput {
  html: string;
  url?: string;
}

export async function runBuilderAgent(
  ctx: RunContext,
  brandCopy: string
): Promise<BuilderOutput> {
  const emit = ctx.emit;

  emit({ agent: "Builder Agent", status: "running", message: "Mapping copy to page sections..." });

  const contentMap = await chat([
    {
      role: "system",
      content: "Extract structured content for a landing page. Return JSON with: hero{headline,subheadline,paragraph,cta_primary,cta_secondary}, features[{title,description}], about{bio}, company{name}",
    },
    { role: "user", content: brandCopy },
  ], { temperature: 0.2 });

  emit({ agent: "Builder Agent", status: "complete", message: "Content map complete" });
  emit({ agent: "Builder Agent", status: "running", message: "Generating landing page HTML..." });

  let contentData: Record<string, unknown> = { company: { name: ctx.clientCompany } };
  try {
    const match = contentMap.match(/\{[\s\S]*\}/);
    contentData = JSON.parse(match?.[0] ?? "{}");
  } catch {
    contentData = { company: { name: ctx.clientCompany } };
  }

  const html = await chat([
    {
      role: "system",
      content: `You are a frontend developer. Generate a complete, self-contained single HTML file for a mobile-first landing page.

RULES (non-negotiable):
- All CSS in a <style> tag, all JS in a <script> tag — zero external dependencies, zero CDN calls
- Mobile-first layout optimised for Android on 3G (375px viewport)
- System font stack only (no Google Fonts)
- WCAG AA colour contrast on all text
- Touch targets minimum 44px height
- Above-the-fold CTA visible on 375px without scrolling
- Colour palette appropriate to agricultural/fintech context (earthy greens, warm ambers, clean whites)
- Open Graph meta tags, viewport meta tag
- Semantic HTML5

Return ONLY the complete HTML file, nothing else.`,
    },
    {
      role: "user",
      content: `Company: ${ctx.clientCompany}
Brief: ${ctx.briefText}
Content: ${JSON.stringify(contentData, null, 2)}

Generate the complete landing page HTML now.`,
    },
  ], { temperature: 0.4, maxTokens: 4096 });

  const lineCount = html.split("\n").length;
  emit({ agent: "Builder Agent", status: "complete", message: `HTML generated — ${lineCount} lines` });

  emit({ agent: "Builder Agent", status: "running", message: "Validating HTML structure..." });

  const hasViewport = html.includes('name="viewport"');
  const hasOgTitle = html.includes('og:title') || html.includes('og:description');
  const validationPassed = hasViewport && html.includes('<!DOCTYPE') && html.includes('</html>');

  if (validationPassed) {
    emit({ agent: "Builder Agent", status: "complete", message: "Validation passed — no errors" });
  } else {
    emit({ agent: "Builder Agent", status: "running", message: "Validation warnings — proceeding" });
  }

  emit({ agent: "Builder Agent", status: "running", message: "Deploying to Vercel..." });

  try {
    const { url } = await deployToVercel(html, ctx.clientCompany);
    emit({ agent: "Builder Agent", status: "complete", message: `Live URL: ${url}` });
    return { html, url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ agent: "Builder Agent", status: "error", message: `Deployment failed — ${msg}. HTML saved as fallback.` });
    return { html };
  }
}
