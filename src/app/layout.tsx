import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vibes Audit — AI-Powered Vibe Analysis",
  description:
    "Paste any text. Get its vibe forensically deconstructed in three modes — Roast, Life Coach, and Professional — all scored by AI.",
  metadataBase: new URL("https://vibesaudit.com"),
  openGraph: {
    title: "Vibes Audit",
    description: "Paste any text. Get its vibe forensically deconstructed by AI.",
    url: "https://vibesaudit.com",
    siteName: "Vibes Audit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibes Audit",
    description: "Paste any text. Get its vibe forensically deconstructed by AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
