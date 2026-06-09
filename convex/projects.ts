import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByFreelancer = query({
  args: { freelancerId: v.string() },
  handler: async (ctx, { freelancerId }) => {
    return ctx.db
      .query("projects")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", freelancerId))
      .order("desc")
      .collect();
  },
});

export const listByClient = query({
  args: { clientEmail: v.string() },
  handler: async (ctx, { clientEmail }) => {
    return ctx.db
      .query("projects")
      .withIndex("by_client_email", (q) => q.eq("clientEmail", clientEmail))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    title: v.string(),
    freelancerId: v.string(),
    clientName: v.string(),
    clientCompany: v.string(),
    clientEmail: v.string(),
    clientTelegram: v.optional(v.string()),
    briefText: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("projects", {
      ...args,
      status: "brief_submitted",
      createdAt: Date.now(),
    });
  },
});

export const createFromPublicForm = mutation({
  args: {
    freelancerId: v.string(),
    clientName: v.string(),
    clientCompany: v.string(),
    clientEmail: v.string(),
    clientTelegram: v.optional(v.string()),
    briefText: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("projects", {
      title: `Brief from ${args.clientName}`,
      freelancerId: args.freelancerId,
      clientName: args.clientName,
      clientCompany: args.clientCompany,
      clientEmail: args.clientEmail,
      clientTelegram: args.clientTelegram,
      briefText: args.briefText,
      status: "brief_submitted",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("projects"),
    status: v.union(
      v.literal("brief_submitted"),
      v.literal("agents_running"),
      v.literal("package_ready"),
      v.literal("delivered"),
      v.literal("complete")
    ),
  },
  handler: async (ctx, { id, status }) => {
    const updates: Record<string, unknown> = { status };
    if (status === "package_ready" || status === "delivered") {
      updates.completedAt = Date.now();
    }
    await ctx.db.patch(id, updates);
  },
});

export const linkClient = mutation({
  args: { id: v.id("projects"), clientId: v.string() },
  handler: async (ctx, { id, clientId }) => {
    await ctx.db.patch(id, { clientId });
  },
});

export const getFreelancerStats = query({
  args: { freelancerId: v.string() },
  handler: async (ctx, { freelancerId }) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", freelancerId))
      .collect();

    const delivered = projects.filter((p) =>
      ["package_ready", "delivered", "complete"].includes(p.status)
    ).length;

    return {
      totalProjects: projects.length,
      totalDelivered: delivered,
    };
  },
});
