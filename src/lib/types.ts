export interface VibeResult {
  overallVibe: string;
  vibeEmoji: string;
  pretentiousness: number;
  pretentiousnessLabel: string;
  dadEnergy: number;
  dadEnergyLabel: string;
  chaos: number;
  chaosLabel: string;
  passiveAggression: number;
  passiveAggressionLabel: string;
  corporateBuzzwords: number;
  corporateBuzzwordsLabel: string;
  unhingedFactor: number;
  unhingedLabel: string;
  vibeSummary: string;
  authorArchetype: string;
  tags: string[];
}

export interface VibeApiResponse {
  result: VibeResult;
  remaining: number;
  resetAt: number;
}

export interface VibeApiError {
  error: string;
  remaining?: number;
  resetAt?: number;
}

export const DIMENSIONS = [
  { key: "pretentiousness" as const, label: "Pretentiousness", labelKey: "pretentiousnessLabel" as const, color: "#534AB7" },
  { key: "dadEnergy" as const, label: "Dad Energy", labelKey: "dadEnergyLabel" as const, color: "#1D9E75" },
  { key: "chaos" as const, label: "Chaos", labelKey: "chaosLabel" as const, color: "#D85A30" },
  { key: "passiveAggression" as const, label: "Passive Aggression", labelKey: "passiveAggressionLabel" as const, color: "#D4537E" },
  { key: "corporateBuzzwords" as const, label: "Corporate Buzzwords", labelKey: "corporateBuzzwordsLabel" as const, color: "#378ADD" },
  { key: "unhingedFactor" as const, label: "Unhinged Factor", labelKey: "unhingedLabel" as const, color: "#E24B4A" },
] as const;
