"use client";

import { DIMENSIONS } from "@/lib/types";
import type { VibeResult } from "@/lib/types";

interface RadarChartProps {
  data: VibeResult;
  size?: number;
}

export default function RadarChart({ data, size = 320 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const levels = 5;
  const labelOffset = 24;

  const scores = [
    data.pretentiousness,
    data.dadEnergy,
    data.chaos,
    data.passiveAggression,
    data.corporateBuzzwords,
    data.unhingedFactor,
  ];

  // Calculate point position for a given axis index and value (0-100)
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Build polygon points string for a given value
  const getPolygonPoints = (value: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const pt = getPoint(i, value);
      return `${pt.x},${pt.y}`;
    }).join(" ");
  };

  // Data polygon points
  const dataPoints = scores.map((score, i) => getPoint(i, score));
  const dataPolygon = dataPoints.map((pt) => `${pt.x},${pt.y}`).join(" ");

  // Label positions (outside the chart)
  const labels = DIMENSIONS.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = radius + labelOffset;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      label: dim.label,
      anchor: getTextAnchor(angle),
    };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="max-w-full h-auto"
    >
      {/* Grid levels */}
      {Array.from({ length: levels }, (_, i) => {
        const value = ((i + 1) / levels) * 100;
        return (
          <polygon
            key={`level-${i}`}
            points={getPolygonPoints(value)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const pt = getPoint(i, 100);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={pt.x}
            y2={pt.y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="rgba(83, 74, 183, 0.15)"
        stroke="#534AB7"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((pt, i) => (
        <circle
          key={`point-${i}`}
          cx={pt.x}
          cy={pt.y}
          r={4}
          fill={DIMENSIONS[i].color}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {labels.map((lbl, i) => (
        <text
          key={`label-${i}`}
          x={lbl.x}
          y={lbl.y}
          textAnchor={lbl.anchor}
          dominantBaseline="central"
          className="fill-muted"
          fontSize={11}
          fontFamily="var(--font-body), system-ui, sans-serif"
        >
          {lbl.label}
        </text>
      ))}
    </svg>
  );
}

function getTextAnchor(angle: number): "start" | "middle" | "end" {
  const cos = Math.cos(angle);
  if (cos > 0.3) return "start";
  if (cos < -0.3) return "end";
  return "middle";
}
