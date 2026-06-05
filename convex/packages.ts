import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    vercelUrl: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("packages", {
      ...args,
      documentIds: [],
      pdfStatus: "pending",
      telegramStatus: "pending",
      assembledAt: Date.now(),
    });
  },
});

export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return ctx.db
      .query("packages")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
  },
});

export const updateTelegramStatus = mutation({
  args: {
    packageId: v.id("packages"),
    status: v.union(v.literal("sent"), v.literal("skipped"), v.literal("failed")),
  },
  handler: async (ctx, { packageId, status }) => {
    await ctx.db.patch(packageId, {
      telegramStatus: status,
      telegramSentAt: Date.now(),
    });
  },
});

export const updatePdfStatus = mutation({
  args: {
    packageId: v.id("packages"),
    status: v.union(v.literal("complete"), v.literal("failed")),
  },
  handler: async (ctx, { packageId, status }) => {
    await ctx.db.patch(packageId, { pdfStatus: status });
  },
});

export const createRevision = mutation({
  args: {
    projectId: v.id("projects"),
    clientId: v.string(),
    documentType: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("revisionRequests", {
      ...args,
      acknowledged: false,
      createdAt: Date.now(),
    });
  },
});

export const getRevisions = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return ctx.db
      .query("revisionRequests")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});
