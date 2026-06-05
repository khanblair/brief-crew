# BriefCrew
## Agentic Client Engagement System
### Complete Feature Documentation · No Code · v2.0
#### Kolaborate ETDI Capstone Hackathon · June 9–11, 2026

---

## 1. What BriefCrew Is

BriefCrew is an agentic freelancer system that enables a
freelancer to take a client brief and autonomously deliver
a complete, agency-grade engagement package — using a crew
of five specialised AI agents — with minimal manual effort.

The system has two sides:

**The Freelancer side** is the production cockpit. The freelancer
receives a brief from a client, pastes it into BriefCrew, and
the agent crew handles the research, writing, design, and
proposal work. The freelancer orchestrates outcomes instead
of executing tasks by hand.

**The Client side** is the delivery portal. Once the package
is ready, the client receives a Telegram notification with
a login link. They sign in, see their completed deliverables
presented professionally, and download whatever they need.

The client never sees the agent machinery. They see a clean,
professional delivery experience — indistinguishable from
work produced by a full agency team.

---

## 2. The Core Workflow

```
CLIENT contacts freelancer with a project brief
        ↓
FREELANCER logs into BriefCrew, creates a new project,
pastes the client brief, and adds the client's details
        ↓
BRIEFCREW runs the five-agent crew autonomously
        ↓
PACKAGE is assembled and stored in Convex
        ↓
TELEGRAM notification sent to the client with their login link
        ↓
CLIENT logs into their dashboard, views and downloads
their completed engagement package
```

This is the complete loop. The freelancer's only manual
actions are: paste the brief, add the client's contact
details, and click Run. Everything else is the crew.

---

## 3. User Roles

BriefCrew has two roles. Every user selects their role
once during onboarding. The role cannot be changed after
selection without contacting support. The role determines
every screen, every action, and every piece of data
the user can access.

---

### Role 1 — Freelancer

The freelancer is the operator of BriefCrew. They submit
client briefs, run the agent crew, manage projects, and
deliver packages to clients. A freelancer can have many
clients and many active projects simultaneously.

**What a freelancer can do:**
- Create a new project for a client
- Submit a client brief and run the full agent crew
- Watch the live agent activity log during a run
- Review all agent outputs before the package is delivered
- Download the full package PDF or individual documents
- Invite a client to view their package via a Telegram notification
- View all their projects and their statuses on the dashboard
- See the history of all agent runs, including runtime and
  Tavily searches executed
- Manage their account and notification preferences

**What a freelancer cannot do:**
- Access another freelancer's projects or clients
- See the client-facing dashboard experience
- Modify agent outputs after generation (outputs are final)
- Run a new brief while another is actively processing

---

### Role 2 — Client

The client is the recipient of the engagement package.
They do not interact with the agent crew, do not see the
agent log, and do not configure anything. Their experience
is entirely about viewing and downloading their deliverables.

A client account is created in one of two ways: the client
signs up themselves and selects the Client role during
onboarding, or the client follows the Telegram notification
link which pre-populates their role during sign-up. Either
path leads to the same client dashboard.

**What a client can do:**
- View all projects the freelancer has delivered to them
- Read each document in their engagement package
- Download individual documents or the full package PDF
- View the live URL of their deployed landing page
- See the project status (in progress, delivered, complete)
- Update their display name and contact preferences
- Request a revision (sends a Telegram message to the freelancer)

**What a client cannot do:**
- Submit briefs or run agent crews
- See other clients' projects
- See the freelancer's full project list
- See agent activity logs or internal run metadata
- Access any other client's package

---

## 4. Authentication and Onboarding

---

### 4.1 Sign Up

Both roles use the same sign-up screen. Users can register
with their email address or with Google sign-in. Clerk
handles all authentication — password hashing, session
management, and security. BriefCrew never stores passwords.

After completing the Clerk sign-up form, the user is
immediately redirected to the onboarding flow.

---

### 4.2 Onboarding — Role Selection

Onboarding is a two-step flow that every new user completes
exactly once. It cannot be skipped.

**Step 1 — Role Selection**

The user sees two large cards side by side:

