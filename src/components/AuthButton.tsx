"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  useEffect(() => {
    if (showEmailInput) inputRef.current?.focus();
  }, [showEmailInput]);

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">{user.email}</span>
        <button
          onClick={() => supabase.auth.signOut().then(() => setUser(null))}
          className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (emailSent) {
    return (
      <p className="text-sm text-muted">Check your email for a sign-in link.</p>
    );
  }

  if (showEmailInput) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email) return;
          await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });
          setEmailSent(true);
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple w-48"
        />
        <button
          type="submit"
          className="text-sm font-medium text-purple hover:text-purple-light transition-colors cursor-pointer"
        >
          Send link
        </button>
        <button
          type="button"
          onClick={() => { setShowEmailInput(false); setEmail(""); }}
          className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setShowEmailInput(true)}
      className="text-sm font-medium text-purple hover:text-purple-light transition-colors cursor-pointer"
    >
      Sign in
    </button>
  );
}
