import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRun = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return ctx.db.insert("agentRuns", {
      projectId,
      status: "running",
      startedAt: Date.now(),
    });
  },
});

export const completeRun = mutation({
  args: {
    runId: v.id("agentRuns"),
    totalRuntime: v.number(),
    status: v.union(v.literal("complete"), v.literal("failed")),
  },
  handler: async (ctx, { runId, totalRuntime, status }) => {
    await ctx.db.patch(runId, { totalRuntime, status });
  },
});

export const recordPhase = mutation({
  args: {
    runId: v.id("agentRuns"),
    phase: v.number(),
  },
  handler: async (ctx, { runId, phase }) => {
    const key = `phase${phase}CompletedAt` as
      | "phase1CompletedAt"
      | "phase2CompletedAt"
      | "phase3CompletedAt"
      | "phase4CompletedAt";
    await ctx.db.patch(runId, { [key]: Date.now() });
  },
});

export const saveOutput = mutation({
  args: {
    runId: v.id("agentRuns"),
    projectId: v.id("projects"),
    agentName: v.union(
      v.literal("research"),
      v.literal("writer"),
      v.literal("pitchDeck"),
      v.literal("builder"),
      v.literal("proposal")
    ),
    startedAt: v.number(),
    completedAt: v.number(),
    wordCount: v.number(),
    outputText: v.string(),
    qualityCheck: v.union(v.literal("pass"), v.literal("fail"), v.literal("retried")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("agentOutputs", args);
  },
});

export const logSearch = mutation({
  args: {
    runId: v.id("agentRuns"),
    agentName: v.string(),
    query: v.string(),
    resultsCount: v.number(),
    urlsFetched: v.array(v.string()),
    dataPoints: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("tavilySearchLog", {
      ...args,
      executedAt: Date.now(),
    });
  },
});

export const getRunWithOutputs = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const run = await ctx.db
      .query("agentRuns")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first();
    if (!run) return null;

    const outputs = await ctx.db
      .query("agentOutputs")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect();

    const searches = await ctx.db
      .query("tavilySearchLog")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect();

    return { run, outputs, searches };
  },
});
