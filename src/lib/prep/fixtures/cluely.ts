import type { QuickScreen, TavilyResponse } from "@/lib/prep/types";

// Pre-baked fixture for demo: founder "Roy Lee" + company "Cluely".
// Matches the queries built by buildQueries() so the research feed renders
// realistic per-query counts.

export const CLUELY_QUICK: QuickScreen = {
  searchSummary:
    "Across 6 searches, Roy Lee is a 21-year-old Korean-American founder who built Cluely, an AI real-time assistant for high-stakes professional settings, after being suspended from Columbia for releasing Interview Coder. The company raised a $5.3M seed (April 2025) and a $15M Series A from a16z (June 2025) at a reported $120M post-money. Lee has publicly claimed $7M ARR but later admitted exaggerating revenue numbers in interviews, and the product faces emerging detection tools and a reported ~50% traffic drop.",
  companyOneLiner:
    "Cluely is a real-time AI overlay positioned as a 'cheat on everything' assistant for interviews, exams and sales calls, built by Roy Lee after Columbia suspended him for Interview Coder.",
  founderCredibility: {
    summary:
      "Strong distribution and storytelling instincts but recurring integrity concerns: Columbia suspension, admitted revenue exaggeration, and provocative marketing that wins virality at the cost of trust.",
    signals: [
      "Suspended from Columbia for Interview Coder, used the suspension as launch narrative",
      "Generated 1B+ video views across short-form platforms in under 12 months",
      "Backed by a16z (Series A lead) after a $5.3M seed",
      "Publicly admitted to inflating revenue numbers to TechCrunch",
    ],
    sourceUrls: [
      "https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/",
      "https://www.businessinsider.com/cluely-roy-lee-columbia-interview-coder-2025-4",
    ],
  },
  companyClarity: {
    summary:
      "Product is clear: a desktop overlay that listens, reads the screen, and whispers AI prompts in real time. ICP is intentionally broad ('cheat on everything') which keeps marketing viral but weakens enterprise positioning.",
    isClear: true,
    sourceUrls: ["https://cluely.com"],
  },
  recentMomentum: [
    {
      signal: "$15M Series A led by Andreessen Horowitz at ~$120M post-money",
      date: "June 2025",
      sourceUrls: [
        "https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/",
      ],
    },
    {
      signal: "Hit 1B+ cumulative short-form video views and grew to a 50-person content team",
      date: "Spring 2025",
      sourceUrls: ["https://www.theverge.com/2025/5/15/cluely-viral-marketing"],
    },
    {
      signal: "Reported ~50% web traffic drop after detection tools (Truely, Proctaroo) launched",
      date: "Q4 2025",
      sourceUrls: ["https://similarweb.com/website/cluely.com"],
    },
  ],
  fundingSignal: {
    summary:
      "$20.3M raised across two rounds in three months. Tier-1 institutional validation (a16z) at a 17x post-money on claimed ARR.",
    stage: "Series A",
    knownInvestors: ["Andreessen Horowitz (lead, Series A)", "Susa Ventures", "Abstract Ventures"],
    sourceUrls: ["https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/"],
  },
  marketCategory: {
    summary:
      "AI-augmented real-time productivity / meeting assistance. Sits between consumer 'cheat tools' and enterprise meeting copilots (Granola, Fireflies, Otter, Read).",
    isVentureScalePotential: "Yes if the team can pivot positioning to enterprise sales enablement",
    sourceUrls: [],
  },
  competitors: [
    { name: "Truely", whyRelevant: "Anti-Cluely detection tool launched by Validia in 2025" },
    { name: "Proctaroo", whyRelevant: "Cheating detection platform targeting Cluely directly" },
    { name: "Granola", whyRelevant: "Enterprise meeting copilot with similar real-time prompting" },
    { name: "Fellow", whyRelevant: "Meeting assistant, more enterprise-positioned" },
    { name: "Read AI", whyRelevant: "Meeting intelligence with cleaner brand and enterprise GTM" },
  ],
  reasonsToBeInterested: [
    "a16z backing + $20M raised in 3 months signals institutional conviction",
    "Distribution mastery: 1B+ views, 50-person content engine, organic product-led growth",
    "Real consumer pull — even discounted, $7M ARR in <12 months would be a top-decile outcome",
    "Founder has shown speed, taste in viral marketing, and willingness to ship",
  ],
  redFlagsOrUnknowns: [
    "Founder publicly admitted to exaggerating revenue figures — integrity risk for diligence",
    "Brand positioned around cheating; long-term enterprise expansion path is unclear",
    "Detection tools and platform-level anti-cheat may erode the core wedge",
    "~50% reported traffic drop suggests the viral peak may already be behind it",
    "$120M post on disputed ARR creates a difficult next-round bar",
  ],
  quickVerdict: "maybe",
  theOneQuestion:
    "What does the unaudited monthly net revenue retention look like for the last 6 months — separating consumer trial users from any paying enterprise pilots?",

  meta: {
    round: "Series A",
    valuation: "$120M post",
    sector: "AI productivity",
    founded: "2024",
    competingTermSheets: "Reportedly 3+",
  },
  founderProfile: {
    initials: "RL",
    name: "Roy Lee",
    title: "Co-founder & CEO, Cluely",
    credentials: [
      "Ex-Columbia CS (suspended 2025 for Interview Coder)",
      "Built and shipped 3 viral consumer AI products before age 22",
      "Personally led the content engine that drove 1B+ views",
    ],
    scores: {
      founderMarketFit: 78,
      domainExpertise: 62,
      salesGtm: 84,
      technicalDepth: 70,
      resilience: 88,
    },
  },
  coFounder: {
    initials: "NS",
    name: "Neel Shanmugam",
    title: "Co-founder & CTO",
    credentials: "Ex-Columbia CS, co-built Interview Coder, shipped Cluely v1 in 6 weeks",
    fit: true,
  },
  criticalGap: {
    title: "Revenue credibility",
    note: "Public ARR claims ($7M) contradicted by founder's own admission of exaggeration. Need bank-statement or Stripe-level proof before Series B.",
  },
  verdictLabel: "CONDITIONAL",
  verdictHeadline:
    "Conditional interest — validate revenue and enterprise wedge before any follow-on",
  convictionSummary:
    "Roy Lee is a once-in-a-cycle distribution founder operating in a real category with tier-1 backing, but the brand, the revenue claims, and the detection-tool headwinds make this a high-variance bet. Worth a 60-minute meeting if we can get a clean look at audited revenue, retention by cohort, and the team's plan to migrate from 'cheat tool' to 'enterprise assistant'. Pass on any pro-rata until those three are answered.",
  questionsToAsk: [
    {
      topic: "Revenue",
      question: "Show last 6 months of Stripe gross revenue, refunds, and net MRR by cohort.",
    },
    {
      topic: "Retention",
      question: "What is 90-day paid retention, and how does it differ for trial vs. referred users?",
    },
    {
      topic: "Positioning",
      question: "What is the concrete 12-month plan to migrate brand from 'cheat tool' to enterprise sales assistant?",
    },
    {
      topic: "Defensibility",
      question: "How do you respond to platform-level (Zoom, Google Meet) anti-overlay enforcement?",
    },
    {
      topic: "Governance",
      question: "Who is on the board today, and is there an independent director after the a16z round?",
    },
  ],
  conviction: {
    score: 62,
    categoryScores: {
      team: 74,
      market: 70,
      traction: 58,
      business: 55,
      riskLegal: 42,
    },
    weighting: "Team 30 / Market 25 / Traction 20 / Business 15 / Risk 10",
  },
  market: {
    growthPctYoY: "38%",
    direction: "expanding",
    tam: "$48B",
    sam: "$9B",
    som: "$420M",
    tailwind: "Real-time multimodal models making always-on assistants finally usable",
    headwind: "Platform-level detection and enterprise IT policies blocking overlay tools",
  },
  greenSignals: [
    { label: "a16z lead", text: "Tier-1 institutional lead on Series A at $120M post" },
    { label: "1B+ views", text: "Organic distribution engine no enterprise SaaS can replicate cheaply" },
    { label: "Founder speed", text: "Three shipped consumer AI products before age 22" },
    { label: "Real category", text: "Real-time meeting assistance is a confirmed enterprise budget line" },
  ],
  riskSignals: [
    { label: "Revenue integrity", text: "Founder admitted exaggerating ARR to press", severity: "critical" },
    { label: "Brand ceiling", text: "'Cheat on everything' limits enterprise expansion", severity: "critical" },
    { label: "Detection wave", text: "Truely / Proctaroo and platform anti-overlay measures", severity: "moderate" },
    { label: "Traffic decline", text: "~50% drop suggests viral peak may have passed", severity: "moderate" },
  ],
};

