"use client";

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
  delay?: number;
}

export default function ScoreBar({ label, score, color, delay = 0 }: ScoreBarProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full animate-score-bar"
          style={{
            width: `${score}%`,
            backgroundColor: color,
            animationDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}
