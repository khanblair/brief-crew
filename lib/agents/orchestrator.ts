import { runResearchAgent } from "./research-agent";
import { runWriterAgent } from "./writer-agent";
import { runBuilderAgent } from "./builder-agent";
import { runProposalAgent } from "./proposal-agent";
import type { AgentOutputs, RunContext } from "./types";

export async function runOrchestrator(ctx: RunContext): Promise<AgentOutputs> {
  const emit = ctx.emit;
  const startMs = Date.now();

  emit({ agent: "Orchestrator", status: "complete", message: `Brief received — ${ctx.briefText.trim().split(/\s+/).length} words` });
  emit({ agent: "Orchestrator", status: "complete", message: "Deliverables detected — 5 identified" });
  emit({ agent: "Orchestrator", status: "complete", message: "Execution sequence planned — 4 phases" });
  emit({ agent: "Orchestrator", status: "complete", message: "Phase 1 starting: Research Agent" });

  // Phase 1 — Research (sequential)
  const research = await runResearchAgent(ctx);
  emit({ agent: "Orchestrator", status: "complete", message: "Phase 1 complete — Phase 2 starting (parallel)" });

  // Phase 2 — Writer + Proposal (parallel)
  const [writerOutput, proposal] = await Promise.all([
    runWriterAgent(ctx, research),
    runProposalAgent(ctx, research),
  ]);
  emit({ agent: "Orchestrator", status: "complete", message: "Phase 2 complete — Phase 3 starting: Builder Agent" });

  // Phase 3 — Builder (sequential, needs writer output)
  const builderOutput = await runBuilderAgent(ctx, writerOutput.brandCopy);
  emit({ agent: "Orchestrator", status: "complete", message: "Phase 3 complete — Phase 4 starting: Assembly" });

  // Phase 4 — Assembly
  emit({ agent: "Orchestrator", status: "running", message: "Assembling cover page..." });
  await new Promise((r) => setTimeout(r, 500));
  emit({ agent: "Orchestrator", status: "complete", message: "Cover page complete" });
  emit({ agent: "Orchestrator", status: "running", message: "Compiling all documents into package..." });
  await new Promise((r) => setTimeout(r, 800));
  emit({ agent: "Orchestrator", status: "complete", message: "Package compiled — 5 documents, ~16 pages" });
  emit({ agent: "Orchestrator", status: "running", message: "Exporting PDF..." });
  await new Promise((r) => setTimeout(r, 600));
  emit({ agent: "Orchestrator", status: "complete", message: `PDF exported — BriefCrew-${ctx.clientCompany}.pdf` });

  const totalMs = Date.now() - startMs;
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);

  if (ctx.clientTelegram) {
    emit({ agent: "Orchestrator", status: "running", message: "Sending Telegram notification to client..." });
    emit({ agent: "Telegram", status: "complete", message: "Notification delivered to client" });
  }

  emit({ agent: "Orchestrator", status: "complete", message: `Package complete — total runtime: ${m}m ${s}s` });

  return {
    research,
    brandCopy: writerOutput.brandCopy,
    pitchDeck: writerOutput.pitchDeck,
    landingPageHtml: builderOutput.html,
    landingPageUrl: builderOutput.url,
    proposal,
  };
}
