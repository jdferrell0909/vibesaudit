"use client";

import type { VibeResult } from "@/lib/types";
import { DIMENSIONS } from "@/lib/types";
import ScoreBar from "./ScoreBar";
import RadarChart from "./RadarChart";

interface ResultsPanelProps {
  result: VibeResult;
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  // Find dominant dimension
  const scores = DIMENSIONS.map((dim) => ({
    label: dim.label,
    score: result[dim.key] as number,
  }));
  const dominant = scores.reduce((max, s) => (s.score > max.score ? s : max), scores[0]);

  return (
    <div className="animate-fade-in-up mt-8 space-y-6">
      {/* Verdict Card */}
      <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
        <div className="text-5xl mb-3">{result.vibeEmoji}</div>
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          {result.overallVibe}
        </h2>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {result.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 text-xs rounded-full bg-purple/10 text-purple font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-4 text-muted italic max-w-lg mx-auto leading-relaxed">
          &ldquo;{result.vibeSummary}&rdquo;
        </p>
      </div>

      {/* Author Archetype */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-xs uppercase tracking-wider text-muted mb-1 font-medium">
          Who wrote this
        </p>
        <p className="font-medium">{result.authorArchetype}</p>
      </div>

      {/* Two-column layout: scores + radar chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dimension Scores */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted mb-4 font-medium">
            Dimension scores
          </h3>
          {DIMENSIONS.map((dim, i) => (
            <ScoreBar
              key={dim.key}
              label={dim.label}
              score={result[dim.key] as number}
              color={dim.color}
              delay={i * 100}
            />
          ))}
          <div className="mt-5 space-y-1.5">
            {DIMENSIONS.map((dim) => (
              <div key={`label-${dim.key}`} className="flex items-baseline gap-2 text-sm">
                <span className="text-muted">{dim.label}:</span>
                <span className="font-bold" style={{ color: dim.color }}>
                  {result[dim.labelKey]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted mb-4 font-medium">
            Vibe shape
          </h3>
          <div className="flex justify-center">
            <RadarChart data={result} />
          </div>
          <p className="text-sm text-muted text-center mt-3">
            Dominant dimension: <strong>{dominant.label}</strong> at {dominant.score}
          </p>
        </div>
      </div>
    </div>
  );
}
