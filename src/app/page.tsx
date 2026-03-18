import VibeAuditTool from "@/components/VibeAuditTool";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-heading text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
            vibes audit
          </h1>
          <p className="mt-3 text-lg text-muted max-w-md mx-auto">
            Paste any text. Get its vibe forensically deconstructed.
          </p>
        </div>
        <VibeAuditTool />
      </main>
      <Footer />
    </div>
  );
}
