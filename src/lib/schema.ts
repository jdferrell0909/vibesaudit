import { z } from "zod";

const scoreSchema = z.number().min(0).max(100).transform(Math.round);
const safeString = z.string().max(500);
const shortString = z.string().max(100);

const dimensionSchema = z.object({
  key: shortString,
  label: shortString,
  score: scoreSchema,
  color: z.string().max(20),
});

export const vibeResultSchema = z.object({
  mode: z.enum(["roast", "life-coach", "professional"]),
  overallVibe: shortString,
  vibeEmoji: z.string().max(10),
  dimensions: z.array(dimensionSchema).length(6),
  vibeSummary: safeString,
  authorArchetype: safeString,
  tags: z.array(shortString).max(5),
});
