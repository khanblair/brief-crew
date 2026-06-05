import { chat } from "../deepseek";
import type { RunContext } from "./types";

export interface WriterOutput {
  brandCopy: string;
  pitchDeck: string;
}

export async function runWriterAgent(
  ctx: RunContext,
  researchReport: string
): Promise<WriterOutput> {
  const emit = ctx.emit;

  emit({ agent: "Writer Agent", status: "running", message: "Analysing audience from research output..." });

  const audienceAnalysis = await chat([
    {
      role: "system",
      content: "You are a brand strategist. Identify 3 audience segments from the research and brief. Return a brief JSON with keys: primary, secondary, tertiary (each with name and communication_need).",
    },
    {
      role: "user",
      content: `Brief: ${ctx.briefText}\n\nResearch:\n${researchReport.slice(0, 3000)}`,
    },
  ], { temperature: 0.5 });

  emit({ agent: "Writer Agent", status: "running", message: "Generating tagline options..." });

  const taglines = await chat([
    {
      role: "system",
      content: `You are a brand copywriter for East African markets.
Generate exactly 3 tagline options. Rules: no generic fintech language — no "empowering", "seamless", "unlocking", "revolutionising".
Be specific to the product and audience. Return JSON array of 3 strings.`,
    },
    {
      role: "user",
      content: `Product: ${ctx.clientCompany}\nBrief: ${ctx.briefText}\nAudience analysis: ${audienceAnalysis}`,
    },
  ], { temperature: 0.8 });

  emit({ agent: "Writer Agent", status: "complete", message: "3 tagline options generated" });

  emit({ agent: "Writer Agent", status: "running", message: "Generating hero copy..." });

  const heroCopy = await chat([
    {
      role: "system",
      content: `Brand copywriter for East African markets.
Write: hero headline (max 8 words), sub-headline (max 20 words), supporting paragraph (max 40 words).
Return JSON: { headline, subheadline, paragraph }`,
    },
    {
      role: "user",
      content: `Product: ${ctx.clientCompany}\nBrief: ${ctx.briefText}\nResearch: ${researchReport.slice(0, 1500)}`,
    },
  ], { temperature: 0.7 });

  emit({ agent: "Writer Agent", status: "complete", message: "Hero section complete" });

  emit({ agent: "Writer Agent", status: "running", message: "Generating feature descriptions..." });

  const features = await chat([
    {
      role: "system",
      content: "Write 3 feature descriptions at exactly 50 words each in plain language accessible to the primary audience. No jargon. Return JSON array of 3 objects: { title, description }",
    },
    {
      role: "user",
      content: `Product: ${ctx.clientCompany}\nBrief: ${ctx.briefText}\nResearch: ${researchReport.slice(0, 1500)}`,
    },
  ], { temperature: 0.7 });

  emit({ agent: "Writer Agent", status: "complete", message: "3 feature descriptions complete" });

  emit({ agent: "Writer Agent", status: "running", message: "Generating pitch deck outline..." });

  const pitchDeck = await chat([
    {
      role: "system",
      content: `Brand copywriter and pitch consultant.
Produce a 10-slide pitch deck outline. Each slide: title, 2-sentence speaker notes, 1 data point from the research (with source).
Format as markdown with ## Slide N: [Title] headers.`,
    },
    {
      role: "user",
      content: `Product: ${ctx.clientCompany}\nBrief: ${ctx.briefText}\nResearch: ${researchReport.slice(0, 3000)}\nAudience: ${audienceAnalysis}`,
    },
  ], { temperature: 0.6, maxTokens: 2500 });

  const pitchWordCount = pitchDeck.trim().split(/\s+/).length;
  emit({ agent: "Writer Agent", status: "complete", message: `Pitch deck outline complete — ${pitchWordCount} words / 10 slides` });

  const ctas = await chat([
    {
      role: "system",
      content: "Generate primary CTA (max 5 words) and secondary CTA (max 5 words). Return JSON: { primary, secondary }",
    },
    {
      role: "user",
      content: `Product: ${ctx.clientCompany}\nBrief: ${ctx.briefText}`,
    },
  ], { temperature: 0.7 });

  const bio = await chat([
    {
      role: "system",
      content: "Write a 150-word company bio suitable for investor materials. No generic language. Ground it in the specific product and market.",
    },
    {
      role: "user",
      content: `Product: ${ctx.clientCompany}\nBrief: ${ctx.briefText}\nResearch: ${researchReport.slice(0, 1000)}`,
    },
  ], { temperature: 0.6 });

  const brandCopy = `# Brand Copy — ${ctx.clientCompany}

## Taglines
${taglines}

## Hero Copy
${heroCopy}

## Feature Descriptions
${features}

## Calls to Action
${ctas}

## Company Bio
${bio}
`;

  const totalWords = brandCopy.split(/\s+/).length;
  emit({ agent: "Writer Agent", status: "complete", message: `Brand copy document complete — ${totalWords} words` });

  return { brandCopy, pitchDeck };
}
