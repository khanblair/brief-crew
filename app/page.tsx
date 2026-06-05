import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Nav />
      <Hero />
      <HowItWorks />
      <AgentCrew />
      <TwoRoles />
      <OutputPackage />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand">BriefCrew</span>
          <span className="hidden rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand sm:inline">
            Agentic Freelancer System
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-up" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:inline">
            Find a freelancer
          </Link>
          <Link href="/sign-in" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors shadow-sm"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-32 text-center">
      {/* Subtle green tint glow */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-10">
        <div className="h-[500px] w-[700px] rounded-full bg-brand-50 blur-[100px] opacity-60" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm text-brand">
          <span className="size-1.5 rounded-full bg-brand animate-pulse" />
          Kolaborate ETDI Capstone Hackathon · June 2026
        </div>

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
          One brief.
          <br />
          <span className="text-brand">Five agents.</span>
          <br />
          Full agency output.
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-neutral-500">
          BriefCrew takes a client brief and autonomously delivers a complete, agency-grade
          engagement package — market research, brand copy, landing page, pitch deck, and a priced
          proposal — with minimal manual effort.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-hover transition-colors shadow-md shadow-brand/20"
          >
            Start your first project
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-neutral-300 px-8 py-3.5 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="text-sm text-neutral-400 mt-2">
          Looking for a freelancer?{" "}
          <Link href="/sign-up" className="text-brand hover:underline font-medium">
            Sign up to browse the directory →
          </Link>
        </p>

        {/* Terminal preview — intentionally dark */}
        <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-neutral-200 shadow-xl shadow-neutral-200/60">
          <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-4 py-3">
            <span className="size-3 rounded-full bg-red-500/70" />
            <span className="size-3 rounded-full bg-amber-500/70" />
            <span className="size-3 rounded-full bg-brand/70" />
            <span className="ml-2 text-xs text-neutral-500">Agent Activity Log</span>
          </div>
          <div className="bg-neutral-950 p-5 font-mono text-xs leading-6 text-left">
            <LogLine icon="✅" color="text-neutral-200" agent="Orchestrator"    msg="Brief received — 247 words" />
            <LogLine icon="✅" color="text-neutral-200" agent="Orchestrator"    msg="Deliverables detected — 5 identified" />
            <LogLine icon="✅" color="text-neutral-200" agent="Orchestrator"    msg="Phase 1 starting: Research Agent" />
            <LogLine icon="⚡" color="text-blue-400"    agent="Research Agent"  msg='Tavily search: "agri-fintech adoption Uganda Kenya 2025 GSMA"' />
            <LogLine icon="✅" color="text-blue-400"    agent="Research Agent"  msg="5 results returned — 4 data points extracted" />
            <LogLine icon="⚡" color="text-amber-400"   agent="Writer Agent"    msg="Generating tagline options..." />
            <LogLine icon="⚡" color="text-purple-400"  agent="Proposal Agent"  msg='Tavily search: "React Native developer rate Uganda Kenya 2025"' />
            <LogLine icon="✅" color="text-amber-400"   agent="Writer Agent"    msg="Hero section complete" />
            <LogLine icon="✅" color="text-purple-400"  agent="Proposal Agent"  msg="Budget calculated — range: $28,400–$44,200" />
            <LogLine icon="⚡" color="text-emerald-400" agent="Builder Agent"   msg="Deploying to Vercel..." />
            <LogLine icon="✅" color="text-emerald-400" agent="Builder Agent"   msg="Live URL: mkulimawallet.vercel.app" />
            <LogLine icon="✅" color="text-neutral-200" agent="Orchestrator"    msg="Package complete — total runtime: 3m 42s" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LogLine({ icon, color, agent, msg }: { icon: string; color: string; agent: string; msg: string }) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="shrink-0 w-4">{icon}</span>
      <span className={`shrink-0 w-36 font-semibold ${color}`}>{agent}</span>
      <span className="text-neutral-400">{msg}</span>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { number: "01", title: "Paste the brief", description: "Receive a client brief via WhatsApp, email, or any format. Paste it into BriefCrew exactly as received — no formatting required." },
    { number: "02", title: "Run the crew",    description: "Click Run. The Orchestrator reads the brief, maps deliverable dependencies, and sequences five specialist agents across four execution phases." },
    { number: "03", title: "Watch it work",   description: "A live agent activity log streams in real time — every Tavily search, every decision, every output. Full visibility into the orchestration." },
    { number: "04", title: "Deliver the package", description: "The client receives a Telegram notification and logs into their portal to view and download a complete, professional engagement package." },
  ];

  return (
    <section className="px-6 py-24 bg-neutral-50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">How it works</h2>
          <p className="mt-4 text-neutral-500">Four steps. One click. Agency-grade output.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number}>
              <div className="mb-4 text-4xl font-black text-brand-100">{step.number}</div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentCrew() {
  const agents = [
    { color: "text-neutral-700", dot: "bg-neutral-400",  name: "Orchestrator",    role: "Project Director",      description: "Reads the brief, maps deliverable dependencies, and sequences four specialist agents across four execution phases. Coordinates without executing." },
    { color: "text-blue-700",    dot: "bg-blue-400",     name: "Research Agent",  role: "Market Analyst",        description: "Runs live Tavily searches to produce a grounded, cited East African market research report. Every statistic traces to a real URL." },
    { color: "text-amber-700",   dot: "bg-amber-400",    name: "Writer Agent",    role: "Brand Copywriter",      description: "Produces taglines, hero copy, feature descriptions, CTAs, company bio, and a ten-slide pitch deck outline grounded in the research." },
    { color: "text-brand-700",   dot: "bg-brand",        name: "Builder Agent",   role: "Frontend Developer",    description: "Generates a complete self-contained HTML landing page optimised for mobile and 3G, then deploys it live to Vercel." },
    { color: "text-purple-700",  dot: "bg-purple-400",   name: "Proposal Agent",  role: "Business Development",  description: "Searches live East African market rates, decomposes project scope, and writes a priced proposal with a budget table." },
  ];

  return (
    <section className="px-6 py-24 bg-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">The agent crew</h2>
          <p className="mt-4 text-neutral-500">Five specialised agents. Sequenced by dependencies. Run in parallel where possible.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.name} className="rounded-xl border border-neutral-200 bg-white p-6 hover:border-brand/40 hover:shadow-sm transition-all">
              <div className="mb-3 flex items-center gap-2">
                <span className={`size-2 rounded-full ${agent.dot}`} />
                <span className={`text-sm font-bold ${agent.color}`}>{agent.name}</span>
              </div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400">{agent.role}</p>
              <p className="text-sm leading-relaxed text-neutral-500">{agent.description}</p>
            </div>
          ))}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-4">Execution sequence</p>
            {[
              { phase: "Phase 1", desc: "Research (sequential)" },
              { phase: "Phase 2", desc: "Writing + Proposal (parallel)" },
              { phase: "Phase 3", desc: "Building (sequential)" },
              { phase: "Phase 4", desc: "Assembly + Delivery" },
            ].map((p) => (
              <div key={p.phase} className="flex items-center gap-3 py-1.5">
                <span className="text-xs font-mono text-brand w-16">{p.phase}</span>
                <span className="text-xs text-neutral-500">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TwoRoles() {
  return (
    <section className="px-6 py-24 bg-neutral-50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">Two sides. One system.</h2>
          <p className="mt-4 text-neutral-500">A production cockpit for freelancers and a delivery portal for clients.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-8">
            <div className="mb-6">
              <span className="text-3xl">🎯</span>
              <h3 className="mt-3 text-xl font-bold text-neutral-900">Freelancer</h3>
              <p className="mt-1 text-sm text-brand font-medium">Production cockpit</p>
            </div>
            <ul className="space-y-3">
              {["Paste a client brief and click Run", "Watch the live agent activity log in real time", "See every Tavily search as it happens", "Manage multiple clients and projects", "Download the full package PDF", "Send Telegram notifications to clients"].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <span className="mt-0.5 text-brand shrink-0">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-8">
            <div className="mb-6">
              <span className="text-3xl">📦</span>
              <h3 className="mt-3 text-xl font-bold text-neutral-900">Client</h3>
              <p className="mt-1 text-sm text-neutral-500">Professional delivery portal</p>
            </div>
            <ul className="space-y-3">
              {["Receive a Telegram notification when package is ready", "Log into a clean, professional delivery portal", "Read each document rendered as formatted web text", "View the live landing page with mobile preview", "Download individual documents or the full PDF", "Submit revision requests directly to the freelancer"].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <span className="mt-0.5 text-neutral-400 shrink-0">✓</span>{item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-neutral-400">
              The client never sees the agent machinery. They see a clean, professional delivery experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function OutputPackage() {
  const docs = [
    { icon: "📊", label: "Market Research Report", desc: "700–900 words, live Tavily data, fully cited with source URLs" },
    { icon: "✍️", label: "Brand Copy Document",    desc: "Taglines, hero copy, features, CTAs, company bio" },
    { icon: "🌐", label: "Live Landing Page",       desc: "Generated HTML deployed to Vercel. Mobile-first, zero dependencies" },
    { icon: "📋", label: "Pitch Deck Outline",      desc: "10 slides with titles, speaker notes, and research-backed data points" },
    { icon: "💼", label: "Priced Project Proposal", desc: "Full proposal with budget table grounded in live East African market rates" },
  ];

  return (
    <section className="px-6 py-24 bg-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">What the client receives</h2>
          <p className="mt-4 text-neutral-500">Five documents. One PDF. One live URL. Assembled in minutes.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div key={doc.label} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-5 hover:border-brand/40 hover:shadow-sm transition-all">
              <span className="text-2xl shrink-0">{doc.icon}</span>
              <div>
                <p className="font-semibold text-neutral-800 text-sm mb-1">{doc.label}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{doc.desc}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-5 items-center">
            <span className="text-2xl shrink-0">📎</span>
            <div>
              <p className="font-semibold text-neutral-400 text-sm mb-1">Agent Activity Log</p>
              <p className="text-xs text-neutral-400 leading-relaxed">Appended to the PDF — every search, every step, auditable</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center bg-neutral-50">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[300px] w-[700px] rounded-full bg-brand-100 blur-[80px] opacity-40" />
      </div>
      <div className="relative mx-auto max-w-2xl">
        <h2 className="mb-4 text-4xl font-bold text-neutral-900 sm:text-5xl">
          Stop executing tasks.
          <br />
          <span className="text-brand">Start orchestrating outcomes.</span>
        </h2>
        <p className="mb-10 text-lg text-neutral-500">
          The freelancer&apos;s only manual actions are: paste the brief, add the client&apos;s
          contact details, and click Run. Everything else is the crew.
        </p>
        <Link
          href="/sign-up"
          className="inline-block rounded-xl bg-brand px-10 py-4 text-lg font-semibold text-white hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20"
        >
          Get started free
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white px-6 py-10">
      <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div>
          <span className="font-bold text-brand">BriefCrew</span>
          <span className="ml-2 text-sm text-neutral-400">The Agentic Freelancer System</span>
        </div>
        <p className="text-xs text-neutral-400">
          Next.js · Clerk · Convex · DeepSeek · Tavily · Vercel · Telegram
          <span className="mx-2">·</span>
          Kolaborate ETDI Capstone · June 2026
        </p>
      </div>
    </footer>
  );
}