**I am a Freelancer**
Description: "I take client briefs and deliver engagement
packages using AI agents. I manage projects and clients."
Icon: a person directing a crew.

**I am a Client**
Description: "I have received a link to view my project
deliverables from my freelancer."
Icon: a person receiving a document.

The user clicks one card. Their selection is saved to
Convex and attached to their Clerk user ID. This selection
is permanent.

**Step 2 — Profile Setup**

Both roles complete a brief profile:

Freelancer profile fields:
- Display name (how they appear to clients)
- Professional title (e.g. "Product Strategist", "Digital Consultant")
- Telegram username (for receiving system notifications)

Client profile fields:
- Display name (how they appear to the freelancer)
- Company name (appears on their package cover page)
- Telegram username or phone number (for receiving notifications)

After profile setup, the user lands on their role-specific
dashboard for the first time.

---

### 4.3 Sign In

Returning users go directly to the sign-in screen. After
authentication, Clerk identifies the user, BriefCrew checks
their role in Convex, and they are routed to the correct
dashboard — freelancer or client — automatically. No role
selection is shown again.

---

### 4.4 Route Protection

Every application route is protected. Unauthenticated users
are redirected to sign-in regardless of which URL they attempt
to access. Role-based routing is enforced server-side:

- A client who attempts to access a freelancer route is
  redirected to their client dashboard
- A freelancer who attempts to access a client route is
  redirected to their freelancer dashboard
- No cross-role data is accessible via any API route —
  every API call verifies the caller's role and user ID
  before returning any data

---

## 5. The Freelancer Dashboard

The freelancer dashboard is the operational centre of
BriefCrew. It has five sections accessible from a persistent
left sidebar.

---

### 5.1 Projects Overview (Home)

The default landing screen after sign-in for the freelancer.

**What it shows:**

Active Projects Panel — All projects currently in progress
or recently delivered. Each project card shows: the client's
name and company, the project title derived from the brief,
the current status (brief submitted, agents running, package
ready, delivered to client, complete), the date created,
and a quick action button appropriate to the current status.

Stats Bar — Four numbers displayed prominently at the top
of the screen: total projects delivered, total agent runs
executed, total Tavily searches performed across all runs,
and total documents generated. These numbers grow with every
project and serve as a portfolio signal.

Quick Action Button — A prominent "New Project" button
always visible at the top right of the screen. Clicking it
opens the new project flow.

Recent Activity Feed — A chronological log of recent
events across all projects: "Agent crew completed for
[client name]", "Package downloaded by [client name]",
"Revision requested by [client name]". Keeps the freelancer
informed without needing to open individual projects.

---

### 5.2 New Project Flow

This is the primary action a freelancer takes. It is a
three-step flow.

**Step 1 — Client Details**

The freelancer specifies who this project is for:

Client Name field — The client's full name.

Company Name field — The client's company or organisation.
Used on the package cover page.

Client Email field — Used to look up an existing client
account in Convex or to pre-populate their invitation.

Client Telegram field — The client's Telegram username
or phone number for the notification. If the client does
not use Telegram, this field can be left empty — the
notification is skipped and the freelancer delivers the
package manually.

Project Title field — A short name for this project,
used in the freelancer's project list. Not shown to the client.

Continue button — Moves to Step 2.

**Step 2 — The Brief**

Brief Text Area — A large, prominent text input where
the freelancer pastes the client's brief exactly as
received. No formatting required. The system accepts
free-form text from any source — a WhatsApp message,
an email, a voice note transcription, a document paste.

Brief Analysis Preview — After the freelancer stops
typing (two-second debounce), a lightweight Claude call
analyses the brief and displays what deliverables have
been detected and which agents will handle each one.
This preview is a confidence check — the freelancer
sees that BriefCrew has understood the brief correctly
before committing to the full run.

Example detection output:
```
Detected deliverables:
✅ Market research report → Research Agent
✅ Brand copy and tagline → Writer Agent
✅ Landing page → Builder Agent
✅ Pitch deck outline → Writer Agent
✅ Priced project proposal → Proposal Agent

All five agents will be engaged. Estimated runtime: 3–5 minutes.
```

