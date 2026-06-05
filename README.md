# BriefCrew — The Agentic Freelancer System

> Take a client brief. Run the crew. Deliver an agency-grade engagement package.

BriefCrew is a full-stack agentic system that enables a freelancer to take a client brief and autonomously deliver a complete engagement package — market research, brand copy, a live landing page, a pitch deck outline, and a priced proposal — using a crew of five specialised AI agents with minimal manual effort.

**Built for the Kolaborate ETDI Capstone Hackathon · June 9–11, 2026**

---

## What it does

A freelancer pastes a client brief and clicks **Run BriefCrew**. The Orchestrator Agent reads the brief, maps deliverable dependencies, and sequences four specialist agents:

1. **Research Agent** — runs live Tavily web searches, extracts East African market data, and produces a grounded 700–900 word report with cited sources
2. **Writer Agent** — produces brand copy (taglines, hero, features, CTAs, bio) and a 10-slide pitch deck outline from the research
3. **Builder Agent** — generates a complete self-contained HTML landing page and deploys it live to Vercel
4. **Proposal Agent** — searches live East African market rates, decomposes project scope, and writes a priced proposal with a budget table

The assembled package (5 documents + PDF) is stored in Convex. The client receives a **Telegram notification** and logs into their own delivery portal to view and download their documents.

The client never sees the agent machinery. They see a clean, professional delivery experience.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Database | Convex |
| AI | DeepSeek (`deepseek-chat` via OpenAI-compatible API) |
| Search | Tavily Search API |
| Notifications | Telegram Bot API |
| Deployment | Vercel (landing pages via Deploy API) |
| Styling | Tailwind CSS v4 |
| Runtime | Bun |

---

## Project structure

```
app/
  (auth)/               → Sign in / Sign up (Clerk)
  (onboarding)/         → Role selection + profile setup (one-time)
  (freelancer)/         → Dashboard, projects, clients, agent log
  (client)/             → My Projects, Package View, Revision Request
  settings/             → Unified role-aware settings page
  api/run-crew/         → SSE streaming endpoint for agent execution
  api/analyze-brief/    → Brief analysis preview (pre-run detection)

lib/
  agents/
    orchestrator.ts     → Phases 1–4 sequencing and parallel execution
    research-agent.ts   → Tavily search + synthesis + report writing
    writer-agent.ts     → Brand copy + pitch deck generation
    builder-agent.ts    → HTML generation + Vercel deployment
    proposal-agent.ts   → Rate research + scope decomposition + proposal
  deepseek.ts           → DeepSeek client (OpenAI-compatible)
  tavily.ts             → Tavily Search + Extract API wrappers
  telegram.ts           → Telegram Bot API notification sender
  vercel-deploy.ts      → Vercel Deploy API wrapper
  rate-card.ts          → Static East African market rate fallback

convex/
  schema.ts             → 6 tables: users, projects, agentRuns, agentOutputs,
                          tavilySearchLog, packages, revisionRequests
  users.ts              → User queries and mutations (role, onboarding, profile)
  projects.ts           → Project CRUD, status updates, client management
  runs.ts               → Agent run records, outputs, Tavily search log
  packages.ts           → Package assembly, PDF status, revision requests

components/
  AgentLog.tsx          → Real-time streaming log panel (SSE consumer)
  ui/                   → Button, Card, Badge, Input, Textarea, Sidebar
```

---

## Data model

| Table | Purpose |
|---|---|
| `users` | Clerk user ID, role (freelancer/client), profile, onboarding status |
| `projects` | Brief text, client details, status lifecycle, timestamps |
| `agentRuns` | Per-run metadata: phase timestamps, total runtime, status |
| `agentOutputs` | Per-agent output text, word count, quality check result |
| `tavilySearchLog` | Every search query, results count, URLs fetched, data points |
| `packages` | Assembled package, Vercel URL, PDF status, Telegram delivery status |
| `revisionRequests` | Client revision messages, acknowledgement status |

---

## Setup

### Prerequisites

