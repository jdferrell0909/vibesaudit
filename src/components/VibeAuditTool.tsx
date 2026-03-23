"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { VibeResult, AuditMode } from "@/lib/types";
import { AUDIT_MODES } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import SampleTexts from "./SampleTexts";
import ResultsPanel from "./ResultsPanel";
import PaywallModal from "./PaywallModal";

const LOADING_MESSAGES: Record<AuditMode, string[]> = {
  roast: [
    "Calibrating vibe sensors...",
    "Measuring dad energy wavelength...",
    "Consulting the chaos oracle...",
    "Running passive aggression spectrometry...",
    "Detecting unhinged frequencies...",
    "Computing final vibe verdict...",
  ],
  "life-coach": [
    "Reading between the lines...",
    "Measuring emotional clarity...",
    "Checking authenticity levels...",
    "Sensing growth potential...",
    "Evaluating boundary health...",
    "Preparing your insights...",
  ],
  professional: [
    "Analyzing communication style...",
    "Evaluating clarity and structure...",
    "Measuring persuasiveness...",
    "Checking professional tone...",
    "Assessing authority signals...",
    "Finalizing your assessment...",
  ],
};

export default function VibeAuditTool() {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<AuditMode>("roast");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VibeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const bypassToken = useMemo(() => searchParams.get("token"), [searchParams]);
  const supabase = useMemo(() => createClient(), []);

  // Check auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsSignedIn(!!data.user));
  }, [supabase.auth]);

  // Handle checkout return — reset remaining so button re-enables
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success" || checkout === "cancel") {
      setRemaining(null);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES[mode].length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading, mode]);

  // Auto-scroll to results
  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const analyzeVibe = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (bypassToken) headers["x-bypass-token"] = bypassToken;

      const response = await fetch("/api/vibe-audit", {
        method: "POST",
        headers,
        body: JSON.stringify({ text: inputText, mode }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        if (data.remaining !== undefined) setRemaining(data.remaining);
        if (response.status === 429 && data.remaining === 0) setShowPaywall(true);
        return;
      }

      setResult(data.result);
      setRemaining(data.remaining);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
    setError(null);
  };

  const handleSampleSelect = (text: string) => {
    setInputText(text);
    setResult(null);
    setError(null);
  };

  const charCount = inputText.length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      analyzeVibe();
    }
  };

  return (
    <div>
      {/* Mode selector */}
      <div className="flex gap-2 mb-4">
        {AUDIT_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setResult(null); setError(null); }}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
              mode === m.key
                ? "bg-purple text-white border-purple"
                : "bg-white text-muted border-gray-200 hover:border-purple hover:text-purple"
            }`}
          >
            <span className="mr-1.5">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a Slack message, email, tweet, recipe, breakup text, passive aggressive note from your roommate..."
          rows={5}
          maxLength={2000}
          className="w-full p-4 rounded-xl border border-gray-200 resize-y text-base leading-relaxed placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-shadow"
          disabled={loading}
        />
        <span className="text-xs text-muted tabular-nums block text-right mt-1">
          {charCount}/2000
        </span>
      </div>

      {/* Button row */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={analyzeVibe}
          disabled={!inputText.trim() || loading || (!bypassToken && remaining === 0)}
          className="px-6 py-2.5 rounded-lg bg-purple text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-light transition-colors cursor-pointer min-w-[220px]"
        >
          {loading ? LOADING_MESSAGES[mode][loadingMsgIndex] : "Audit the vibes"}
        </button>
        {inputText && !loading && (
          <button
            onClick={handleClear}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Remaining audits / rate limit message */}
      {remaining !== null && remaining > 0 && (
        <p className="mt-2 text-xs text-muted">
          {remaining} audit{remaining !== 1 ? "s" : ""} remaining
        </p>
      )}
      {remaining === 0 && !loading && (
        <button
          onClick={() => setShowPaywall(true)}
          className="mt-2 text-sm text-coral font-medium hover:underline cursor-pointer"
        >
          You&apos;ve used all your free audits. Get more &rarr;
        </button>
      )}

      {/* Sample texts */}
      <SampleTexts mode={mode} onSelect={handleSampleSelect} />

      {/* Error state */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-danger-bg border border-danger-border text-danger-text text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-8 space-y-6">
          {/* Verdict card */}
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full shimmer" />
              <div className="h-7 w-48 rounded shimmer" />
              <div className="flex gap-2 mt-1">
                <div className="h-5 w-16 rounded-full shimmer" />
                <div className="h-5 w-20 rounded-full shimmer" />
                <div className="h-5 w-14 rounded-full shimmer" />
              </div>
              <div className="h-12 w-full max-w-md rounded shimmer mt-2" />
            </div>
          </div>
          {/* Author archetype */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="h-4 w-24 rounded shimmer mb-2" />
            <div className="h-5 w-64 rounded shimmer" />
          </div>
          {/* Score rings — mobile only */}
          <div className="grid grid-cols-3 gap-6 max-w-[480px] mx-auto md:hidden">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-full shimmer" />
                <div className="h-3 w-20 rounded shimmer" />
                <div className="h-3 w-24 rounded shimmer" />
              </div>
            ))}
          </div>
          {/* Score bars + vibe labels — desktop only */}
          <div className="hidden md:grid grid-cols-2 gap-8 max-w-[630px] mx-auto">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded shimmer mb-2" />
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <div className="h-4 w-28 rounded shimmer" />
                    <div className="h-4 w-8 rounded shimmer" />
                  </div>
                  <div className="h-2 rounded-full shimmer" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 rounded shimmer mb-2" />
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-[44px] flex items-start">
                  <div className="h-4 w-40 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>
          {/* Radar chart */}
          <div>
            <div className="h-4 w-20 rounded shimmer mb-4" />
            <div className="flex justify-center">
              <div className="w-[280px] h-[280px] rounded-full shimmer" />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div ref={resultsRef}>
          <ResultsPanel result={result} inputText={inputText} />
        </div>
      )}

      {/* Paywall modal */}
      {showPaywall && (
        <PaywallModal
          isSignedIn={isSignedIn}
          onClose={() => setShowPaywall(false)}
          onSignIn={() => {
            setShowPaywall(false);
            const email = prompt("Enter your email");
            if (!email) return;
            supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
          }}
        />
      )}
    </div>
  );
}
