import { Suspense } from "react";
import VibeAuditTool from "@/components/VibeAuditTool";
import AuthButton from "@/components/AuthButton";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vibes Audit",
  url: "https://vibesaudit.com",
  description:
    "AI-powered tone and vibe analyzer. Paste any text and get its vibe forensically deconstructed in three modes — Roast, Life Coach, and Professional.",
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
    a: "A vibe audit analyzes the tone, energy, and personality of any piece of writing. Choose from three modes — Roast for brutally honest humor, Life Coach for warm personal insights, or Professional for workplace tone analysis — and get your text scored across six tailored dimensions.",
  },
  {
    q: "How does the writing tone checker work?",
    a: "Paste any text — an email draft, a tweet, a Slack message, a journal entry — and pick an audit mode. Our AI reads it the way a human would, scoring your writing across six dimensions specific to that mode and giving you a plain-English summary of the overall tone.",
  },
  {
    q: "What are the three audit modes?",
    a: "Roast mode gives you a brutally funny vibe check across dimensions like chaos, dad energy, and pretentiousness. Life Coach mode offers warm, constructive feedback on emotional clarity, confidence, and authenticity. Professional mode evaluates workplace communication for clarity, persuasiveness, and authority.",
  },
  {
    q: "Can I check the tone of my email before sending it?",
    a: "Absolutely. Paste your email draft, pick Professional mode, and get an instant read on how it sounds — clarity, professionalism, authority, and more. Or use Roast mode if you want the unfiltered truth.",
  },
  {
    q: "Is Vibes Audit free?",
    a: "Every user gets 8 free vibe audits across all modes — no signup required. After that, unlimited audits are available for $4/month.",
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

      <header className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 flex justify-end">
        <AuthButton />
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-8">
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
                Pick a mode — Roast, Life Coach, or Professional — and our AI
                scores your text across six tailored dimensions.
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
