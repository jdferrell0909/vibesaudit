"use client";

import { useState, useRef } from "react";

interface PaywallModalProps {
  isSignedIn: boolean;
  onClose: () => void;
  onSignIn: (email: string) => void;
}

export default function PaywallModal({ isSignedIn, onClose, onSignIn }: PaywallModalProps) {
  const [loading, setLoading] = useState<"audit-pack" | "pro" | null>(null);
  const [email, setEmail] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handlePurchase = async (priceType: "audit-pack" | "pro") => {
    setLoading(priceType);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceType }),
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground">You&apos;re out of free audits</h2>
          <p className="text-muted text-sm mt-1">
            Pick up more audits or go unlimited with Pro.
          </p>
        </div>

        {!isSignedIn ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) onSignIn(email);
            }}
            className="text-center"
          >
            <p className="text-sm text-muted mb-4">Sign in to purchase audits.</p>
            <input
              ref={emailInputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 mb-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-purple text-white font-medium text-sm hover:bg-purple-light transition-colors cursor-pointer"
            >
              Send sign-in link
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePurchase("audit-pack")}
              disabled={loading !== null}
              className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-gray-200 hover:border-purple transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="text-2xl font-bold text-foreground">$5</span>
              <span className="text-sm font-medium text-foreground">10 Audits</span>
              <span className="text-xs text-muted">one-time</span>
              {loading === "audit-pack" && (
                <span className="text-xs text-purple mt-1">Redirecting...</span>
              )}
            </button>
            <button
              onClick={() => handlePurchase("pro")}
              disabled={loading !== null}
              className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-purple bg-purple/5 hover:bg-purple/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="text-2xl font-bold text-purple">$4</span>
              <span className="text-sm font-medium text-foreground">Unlimited</span>
              <span className="text-xs text-muted">/month</span>
              {loading === "pro" && (
                <span className="text-xs text-purple mt-1">Redirecting...</span>
              )}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
