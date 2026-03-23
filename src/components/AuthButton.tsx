"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

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

  return (
    <button
      onClick={async () => {
        const email = prompt("Enter your email");
        if (!email) return;
        await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        setEmailSent(true);
      }}
      className="text-sm font-medium text-purple hover:text-purple-light transition-colors cursor-pointer"
    >
      Sign in
    </button>
  );
}