If the brief is too short (under 50 words) or too vague
for the system to detect any deliverables, a warning is
shown and the Run button remains disabled.

Run BriefCrew Button — Starts the agent crew and
transitions to the Agent Activity Log screen.

**Step 3 — Agent Activity Log**
(Described in full in Section 7.)

---

### 5.3 Project Detail View

Clicking any project in the Projects Overview opens the
full project detail view for that project.

**What it shows:**

Project Header — Client name, company, project title,
creation date, current status.

Package Documents Panel — All five documents listed with
their completion status, word count, and a preview of
the first 100 words. Each document has a Download button
for the individual file.

Download Full Package Button — Downloads the assembled
multi-section PDF for this project.

Landing Page Card — Shows the live Vercel URL, a thumbnail
screenshot of the landing page, and a Copy URL button.

Agent Run Summary — A collapsed section showing: total
runtime, number of Tavily searches, total words generated,
and a timeline of when each agent started and completed.
Expandable to the full agent activity log.

Client Access Status — Shows whether the client has been
notified, whether they have logged in, and when they last
accessed their dashboard. Gives the freelancer visibility
into whether the client has seen their package.

Send Notification Button — If the client has not yet
been notified, or the freelancer wants to re-send the
notification, this button triggers the Telegram message.

Revision Request Panel — If the client has submitted a
revision request, it appears here with the client's message
and a timestamp. The freelancer can acknowledge the request
and optionally run a new brief (creating a v2 of the project).

---

### 5.4 Client Management

A dedicated screen showing all clients the freelancer has
worked with across all projects.

**What it shows:**

Client list — Each client's name, company, number of
projects delivered, and date of most recent engagement.

Client detail — Clicking a client shows all projects
delivered to that client and their current statuses.

This section exists to help the freelancer manage repeat
clients without needing to re-enter their details for
every new project.

---

### 5.5 Account Settings

The freelancer's personal settings screen.

**What can be configured:**

Display name and professional title.

Telegram username — used for system alerts when an agent
run encounters an error or when a client submits a revision
request.

Notification preferences — which events trigger a Telegram
message to the freelancer: run complete, client accessed
package, revision requested.

Declared base code acknowledgement — a read-only record
of the prior submissions this project is built on, included
for hackathon compliance transparency.

---

## 6. The Client Dashboard

The client dashboard is a clean, professional delivery
portal. It shows nothing of the agent machinery. It
presents the completed engagement as if it were delivered
by a full agency.

The client dashboard has three sections.

---

### 6.1 My Projects (Home)

The default landing screen after sign-in for the client.

**What it shows:**

Project Cards — Each project the freelancer has delivered
to this client. Each card shows: the project title, the
freelancer's name, the date delivered, the current status
(in progress, ready for review, complete), and a View
Package button.

A client with one project sees one card. A client who
has worked with the same freelancer on multiple engagements
sees all of them, most recent first.

In Progress State — If the freelancer is currently running
the agent crew for this client's project, the card shows
an animated "Your package is being prepared" state with
an estimated completion time. The client cannot see the
agent log — they see a professional holding screen.

Delivered State — When the package is ready, the card
shows a green "Ready for Review" badge and the View
Package button becomes active.

---

### 6.2 Package View

The primary client screen. Opened when the client clicks
View Package on any delivered project.

**What it shows:**

Package Header — Project title, prepared by (freelancer's
display name and title), date delivered, and a Download
Full Package button.

Document Navigator — A left sidebar listing all five
documents in the package. Clicking any document name
scrolls the main panel to that document. Active document
is highlighted.

Main Content Panel — The full text content of each document
rendered cleanly as formatted text. Not a PDF preview —
the content is rendered as readable web text so it is
easy to read on any device including mobile.

Documents presented:
- Market Research Report (with all citations rendered as
  clickable links)
- Brand Copy Document (each copy asset in a labelled card:
  tagline, hero copy, features, CTAs, company bio)
- Landing Page (the live URL displayed prominently with
  an Open button, plus a mobile-viewport preview)
- Pitch Deck Outline (slide-by-slide view with title and
  speaker notes per slide)
- Project Proposal (full proposal rendered with the budget
  table formatted as a proper table, not plain text)

