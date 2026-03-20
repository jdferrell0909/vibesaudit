import { Suspense } from "react";
import VibeAuditTool from "@/components/VibeAuditTool";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vibes Audit",
  url: "https://vibesaudit.com",
  description:
    "AI-powered tone and vibe analyzer. Paste any text and get its vibe forensically deconstructed — pretentiousness, chaos, dad energy, and more.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const faqs = [
  {
    q: "What is a vibe audit?",
    a: "A vibe audit analyzes the tone, energy, and personality of any piece of writing. Instead of generic sentiment analysis, it scores your text across six dimensions — pretentiousness, dad energy, chaos, passive aggression, corporate buzzwords, and unhinged factor — to give you a full picture of how your writing actually comes across.",
  },
  {
    q: "How does the writing tone checker work?",
    a: "Paste any text — an email draft, a tweet, a Slack message, a cover letter — and our AI reads it the way a human would. It picks up on subtle cues like word choice, sentence structure, and rhetorical patterns to score your writing across six vibe dimensions and give you a plain-English summary of the overall tone.",
  },
  {
    q: "Can I check the tone of my email before sending it?",
    a: "Absolutely. Paste your email draft and get an instant read on how it sounds. You'll see whether it comes across as passive-aggressive, overly corporate, or exactly the right amount of casual. It's like having a brutally honest friend read your email before you hit send.",
  },
  {
    q: "Is Vibes Audit free?",
    a: "Yes. Every user gets 10 free vibe audits. Paste your text, get your results — no signup required.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-heading text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
            vibes audit
          </h1>
          <p className="mt-3 text-lg text-muted max-w-md mx-auto">
            Paste any text. Get its vibe forensically deconstructed.
          </p>
        </div>
        <Suspense>
          <VibeAuditTool />
        </Suspense>

        {/* How It Works */}
        <section className="mt-20 mb-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-heading font-semibold text-foreground mb-1">
                Paste your text
              </h3>
              <p className="text-sm text-muted">
                Drop in any writing — an email, tweet, Slack message, cover
                letter, or LinkedIn post.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🔬</div>
              <h3 className="font-heading font-semibold text-foreground mb-1">
                AI analyzes the vibe
              </h3>
              <p className="text-sm text-muted">
                Our tone analyzer reads your text like a human and scores it
                across six vibe dimensions.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-heading font-semibold text-foreground mb-1">
                Get your vibe report
              </h3>
              <p className="text-sm text-muted">
                See a full breakdown — scores, labels, a radar chart, and a
                summary of how your writing actually sounds.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="font-heading font-semibold text-foreground mb-1">
                  {faq.q}
                </h3>
                <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
