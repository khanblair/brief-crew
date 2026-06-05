export type AgentName = "Orchestrator" | "Research Agent" | "Writer Agent" | "Builder Agent" | "Proposal Agent" | "Telegram";

export interface LogEntry {
  id: string;
  agent: AgentName;
  status: "running" | "complete" | "error";
  message: string;
  elapsed?: number;
  timestamp: number;
}

export interface AgentOutputs {
  research?: string;
  brandCopy?: string;
  pitchDeck?: string;
  landingPageHtml?: string;
  landingPageUrl?: string;
  proposal?: string;
}

export interface RunContext {
  projectId: string;
  briefText: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientTelegram?: string;
  freelancerName: string;
  freelancerTitle: string;
  projectTitle: string;
  emit: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
}
