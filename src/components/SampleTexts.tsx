"use client";

import type { AuditMode } from "@/lib/types";

interface Sample {
  label: string;
  text: string;
}

const SAMPLES: Record<AuditMode, Sample[]> = {
  roast: [
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
  ],
  "life-coach": [
    {
      label: "Journal entry",
      text: `I keep saying I'm fine but I don't think I am. Everything at work feels like I'm running on a treadmill that keeps speeding up. I smiled through the whole team meeting today and then cried in my car for ten minutes. I don't even know what I want anymore. Maybe I never did. I just keep doing what everyone expects and hoping it'll start to feel right eventually.`,
    },
    {
      label: "Text to an ex",
      text: `Hey. I know it's been a while and you probably don't want to hear from me, but I've been doing a lot of thinking. I'm not trying to get back together or anything, I just wanted to say I'm sorry for how things ended. I wasn't in a good place and I took it out on you. You deserved better. Anyway, I hope you're doing well. You don't have to respond to this.`,
    },
    {
      label: "Dating profile",
      text: `Looking for someone who can keep up with my sarcasm and isn't afraid of deep conversations at 2am. I'm equally comfortable at a dive bar or a museum. Dog dad. Fluent in movie quotes. I've been told I give great advice but never follow my own. Just trying to find my person in this chaos. Don't be boring.`,
    },
    {
      label: "Therapy homework",
      text: `Things that triggered me this week: my mom calling to ask why I haven't visited, my coworker getting promoted (I said congratulations but I felt sick), and my roommate leaving dishes in the sink again even though we've talked about it three times. I notice I shut down instead of saying what I actually feel. I think I'm afraid that if I'm honest people will leave.`,
    },
  ],
  professional: [
    {
      label: "Email to boss",
      text: `Hi Sarah, I wanted to flag something before our 1:1 tomorrow. The Q2 targets we set in January aren't realistic given the team changes — we lost two senior devs and onboarding the new hires has taken longer than expected. I'd like to propose we adjust the timeline by 3 weeks rather than push the team to cut corners. Happy to walk through the revised plan. Let me know your thoughts.`,
    },
    {
      label: "LinkedIn post",
      text: `Thrilled to announce I've joined Acme Corp as VP of Innovation! After 15 incredible years at my previous company, I knew it was time for a new chapter. The team here is world-class, the mission is bold, and I can't wait to help shape the future of enterprise productivity. Grateful for everyone who's been part of my journey. The best is yet to come. #NewBeginnings #Leadership #Innovation`,
    },
    {
      label: "Slack message",
      text: `Hey team — heads up that the deploy pipeline is broken again. I've been looking into it for the last hour and I think it's the same config drift issue from last month that we said we'd fix but never did. I can patch it now but we really need to prioritize the underlying fix this sprint or we'll keep losing half a day every time this happens. Thoughts?`,
    },
    {
      label: "Performance review",
      text: `Alex consistently delivers high-quality work and is a reliable team member. They could benefit from being more proactive in cross-team communication — there have been a few instances where stakeholders were surprised by timeline changes. I'd encourage Alex to share updates earlier and more frequently, even when the news isn't ideal. Overall a strong contributor with room to grow into a leadership role.`,
    },
  ],
};

interface SampleTextsProps {
  mode: AuditMode;
  onSelect: (text: string) => void;
}

export default function SampleTexts({ mode, onSelect }: SampleTextsProps) {
  return (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
        Try a sample
      </p>
      <div className="flex flex-wrap gap-2">
        {SAMPLES[mode].map((sample) => (
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
