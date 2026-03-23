"use client";

import type { DimensionResult } from "@/lib/types";

interface RadarChartProps {
  dimensions: DimensionResult[];
  size?: number;
}

export default function RadarChart({ dimensions, size = 280 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const levels = 5;
  const labelOffset = 24;
  const count = dimensions.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getPolygonPoints = (value: number) => {
    return Array.from({ length: count }, (_, i) => {
      const pt = getPoint(i, value);
      return `${pt.x},${pt.y}`;
    }).join(" ");
  };

  const dataPoints = dimensions.map((dim, i) => getPoint(i, dim.score));
  const dataPolygon = dataPoints.map((pt) => `${pt.x},${pt.y}`).join(" ");

  // Use the first dimension's color for the fill, or a neutral default
  const fillColor = dimensions[0]?.color ?? "#534AB7";

  const labels = dimensions.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const r = radius + labelOffset;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      label: dim.key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim(),
      anchor: getTextAnchor(angle),
    };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="max-w-full h-auto overflow-visible"
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
      {Array.from({ length: count }, (_, i) => {
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
        fill={`${fillColor}26`}
        stroke={fillColor}
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((pt, i) => (
        <circle
          key={`point-${i}`}
          cx={pt.x}
          cy={pt.y}
          r={4}
          fill={dimensions[i].color}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {labels.map((lbl, i) => {
        const words = lbl.label.split(" ");
        const multiline = words.length >= 2;
        return (
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
            {multiline ? (
              words.map((word, wi) => (
                <tspan key={wi} x={lbl.x} dy={wi === 0 ? "-0.5em" : "1.2em"}>
                  {word}
                </tspan>
              ))
            ) : (
              lbl.label
            )}
          </text>
        );
      })}
    </svg>
  );
}

function getTextAnchor(angle: number): "start" | "middle" | "end" {
  const cos = Math.cos(angle);
  if (cos > 0.3) return "start";
  if (cos < -0.3) return "end";
  return "middle";
}
