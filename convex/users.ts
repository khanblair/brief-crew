import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export const listFreelancers = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    return all.filter(
      (u) => u.role === "freelancer" && u.onboardingComplete && u.username
    );
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
  },
});

export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("freelancer"), v.literal("client")),
    professionalTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
    onboardingComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert("users", args);
  },
});

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    displayName: v.optional(v.string()),
    professionalTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, ...updates }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, updates);
  },
});

export const setUsername = mutation({
  args: { clerkId: v.string(), username: v.string() },
  handler: async (ctx, { clerkId, username }) => {
    const slug = toSlug(username);
    if (!slug) throw new Error("Invalid username");

    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", slug))
      .unique();
    if (taken && taken.clerkId !== clerkId) throw new Error("Username already taken");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { username: slug });
    return slug;
  },
});

export const completeOnboarding = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    role: v.union(v.literal("freelancer"), v.literal("client")),
    displayName: v.string(),
    professionalTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, ...profile }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    // Auto-generate a unique username slug for freelancers
    let username: string | undefined;
    if (profile.role === "freelancer") {
      const base = toSlug(profile.displayName);
      let candidate = base;
      let suffix = 1;
      while (true) {
        const conflict = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", candidate))
          .unique();
        if (!conflict || conflict.clerkId === clerkId) { username = candidate; break; }
        candidate = `${base}-${suffix++}`;
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...profile,
        onboardingComplete: true,
        ...(username ? { username } : {}),
      });
    } else {
      await ctx.db.insert("users", {
        clerkId,
        email,
        ...profile,
        onboardingComplete: true,
        ...(username ? { username } : {}),
      });
    }

    // Back-fill clientId on any projects that match this email
    if (profile.role === "client") {
      const unlinked = await ctx.db
        .query("projects")
        .withIndex("by_client_email", (q) => q.eq("clientEmail", email))
        .collect();

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .unique();

      if (user) {
        for (const p of unlinked) {
          if (!p.clientId) await ctx.db.patch(p._id, { clientId: user.clerkId });
        }
      }
    }
  },
});