Download Options — At the top of each document: a Download
This Document button for the individual file. At the top
of the page: a Download Full Package button for the
complete PDF.

---

### 6.3 Revision Request

If the client wants changes to any part of the package,
they use the revision request feature.

**What it shows:**

Revision Request Button — Available on the Package View
screen. Clicking it opens a modal.

Revision Modal — Contains:
- A dropdown to select which document the revision relates to
- A text area for the client to describe what they need changed
  or what was missing from the brief
- A Submit Request button

On submission, the revision request is saved to Convex
and a Telegram notification is sent to the freelancer
with the client's message. The freelancer sees the request
in their Project Detail View and can respond by running
a new brief if needed.

The client sees a confirmation: "Your revision request
has been sent. Your freelancer will be in touch."

---

### 6.4 Account Settings

The client's personal settings screen.

**What can be configured:**

Display name and company name — both appear on the
package cover page in future projects.

Telegram username — for receiving notifications when
new packages are delivered.

The client cannot change their role. They cannot access
any freelancer functionality from this screen.

---

## 7. The Agent Activity Log Screen

This screen is exclusive to the freelancer. The client
never sees it. It is the most important screen in the
application for the demo because it makes the orchestration
visible in real time.

After the freelancer clicks Run BriefCrew, the application
transitions immediately to this screen. It stays on this
screen until the Orchestrator signals that the package
is fully assembled.

---

### 7.1 Orchestrator Status Header

A banner at the top of the screen showing the current
execution phase and a running elapsed time counter.

Phases displayed:
- Phase 1: Research (sequential)
- Phase 2: Writing + Proposal (parallel)
- Phase 3: Building (sequential)
- Phase 4: Assembly (sequential)
- Complete

The phase indicator transitions automatically as the
Orchestrator moves between phases.

---

### 7.2 The Live Log Panel

A dark-background terminal-style panel that updates
in real time via server-sent events as agents work.

Each log entry contains:
- A status icon: spinning for in-progress, green checkmark
  for complete, red X for error
- The agent name in a distinct colour unique to that agent
- The current step in plain English
- For Tavily searches: the exact query string, so the
  freelancer can see real web research happening live
- Elapsed time for each completed step in milliseconds

Colour assignments:
- Orchestrator: white
- Research Agent: blue
- Writer Agent: amber
- Builder Agent: green
- Proposal Agent: purple

Example log as it populates during a run:

```
✅  Orchestrator      Brief received — 247 words
✅  Orchestrator      Deliverables detected — 5 identified
✅  Orchestrator      Execution sequence planned — 4 phases
✅  Orchestrator      Phase 1 starting: Research Agent

⚡  Research Agent    Generating search queries from brief...
✅  Research Agent    5 queries generated
⚡  Research Agent    Tavily search: "agri-fintech adoption Uganda
                      Kenya 2025 GSMA"
✅  Research Agent    5 results returned
⚡  Research Agent    Fetching full article: gsma.com/...
✅  Research Agent    Article read — 4 data points extracted
⚡  Research Agent    Tavily search: "mobile money smallholder
                      farmers East Africa statistics"
✅  Research Agent    5 results returned — 3 data points extracted
⚡  Research Agent    Tavily search: "agri-fintech competitors
                      Uganda Kenya MkulimaWallet"
✅  Research Agent    Competitive landscape identified — 4 players
⚡  Research Agent    Synthesising findings into report...
✅  Research Agent    Market research report complete — 812 words
✅  Orchestrator      Phase 1 complete — Phase 2 starting (parallel)

⚡  Writer Agent      Analysing audience from research output...
⚡  Proposal Agent    Tavily search: "React Native developer rate
                      Uganda Kenya freelance 2025"
✅  Proposal Agent    Rate data retrieved — East Africa adjustment
                      applied
⚡  Writer Agent      Generating tagline options...
✅  Writer Agent      3 tagline options generated
⚡  Proposal Agent    Tavily search: "backend API developer rate
                      East Africa fintech"
✅  Proposal Agent    Rate retrieved — no adjustment needed
⚡  Writer Agent      Generating hero copy...
✅  Writer Agent      Hero section complete
⚡  Writer Agent      Generating feature descriptions...
✅  Writer Agent      3 feature descriptions complete
⚡  Writer Agent      Generating pitch deck outline...
✅  Proposal Agent    Scope decomposition complete — 11 components
✅  Writer Agent      Pitch deck outline complete — 10 slides
✅  Proposal Agent    Budget calculated — range: $28,400–$44,200
✅  Proposal Agent    Proposal document complete — 1,240 words
✅  Orchestrator      Phase 2 complete — Phase 3 starting: Builder

⚡  Builder Agent     Mapping copy to page sections...
✅  Builder Agent     Content map complete
⚡  Builder Agent     Generating landing page HTML...
✅  Builder Agent     HTML generated — 923 lines
⚡  Builder Agent     Validating HTML structure...
✅  Builder Agent     Validation passed — no errors
⚡  Builder Agent     Deploying to Vercel...
✅  Builder Agent     Live URL: mkulimawallet.vercel.app
✅  Orchestrator      Phase 3 complete — Phase 4 starting: Assembly

⚡  Orchestrator      Assembling cover page...
✅  Orchestrator      Cover page complete
⚡  Orchestrator      Compiling all documents into package...
✅  Orchestrator      Package compiled — 5 documents, 16 pages
⚡  Orchestrator      Exporting PDF...
✅  Orchestrator      PDF exported — BriefCrew-MkulimaWallet.pdf
⚡  Orchestrator      Sending Telegram notification to client...
✅  Telegram          Notification delivered to client
✅  Orchestrator      Package complete — total runtime: 3m 42s
```

