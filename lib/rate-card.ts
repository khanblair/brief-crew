/**
 * Internal benchmark rates (USD/hr) for East African freelance talent.
 * These are fallback values used only when live rate data cannot be extracted
 * from search results. Derived from Upwork EA profiles, Remote.co Africa listings,
 * and BriefCrew aggregated project data (as of Q4 2024).
 *
 * Live rates from Tavily searches take precedence in the proposal agent.
 */
export const EAST_AFRICA_RATE_CARD = {
  // Engineering
  "React Native Developer":    { min: 25, max: 45, currency: "USD/hr" },
  "Frontend Developer":        { min: 18, max: 35, currency: "USD/hr" },
  "Backend API Developer":     { min: 20, max: 40, currency: "USD/hr" },
  "Full-Stack Developer":      { min: 22, max: 42, currency: "USD/hr" },
  "Mobile Money Integration":  { min: 30, max: 55, currency: "USD/hr" },
  "Database Engineer":         { min: 18, max: 35, currency: "USD/hr" },
  "DevOps Engineer":           { min: 22, max: 42, currency: "USD/hr" },
  "Blockchain Developer":      { min: 35, max: 65, currency: "USD/hr" },
  "Data Engineer":             { min: 20, max: 38, currency: "USD/hr" },
  // Quality & Management
  "QA Engineer":               { min: 15, max: 28, currency: "USD/hr" },
  "Project Manager":           { min: 20, max: 38, currency: "USD/hr" },
  "Business Analyst":          { min: 18, max: 35, currency: "USD/hr" },
  // Design
  "UI/UX Designer":            { min: 15, max: 30, currency: "USD/hr" },
  "Graphic Designer":          { min: 12, max: 25, currency: "USD/hr" },
  // Data & Marketing
  "Data Analyst":              { min: 18, max: 32, currency: "USD/hr" },
  "Digital Marketer":          { min: 12, max: 25, currency: "USD/hr" },
  "Content Writer":            { min: 10, max: 20, currency: "USD/hr" },
  // Strategy
  "Product Manager":           { min: 25, max: 50, currency: "USD/hr" },
  "CTO / Technical Advisor":   { min: 40, max: 80, currency: "USD/hr" },
} as const;

export type SkillCategory = keyof typeof EAST_AFRICA_RATE_CARD;
