import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("freelancer"), v.literal("client")),
    professionalTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
    onboardingComplete: v.boolean(),
    username: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  projects: defineTable({
    title: v.string(),
    freelancerId: v.string(),
    clientId: v.optional(v.string()),
    clientName: v.string(),
    clientCompany: v.string(),
    clientEmail: v.string(),
    clientTelegram: v.optional(v.string()),
    briefText: v.string(),
    status: v.union(
      v.literal("brief_submitted"),
      v.literal("agents_running"),
      v.literal("package_ready"),
      v.literal("delivered"),
      v.literal("complete")
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_freelancer", ["freelancerId"])
    .index("by_client", ["clientId"])
    .index("by_client_email", ["clientEmail"]),

  agentRuns: defineTable({
    projectId: v.id("projects"),
    totalRuntime: v.optional(v.number()),
    phase1CompletedAt: v.optional(v.number()),
    phase2CompletedAt: v.optional(v.number()),
    phase3CompletedAt: v.optional(v.number()),
    phase4CompletedAt: v.optional(v.number()),
    status: v.union(v.literal("running"), v.literal("complete"), v.literal("failed")),
    startedAt: v.number(),
  }).index("by_project", ["projectId"]),

  agentOutputs: defineTable({
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
    completedAt: v.optional(v.number()),
    wordCount: v.optional(v.number()),
    outputText: v.optional(v.string()),
    qualityCheck: v.optional(v.union(v.literal("pass"), v.literal("fail"), v.literal("retried"))),
  })
    .index("by_run", ["runId"])
    .index("by_project", ["projectId"]),

  tavilySearchLog: defineTable({
    runId: v.id("agentRuns"),
    agentName: v.string(),
    query: v.string(),
    resultsCount: v.number(),
    urlsFetched: v.array(v.string()),
    dataPoints: v.array(v.string()),
    executedAt: v.number(),
  }).index("by_run", ["runId"]),

  packages: defineTable({
    projectId: v.id("projects"),
    documentIds: v.array(v.string()),
    vercelUrl: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    pdfStatus: v.union(v.literal("pending"), v.literal("complete"), v.literal("failed")),
    telegramStatus: v.union(v.literal("pending"), v.literal("sent"), v.literal("skipped"), v.literal("failed")),
    telegramSentAt: v.optional(v.number()),
    assembledAt: v.number(),
  }).index("by_project", ["projectId"]),

  revisionRequests: defineTable({
    projectId: v.id("projects"),
    clientId: v.string(),
    documentType: v.string(),
    message: v.string(),
    acknowledged: v.boolean(),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),
});