---

### 7.3 Completion Transition

When the Orchestrator logs the final "Package complete" entry,
the screen shows a brief full-screen success state — a green
checkmark, the total runtime, and a summary count of what
was produced. After three seconds, it automatically
transitions to the Project Detail View for this project.

---

## 8. The Agent Crew — Full Specification

---

### 8.1 The Orchestrator Agent

**Role:** Project director. Reads the brief, plans execution,
dispatches agents in the correct sequence, collects and
quality-checks outputs, and assembles the final package.

**Execution sequence it manages:**

Phase 1 — Sequential: Research Agent must complete first
because both Writer and Proposal depend on its output.

Phase 2 — Parallel: Writer Agent and Proposal Agent run
simultaneously. Writer needs Research output. Proposal needs
Research output. Neither needs the other's output. Running
them in parallel saves the most time of any decision in
the orchestration.

Phase 3 — Sequential: Builder Agent runs after Writer
because it needs finalised copy for the landing page.

Phase 4 — Sequential: Orchestrator assembles all outputs
into the final package once all four agents are complete.

**What it does not do:** The Orchestrator does not write
copy, perform research, generate HTML, or calculate budgets.
It directs. The separation of coordination from execution
is the architectural proof of genuine orchestration.

**Quality check:** After each agent completes, the
Orchestrator performs a lightweight check — does the output
match the expected structure, does it address the brief,
is it coherent with upstream outputs. If an output fails
the check, the agent is retried once with additional
context about what was missing. If the retry also fails,
the Orchestrator marks that document as incomplete and
continues assembly, noting the failure in the package
appendix.

---

### 8.2 The Research Agent

**Role:** Market analyst. Produces a grounded, cited market
research report using live Tavily web search.

**Step 1 — Query Generation**
Generates five targeted search queries from the client brief.
Queries are constructed to surface regionally specific,
current data from authoritative sources — GSMA, FSD Africa,
central banks, fintech research firms, and industry publications.

**Step 2 — Live Tavily Search**
Executes all five queries through the Tavily Search API.
Retrieves the top five results per query. For the two most
relevant results per query, fetches and reads the full article.

**Step 3 — Data Extraction**
Extracts from all sources: specific statistics with source
and date, named competitors and their products, regulatory
references, geographic coverage data, and investment figures.
All data points are tagged with their source URL.

**Step 4 — Africa Rate Bias Correction**
Any statistics from global or Western contexts are flagged
and either excluded or explicitly contextualised. The report
must be grounded in East African data.

