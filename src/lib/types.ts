export type AuditMode = "roast" | "life-coach" | "professional";

export interface DimensionResult {
  key: string;
  label: string;
  score: number;
  color: string;
}

export interface VibeResult {
  mode: AuditMode;
  overallVibe: string;
  vibeEmoji: string;
  dimensions: DimensionResult[];
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

export const AUDIT_MODES = [
  { key: "roast" as const, label: "Roast", icon: "🔥", description: "Brutally honest vibe check" },
  { key: "life-coach" as const, label: "Life Coach", icon: "🌱", description: "Warm, constructive feedback" },
  { key: "professional" as const, label: "Professional", icon: "💼", description: "Workplace tone analysis" },
] as const;
