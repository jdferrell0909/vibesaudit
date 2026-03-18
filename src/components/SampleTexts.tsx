"use client";

const SAMPLES = [
  {
    label: "Corporate email",
    text: `Hi team, per our last conversation I wanted to circle back and ensure alignment on the Q3 deliverables. Let's leverage our core synergies to move the needle on this initiative. I've looped in stakeholders from cross-functional teams to maximize bandwidth. Please advise on next steps so we can close the loop before EOD. Looking forward to our continued partnership on this journey. Best, Karen`,
  },
  {
    label: "Gen Z tweet",
    text: `ok so i was at target and this old man asked me where the towels were and i was like sir i literally do not work here?? and he said "well you look like you should" WHAT DOES THAT MEAN. i am literally deceased. anyway i showed him where the towels were because im not a monster but fr fr the audacity`,
  },
  {
    label: "Boomer Facebook",
    text: `Just had dinner at the new Italian place on Main Street. The bread was good but the pasta was NOT like what Grandma used to make. Waitress was very nice though. In my day restaurants used real butter. Harold says I need to stop writing reviews on Facebook but I think people should know. Also can someone tell me how to turn off the notifications on this thing? It keeps dinging. - Barbara J. Henderson`,
  },
  {
    label: "Tech bro pitch",
    text: `We're building an AI-powered blockchain solution that leverages Web3 and decentralized machine learning to disrupt the $47B artisanal cheese market. Our proprietary algorithm uses GPT-enhanced smart contracts to tokenize dairy provenance. We're pre-revenue but our Discord has 12k members. Looking to raise a $5M seed round at a $50M valuation. We're basically Uber meets Whole Foods meets ChatGPT.`,
  },
  {
    label: "Yoga influencer",
    text: `Woke up at 4:47am to honor my body's natural rhythm. Sipped ceremonial cacao while watching the sunrise paint the sky in gratitude. Spent 90 minutes journaling about abundance and releasing what no longer serves me. I am not my thoughts. I am not my ego. I am a vessel for light and also this amazing new adaptogenic mushroom blend (link in bio, use code MANIFEST for 15% off).`,
  },
];

interface SampleTextsProps {
  onSelect: (text: string) => void;
}

export default function SampleTexts({ onSelect }: SampleTextsProps) {
  return (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
        Try a sample
      </p>
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.label}
            onClick={() => onSelect(sample.text)}
            className="px-3 py-1.5 text-sm rounded-full border border-gray-200 text-muted hover:border-purple hover:text-purple transition-colors cursor-pointer"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