**Step 5 — Report Writing**
Produces a structured 700–900 word report with: Executive
Summary, Market Size and Adoption, Competitive Landscape,
Regulatory Environment, Target Audience Profile, Opportunity
Analysis, and Sources.

**Output:** Fully cited market research report ready for
inclusion in the client package.

---

### 8.3 The Writer Agent

**Role:** Brand copywriter. Produces all text content for
the client engagement.

**What it receives:** The client brief and the Research
Agent's completed report.

**Step 1 — Audience Analysis**
Reads the research output to identify three audience segments
and their distinct communication needs before writing anything.

**Step 2 — Brand Copy Package**
Produces in sequence:
- Primary tagline plus two alternatives (no generic fintech
  language — no "empowering", "seamless", "unlocking")
- Hero headline (eight words maximum), sub-headline (twenty
  words maximum), supporting paragraph (forty words maximum)
- Three feature descriptions at fifty words each in plain
  language accessible to the primary audience
- Primary CTA and secondary CTA (five words maximum each)
- 150-word company bio for investor materials

**Step 3 — Pitch Deck Outline**
Produces a ten-slide structure with: slide title, two-sentence
speaker notes, and one suggested data point per slide drawn
from the Research Agent's findings.

**Step 4 — Copy Consistency Check**
Reviews all copy for voice consistency and factual alignment
with the research report. No figure appears in copy that
does not appear in the research.

**Output:** Structured copy document with all assets labelled,
ready for the Builder Agent and for the client package.

---

### 8.4 The Builder Agent

**Role:** Frontend developer. Produces and deploys a
mobile-first landing page as a single HTML file.

**What it receives:** The Writer Agent's complete copy
document and the client's brand context.

**Step 1 — Layout Planning**
Plans a single-page layout optimised for farmers arriving
on Android phones via WhatsApp links on 3G connections.
Every design decision serves the constraint of fast loading
and immediate clarity.

**Step 2 — Content Mapping**
Maps copy to page sections: hero, features, social proof,
about, and footer.

**Step 3 — Page Generation**
Produces a complete self-contained HTML file. All CSS
is in a style tag within the same file. All JavaScript
is inline in a script tag. No external dependencies.
No CDN calls. One file that renders correctly with no
internet connection.

Design constraints enforced:
- Mobile-first layout
- System font stack only
- WCAG AA colour contrast on all text
- Touch targets minimum 44px
- Above-the-fold CTA visible on a 375px viewport without scrolling
- Colour palette appropriate to agricultural context

**Step 4 — Validation**
Validates HTML structure, semantic elements, Open Graph
meta tags, and viewport meta tag.

**Step 5 — Deployment**
Deploys to Vercel via the Vercel Deploy API. Returns a
live public URL to the Orchestrator.

Fallback: If deployment fails, returns the HTML file path.
The freelancer can deploy manually. The README documents
this as a known edge case.

**Output:** Live URL and HTML source file.

---

### 8.5 The Proposal Agent

**Role:** Business development consultant. Produces a
complete priced project proposal grounded in live market rates.

**What it receives:** The client brief and the Research
Agent's market report.

**Step 1 — Scope Decomposition**
Breaks the full project into discrete technical components:
mobile application, backend API, database, mobile money
integrations, data integrations, insurance trigger logic,
interest engine, admin dashboard, QA, DevOps, and project
management.

**Step 2 — Live Rate Grounding**
Runs a targeted Tavily search for each skill category to
retrieve current East African market rates. Applies the
Africa rate bias correction when results skew Western.
Every budget figure traces to a search result or a declared
assumption — no hallucinated numbers.

**Step 3 — Effort Estimation**
Estimates development hours per component at three confidence
levels: optimistic, realistic, and conservative.

**Step 4 — Budget Calculation**
Multiplies effort estimates by grounded rate ranges.
Adds 15% project management overhead and 10% contingency.
Presents a total range with a recommended midpoint figure.

**Step 5 — Proposal Writing**
Produces a complete proposal document containing: executive
summary, scope of work, recommended team structure, phased
timeline (12–16 weeks), budget breakdown as a line-item
table, payment milestone schedule, and terms and next steps.

**Output:** Complete priced project proposal ready for the
client package.

---