- [Bun](https://bun.sh) — package manager and runtime
- [Clerk](https://clerk.com) — create a project, get publishable + secret keys
- [Convex](https://convex.dev) — create a project, run `bunx convex dev`
- [DeepSeek](https://platform.deepseek.com) — get an API key
- [Tavily](https://tavily.com) — get an API key
- [Telegram](https://core.telegram.org/bots) — create a bot via BotFather, get the token

### Installation

```bash
git clone <repo-url>
cd brief-crew
bun install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment

# DeepSeek
DEEPSEEK_API_KEY=sk-...

# Tavily
TAVILY_API_KEY=tvly-...

# Telegram
TELEGRAM_BOT_TOKEN=123456789:AAF...

# Vercel (Builder Agent landing page deployment)
VERCEL_TOKEN=vcp_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run locally

```bash
# Terminal 1 — Convex dev server (schema sync + function hot reload)
bunx convex dev

# Terminal 2 — Next.js dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Core workflow

```
1. Freelancer signs up → selects Freelancer role → completes profile
2. Creates a new project: client details + brief text
3. Brief analysis preview detects deliverables (DeepSeek, debounced)
4. Clicks "Run BriefCrew" → routed to Agent Activity Log
5. SSE stream opens → /api/run-crew begins orchestration
   Phase 1: Research Agent (sequential)
   Phase 2: Writer Agent + Proposal Agent (parallel)
   Phase 3: Builder Agent (sequential)
   Phase 4: Assembly + PDF + Telegram notification
6. Completion transition → Project Detail View
7. Client receives Telegram link → logs in → views Package
8. Client can submit revision request → Telegram alert to freelancer
```

---

## Route map

| Route | Role | Description |
|---|---|---|
| `/` | Public | Landing page (redirects authenticated users) |
| `/sign-in`, `/sign-up` | Public | Clerk auth |
| `/onboarding` | New users | Role selection + profile setup |
| `/dashboard` | Freelancer | Projects overview + stats |
| `/projects/new` | Freelancer | 2-step: client details + brief |
| `/projects/[id]` | Freelancer | Project detail + run summary |
| `/projects/[id]/run` | Freelancer | Live agent activity log (SSE) |
| `/clients` | Freelancer | Client list with project history |
| `/settings` | Both | Role-aware profile settings |
| `/my-projects` | Client | Delivered packages overview |
| `/packages/[id]` | Client | Package view + revision request |

---

## Declared base code

**From KolaAgent (Agent Economy Hackathon, May 2026):**
- Clerk authentication and middleware configuration
- Convex schema patterns and JWT bridge
- Tavily search integration and Africa rate bias correction logic
- AI API tool-calling loop architecture
- AgentLog UI component (adapted for five-agent parallel display)
- Telegram Bot API notification wrapper
- Next.js project structure and Tailwind configuration

**From KolaMatch Intelligence (Build Challenge, April 2026):**
- Tavily grounding pattern for market rate research
- Africa-specific static rate card data
- PDF export cover page structure

**New in BriefCrew:**
- Dual-role authentication with onboarding role selection
- Freelancer dashboard with project and client management
- Client dashboard with package view and revision request
- Five-agent orchestration system with dependency sequencing
- Parallel execution management in the Orchestrator
- Writer Agent (brand copy and pitch deck generation)
- Builder Agent (HTML generation and Vercel deployment)
- Brief analysis preview (pre-run deliverable detection)
- Agent Activity Log as SSE stream
- Revision request system (client to freelancer)
- Telegram notification with client dashboard link

---

## Out of scope (this version)

- WhatsApp notifications → deferred to Phase 2 (Telegram only)
- Real-time collaboration → single freelancer per project
- Editable agent outputs → outputs are final as generated
- Image generation → CSS-only landing page design
- Multi-language output → English only
- Batch brief processing → one brief per run

---

*BriefCrew · Built on Next.js · Clerk · Convex · DeepSeek · Tavily · Vercel · Telegram*
*Kolaborate ETDI Capstone · June 9–11, 2026*
