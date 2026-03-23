"use client";

import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas-pro";
import type { VibeResult } from "@/lib/types";
import ScoreBar from "./ScoreBar";
import RadarChart from "./RadarChart";

interface ResultsPanelProps {
  result: VibeResult;
  inputText: string;
}

export default function ResultsPanel({ result, inputText }: ResultsPanelProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const dominant = result.dimensions.reduce((max, d) => (d.score > max.score ? d : max), result.dimensions[0]);

  const captureCard = useCallback(async (): Promise<Blob> => {
    const el = cardRef.current;
    if (!el) throw new Error("No card element");
    el.style.position = "fixed";
    el.style.left = "0";
    el.style.top = "0";
    el.style.zIndex = "-1";
    el.style.pointerEvents = "none";
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      width: 540,
    });
    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.zIndex = "";
    el.style.pointerEvents = "";
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image"));
      }, "image/png");
    });
  }, []);

  const handleSaveImage = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await captureCard();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibe-audit-${result.overallVibe.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSharing(false);
    }
  }, [captureCard, result.overallVibe]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await captureCard();
      const file = new File([blob], "vibe-audit.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `My vibe: ${result.overallVibe}`,
          text: `I got "${result.overallVibe}" on Vibes Audit. Check your vibe at vibesaudit.com`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `My vibe: ${result.overallVibe}`,
          text: `I got "${result.overallVibe}" on Vibes Audit. Check your vibe at vibesaudit.com`,
          url: "https://vibesaudit.com",
        });
      } else {
        await navigator.clipboard.writeText(
          `I got "${result.overallVibe}" on Vibes Audit. Check your vibe at vibesaudit.com`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
      }
    } finally {
      setSharing(false);
    }
  }, [captureCard, result.overallVibe]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText("https://vibesaudit.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Derive a human-readable dimension name from the camelCase key
  const dimensionName = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();

  return (
    <div className="animate-fade-in-up mt-8 space-y-6">
      {/* Hidden share card — only rendered for image capture */}
      <div
        ref={cardRef}
        className="absolute -left-[9999px] pointer-events-none"
        aria-hidden="true"
        style={{ width: 540 }}
      >
        <div className="bg-white p-6 space-y-4">
          {/* Original text */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-2">
              The text
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {inputText}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Verdict */}
          <div className="text-center">
            <div className="text-4xl mb-2">{result.vibeEmoji}</div>
            <p className="font-bold text-xl tracking-tight">{result.overallVibe}</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-purple/10 text-purple font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-500 italic leading-relaxed">
              &ldquo;{result.vibeSummary}&rdquo;
            </p>
          </div>

          {/* Author Archetype */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
              Who wrote this
            </p>
            <p className="text-sm font-medium text-gray-700">{result.authorArchetype}</p>
          </div>

          <hr className="border-gray-100" />

          {/* Vibe labels with score rings */}
          <div className="grid grid-cols-3 gap-4">
            {result.dimensions.map((dim) => {
              const r = 22;
              const circ = 2 * Math.PI * r;
              const filled = (dim.score / 100) * circ;
              return (
                <div key={dim.key} className="flex flex-col items-center text-center">
                  <svg width="54" height="54" viewBox="0 0 54 54">
                    <circle cx="27" cy="27" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                      cx="27" cy="27" r={r}
                      fill="none"
                      stroke={dim.color}
                      strokeWidth="3"
                      strokeDasharray={`${filled} ${circ - filled}`}
                      strokeDashoffset={circ / 4}
                      strokeLinecap="round"
                    />
                    <text
                      x="27" y="27"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="14"
                      fontWeight="700"
                      fill={dim.color}
                    >
                      {dim.score}
                    </text>
                  </svg>
                  <span className="text-xs text-gray-500 mt-1 font-medium">{dimensionName(dim.key)}</span>
                  <span className="text-xs font-bold mt-0.5" style={{ color: dim.color }}>
                    {dim.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Watermark */}
          <p className="text-xs text-center text-gray-400 pt-2">
            vibesaudit.com
          </p>
        </div>
      </div>

      {/* Visible results */}
      <div className="space-y-6">
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

        {/* Score rings — mobile only */}
        <div className="grid grid-cols-3 gap-6 max-w-[480px] mx-auto md:hidden">
          {result.dimensions.map((dim) => {
            const r = 26;
            const circ = 2 * Math.PI * r;
            const filled = (dim.score / 100) * circ;
            return (
              <div key={dim.key} className="flex flex-col items-center text-center">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="32" cy="32" r={r}
                    fill="none"
                    stroke={dim.color}
                    strokeWidth="3"
                    strokeDasharray={`${filled} ${circ - filled}`}
                    strokeDashoffset={circ / 4}
                    strokeLinecap="round"
                  />
                  <text
                    x="32" y="32"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="16"
                    fontWeight="700"
                    fill={dim.color}
                  >
                    {dim.score}
                  </text>
                </svg>
                <span className="text-xs text-muted mt-1 font-medium">{dimensionName(dim.key)}</span>
                <span className="text-xs font-bold mt-0.5" style={{ color: dim.color }}>
                  {dim.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Score bars + vibe labels — desktop only */}
        <div className="hidden md:grid grid-cols-2 gap-8 max-w-[630px] mx-auto">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-4 font-medium">
              Dimension scores
            </h3>
            {result.dimensions.map((dim, i) => (
              <ScoreBar
                key={dim.key}
                label={dimensionName(dim.key)}
                score={dim.score}
                color={dim.color}
                delay={i * 100}
              />
            ))}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-4 font-medium">
              Vibe labels
            </h3>
            <div className="space-y-0">
              {result.dimensions.map((dim) => (
                <div key={`label-${dim.key}`} className="h-[44px] flex items-start">
                  <span className="text-sm font-bold" style={{ color: dim.color }}>
                    {dim.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart — full width */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-muted mb-4 font-medium">
          Vibe shape
        </h3>
        <div className="flex justify-center overflow-visible px-20">
          <RadarChart dimensions={result.dimensions} />
        </div>
        <p className="text-sm text-muted text-center mt-3">
          Dominant dimension: <strong>{dimensionName(dominant.key)}</strong> at {dominant.score}
        </p>
      </div>

      {/* Share bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={handleSaveImage}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save image
        </button>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors disabled:opacity-50 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
