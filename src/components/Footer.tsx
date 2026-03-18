export default function Footer() {
  return (
    <footer className="py-8 mt-auto text-center text-sm text-muted">
      <p>
        Built by{" "}
        <a
          href="https://jamesferrell.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          James Ferrell
        </a>
      </p>
      <p className="mt-1 text-xs text-muted/60">Powered by Claude</p>
    </footer>
  );
}