// Tavily-shaped per-query results. Keys match buildQueries() output for
// founder="Roy Lee" company="Cluely" in mode="quick".
export const CLUELY_RESULTS: Record<string, TavilyResponse> = {
  'Roy Lee Cluely founder background': {
    query: "Roy Lee Cluely founder background",
    answer:
      "Roy Lee is the 21-year-old co-founder and CEO of Cluely. He was suspended from Columbia University in 2025 after releasing Interview Coder, then launched Cluely as an AI real-time assistant.",
    results: [
      {
        title: "Columbia suspends student who built AI cheating tool",
        url: "https://www.businessinsider.com/cluely-roy-lee-columbia-interview-coder-2025-4",
        content:
          "Roy Lee, a Columbia computer science student, was suspended in early 2025 after building Interview Coder, an AI tool that helped users pass technical interviews. He used the suspension narrative to launch Cluely weeks later.",
        score: 0.94,
      },
      {
        title: "Meet the 21-year-old behind the viral 'cheat on everything' AI",
        url: "https://www.theverge.com/2025/5/15/cluely-roy-lee-profile",
        content:
          "Lee describes himself as having always shipped consumer products from his dorm room. Cluely is his third launched AI product in 18 months and the first with venture funding.",
        score: 0.9,
      },
      {
        title: "Roy Lee on the controversy and the funding round",
        url: "https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/",
        content:
          "In a TechCrunch interview, Lee defended his marketing strategy and discussed the a16z-led $15M Series A. He later admitted in a follow-up that some revenue numbers shared with reporters were exaggerated.",
        score: 0.92,
      },
    ],
  },
  'Cluely company product news': {
    query: "Cluely company product news",
    answer:
      "Cluely makes a desktop overlay that listens to meetings and reads the user's screen, providing real-time AI suggestions. It is marketed as a 'cheat on everything' tool.",
    results: [
      {
        title: "Cluely launches real-time AI overlay for interviews and meetings",
        url: "https://cluely.com",
        content:
          "Cluely's product is an undetectable desktop overlay that captures audio and screen context to whisper AI-generated responses during interviews, sales calls, and exams.",
        score: 0.96,
      },
      {
        title: "How Cluely's overlay actually works",
        url: "https://www.theverge.com/2025/5/15/cluely-viral-marketing",
        content:
          "Under the hood Cluely combines GPT-5 reasoning with screen OCR and microphone capture. The overlay is positioned to be invisible to Zoom and Google Meet's screen sharing.",
        score: 0.88,
      },
    ],
  },
  'Cluely recent traction signals': {
    query: "Cluely recent traction signals",
    answer:
      "Cluely's marketing has driven 1B+ short-form video views and the founder claims $7M ARR, but third-party traffic data shows a roughly 50% decline in late 2025.",
    results: [
      {
        title: "Cluely traffic falls ~50% as detection tools emerge",
        url: "https://similarweb.com/website/cluely.com",
        content:
          "Similarweb data shows Cluely.com monthly visits falling from a peak in summer 2025 to roughly half by Q4 2025, coinciding with the public launch of Truely and Proctaroo.",
        score: 0.86,
      },
      {
        title: "Cluely's 50-person content team and 1B+ views",
        url: "https://www.theverge.com/2025/5/15/cluely-viral-marketing",
        content:
          "Lee built an in-house content team of more than 50 part-time creators producing daily short-form videos across TikTok, Instagram and YouTube Shorts.",
        score: 0.84,
      },
    ],
  },
  'Cluely funding investors': {
    query: "Cluely funding investors",
    answer:
      "Cluely raised a $5.3M seed in April 2025 and a $15M Series A led by Andreessen Horowitz in June 2025 at a reported $120M post-money valuation.",
    results: [
      {
        title: "a16z leads $15M Series A in Cluely at $120M post",
        url: "https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/",
        content:
          "Andreessen Horowitz led a $15M Series A in Cluely at a $120M post-money valuation. Susa Ventures and Abstract Ventures, both seed investors, participated.",
        score: 0.95,
      },
      {
        title: "Cluely $5.3M seed announcement",
        url: "https://www.businessinsider.com/cluely-seed-round-2025",
        content:
          "Cluely raised a $5.3M seed in April 2025 from Susa Ventures, Abstract Ventures and several angel investors before the a16z-led Series A two months later.",
        score: 0.9,
      },
    ],
  },
  'Cluely red flags controversy': {
    query: "Cluely red flags controversy",
    answer:
      "Roy Lee admitted in a March 2026 interview to exaggerating Cluely's revenue numbers to reporters. The company has also drawn ethical criticism for marketing itself as a cheating tool.",
    results: [
      {
        title: "Cluely founder admits exaggerating revenue numbers",
        url: "https://techcrunch.com/2026/03/12/cluely-revenue-admission/",
        content:
          "Roy Lee admitted in a TechCrunch follow-up that the $7M ARR figure he previously shared was inflated and that real net revenue was 'meaningfully lower'. a16z declined to comment.",
        score: 0.97,
      },
      {
        title: "Universities and enterprises move to block Cluely",
        url: "https://www.wsj.com/articles/cluely-enterprise-bans-2025",
        content:
          "Several Fortune 500 IT teams have begun blocking the Cluely overlay at the endpoint, and university proctoring vendors are integrating Truely's detection signal.",
        score: 0.86,
      },
    ],
  },
  'Cluely market competitors': {
    query: "Cluely market competitors",
    answer:
      "Cluely competes with detection tools (Truely, Proctaroo) and with broader real-time meeting copilots (Granola, Fellow, Read AI, Otter, Fireflies).",
    results: [
      {
        title: "Truely launches as the anti-Cluely",
        url: "https://www.theverge.com/2025/9/3/truely-launch",
        content:
          "Validia launched Truely, a browser and Zoom plugin that detects Cluely-style overlays and flags suspicious latency in candidate responses.",
        score: 0.88,
      },
      {
        title: "Real-time meeting copilots: Granola, Fellow, Read",
        url: "https://www.techcrunch.com/2025/07/granola-series-b",
        content:
          "Granola, Fellow and Read AI each raised significant rounds in 2025 with cleaner enterprise positioning and direct integrations into Zoom, Google Meet and Microsoft Teams.",
        score: 0.82,
      },
    ],
  },
};

// Tolerant matcher: normalize whitespace and case.
export function isCluely(founder: string, company: string): boolean {
  const f = founder.trim().toLowerCase();
  const c = company.trim().toLowerCase();
  return (f === "roy lee" || f === "roy" || f === "") && c === "cluely";
}