## 9. The Output Package

When all five agents complete, the Orchestrator assembles
the final client package. This is what the client sees
in their dashboard and what they download as a PDF.

**Cover Page**
Project name, client name and company, date of delivery,
prepared by (freelancer's display name and title), and
a one-paragraph executive summary of the engagement.

**Table of Contents**
All five documents listed with page numbers.

**Document 1 — Market Research Report**
Research Agent output. 700–900 words, fully cited,
with a sources section listing all URLs and publication dates.

**Document 2 — Brand Copy Document**
Writer Agent output. All copy assets in labelled sections:
tagline options, hero copy, feature descriptions, CTAs,
company bio.

**Document 3 — Landing Page**
The live URL displayed prominently. A screenshot at both
desktop and mobile viewport widths. HTML source file
noted as a supplementary asset available on request.

**Document 4 — Pitch Deck Outline**
Writer Agent pitch deck output. Ten slides with titles
and speaker notes, formatted slide by slide.

**Document 5 — Project Proposal**
Proposal Agent output. Complete proposal with the budget
table formatted as a professional table with columns for
component, hours, rate range, and cost range.

**Appendix — Agent Activity Log**
The complete run log showing which agent ran when, which
Tavily searches were executed, and how long each step took.
This appendix makes the process auditable. It also serves
as a transparency signal — the client can see the depth
of research and effort that went into their package.

**PDF export:** Single multi-section PDF. BriefCrew
wordmark and client name in the header of every page.
Filename format: BriefCrew-[ClientCompany]-[YYYYMMDD].pdf

---

## 10. Telegram Notification

**Trigger:** Package assembly confirmed complete by Orchestrator.

**Recipient:** The client's Telegram username as entered
by the freelancer in the new project flow.

**Fallback:** If no client Telegram is provided, the
notification is sent to the freelancer instead, who
delivers the package manually.

**Message sent to client:**

```
🎯 Your BriefCrew Package Is Ready

Hi [Client Name],

[Freelancer display name] has completed your engagement
package for [Project Title].

Your package includes:
📊 Market Research Report
✍️  Brand Copy & Tagline Options
🌐 Landing Page — live at: [Vercel URL]
📋 Pitch Deck Outline (10 slides)
💼 Priced Project Proposal

Log in to view and download your package:
[BriefCrew dashboard link]

Delivered by BriefCrew
The Agentic Freelancer System
```

**Note on WhatsApp:** WhatsApp integration via WPPConnect
is deferred to a post-hackathon release. Telegram provides
an official Bot API with zero ban risk and five-minute setup.
All notifications in this version use Telegram only.

---

## 11. Data Storage

All persistent data is stored in Convex. No JSON files
on disk. No localStorage for application data.

**Users table**
Stores Clerk user ID, email, display name, role (freelancer
or client), Telegram username, company name (clients),
professional title (freelancers), and onboarding completion status.

**Projects table**
Stores project title, the freelancer's user ID, the client's
user ID (if they have a BriefCrew account) or their contact
details (if they do not), the raw brief text, the current
status, creation timestamp, and completion timestamp.

**Agent runs table**
One record per agent run. Stores the project ID, total
runtime, phase completion timestamps, and overall success
or failure status.

**Agent outputs table**
One record per agent per run. Stores the agent name, start
time, end time, output word count, the full output text,
and a quality check result (pass, fail, or retried).

**Tavily search log table**
Every Tavily search executed. Stores the query string,
number of results returned, URLs fetched for full reading,
and data points extracted. Linked to the agent run that
triggered it.

**Packages table**
One record per assembled package. Stores the project ID,
the list of document IDs included, the Vercel URL if
deployment succeeded, the PDF export status, and the
Telegram notification delivery status and timestamp.

**Revision requests table**
Client revision requests. Stores the project ID, the
document the revision relates to, the client's message,
the timestamp, and the freelancer's acknowledgement status.

---

## 12. Grounding and Rate Card

**Primary: Tavily Live Search**
Research Agent and Proposal Agent both call Tavily during
every run. All statistics and all budget figures have a
traceable source — either a real URL with a publication
date, or a declared assumption.

**Secondary: Static Rate Card Fallback**
If Tavily is unavailable or returns irrelevant results,
the Proposal Agent falls back to a static rate card covering
Uganda, Kenya, Nigeria, and South Africa across all major
skill categories. When the fallback is used, the proposal
states this explicitly: "Rate estimated from internal
benchmarks — live market data unavailable at time of
generation."

**Africa Rate Bias Correction**
Both agents identify when results skew toward US or European
rates and apply a documented adjustment for East African
market context. The adjustment and its rationale are included
in the proposal's budget methodology section.

---

## 13. What Is Out of Scope (Declared)

**WhatsApp notifications** — Deferred to Phase 2. Telegram
handles all notifications in this version.

**Real-time collaboration** — Only one freelancer can work
on a project. Team freelancer accounts are a roadmap item.

**Editable agent outputs** — Outputs are final as generated.
Editing happens in downloaded documents outside the app.

**Image generation** — Landing page uses CSS design only.
AI-generated brand visuals are a roadmap item.

**Multi-language output** — English only. Swahili and Luganda
localisation is a roadmap item.

**Docker containerisation** — Application runs locally
with Node.js. Docker is a post-hackathon infrastructure item.

**Batch briefs** — One brief per project run. Batch
processing is a roadmap item.

**Client self-registration without invitation** — Clients
can sign up independently and select the Client role.
However, they will see an empty project list until a
freelancer has delivered a package to their account.
Pre-linked invitations via the Telegram notification link
are the recommended client onboarding path.

---

## 14. Declared Base Code

**From KolaAgent (Agent Economy Hackathon, May 2026):**
- Clerk authentication and middleware configuration
- Convex schema patterns and JWT bridge
- Tavily search integration and Africa rate bias correction logic
- Claude API tool-calling loop architecture
- AgentLog UI component (adapted for five-agent parallel display)
- jsPDF export utilities and branding templates
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
- Package assembly layer (multi-document PDF with cover page)
- Brief analysis preview (pre-run deliverable detection)
- Agent Activity Log appendix auto-generation
- Revision request system (client to freelancer)
- Client access tracking (has the client viewed their package)
- Telegram notification with client dashboard link

---

## 15. Submission Package

**GitHub Repository:** Public. Conventional commits throughout
the 48-hour build. Minimum eight commits demonstrating an
iterative build process. Declared base code noted in README.

**Demo Video:** Three minutes on Loom. Shows the freelancer
submitting a brief, the agent log running live with Tavily
searches visible, the package completing, the Telegram
notification firing, and the client dashboard receiving
and viewing the package. Two perspectives: freelancer
and client.

**200-Word Write-Up:**

BriefCrew is an agentic freelancer system that takes a single
client brief and autonomously delivers a complete agency-grade
engagement package using a crew of five specialised AI agents.

A freelancer pastes the client brief into BriefCrew and clicks
Run. The Orchestrator Agent reads the brief, maps deliverable
dependencies, and sequences four specialist agents: a Research
Agent that runs live Tavily searches to produce a grounded
East African market report, a Writer Agent that produces brand
copy and a pitch deck outline from the research findings, a
Builder Agent that generates and deploys a mobile-first landing
page, and a Proposal Agent that grounds its budget in live
market rate searches before producing a complete priced proposal.

The assembled package is delivered to a dual-role platform:
the freelancer sees a full project management dashboard, while
the client receives a Telegram notification and logs into a
clean delivery portal to view and download their documents.

Building BriefCrew confirmed that the hardest part of agentic
freelancing is not intelligence but orchestration — deciding
which agents run in parallel, which must wait for upstream
output, and how to present five distinct agent outputs as one
coherent professional package. That design challenge is where
the leverage lives.

[Word count: 199]

**README:** Every implemented feature linked to its file path.
Declared base code section complete. Out-of-scope section
honest and comprehensive. Setup instructions tested on a
clean clone.

---

*BriefCrew · The Agentic Freelancer System*
*Built on KolaMatch Intelligence + KolaAgent*
*Next.js · Clerk · Convex · Claude API · Tavily · Vercel · jsPDF · Telegram*
*Kolaborate ETDI Capstone · June 9–11, 2026*