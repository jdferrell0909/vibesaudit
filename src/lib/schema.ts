import { z } from "zod";
import { escapeHtml } from "./sanitize";

const scoreSchema = z.number().min(0).max(100).transform(Math.round);
const safeString = z.string().max(500).transform(escapeHtml);
const shortString = z.string().max(100).transform(escapeHtml);

export const vibeResultSchema = z.object({
  overallVibe: shortString,
  vibeEmoji: z.string().max(10),   // Emoji can be multi-codepoint
  pretentiousness: scoreSchema,
  pretentiousnessLabel: shortString,
  dadEnergy: scoreSchema,
  dadEnergyLabel: shortString,
  chaos: scoreSchema,
  chaosLabel: shortString,
  passiveAggression: scoreSchema,
  passiveAggressionLabel: shortString,
  corporateBuzzwords: scoreSchema,
  corporateBuzzwordsLabel: shortString,
  unhingedFactor: scoreSchema,
  unhingedLabel: shortString,
  vibeSummary: safeString,
  authorArchetype: safeString,
  tags: z.array(shortString).max(5),
});
