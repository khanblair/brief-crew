export const EAST_AFRICA_RATE_CARD = {
  "React Native Developer": { min: 25, max: 45, currency: "USD/hr" },
  "Backend API Developer": { min: 20, max: 40, currency: "USD/hr" },
  "Database Engineer": { min: 18, max: 35, currency: "USD/hr" },
  "Mobile Money Integration": { min: 30, max: 55, currency: "USD/hr" },
  "Frontend Developer": { min: 18, max: 35, currency: "USD/hr" },
  "DevOps Engineer": { min: 22, max: 42, currency: "USD/hr" },
  "QA Engineer": { min: 15, max: 28, currency: "USD/hr" },
  "Project Manager": { min: 20, max: 38, currency: "USD/hr" },
  "UI/UX Designer": { min: 15, max: 30, currency: "USD/hr" },
  "Data Analyst": { min: 18, max: 32, currency: "USD/hr" },
} as const;

export type SkillCategory = keyof typeof EAST_AFRICA_RATE_CARD;
