export function sanitizeInput(raw: unknown): { text: string } | { error: string } {
  // 1. Type check
  if (typeof raw !== "string") {
    return { error: "Input must be a string." };
  }

  // 2. Length limits
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { error: "Text cannot be empty." };
  }
  if (trimmed.length > 2000) {
    return { error: "Text must be under 2000 characters." };
  }
  if (trimmed.length < 10) {
    return { error: "Text must be at least 10 characters for a meaningful vibe audit." };
  }

  // 3. Strip XML/HTML tags that could break prompt delimiters
  const stripped = trimmed
    .replace(/<\/?[^>]+(>|$)/g, "")     // Remove HTML/XML tags
    .replace(/\]\]>/g, "")              // Remove CDATA closing
    .replace(/<!\[CDATA\[/g, "");       // Remove CDATA opening

  // 4. Normalize whitespace (collapse excessive newlines/spaces)
  const normalized = stripped
    .replace(/\n{4,}/g, "\n\n\n")       // Max 3 consecutive newlines
    .replace(/ {4,}/g, "   ");          // Max 3 consecutive spaces

  return { text: normalized };
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
