import type { DeepBrief } from "@/lib/prep/types";

export const CLUELY_DEEP: DeepBrief = {
  searchSummary:
    "Across 20 searches, Roy Lee (21) co-founded Cluely with Neel Shanmugam after both were suspended from Columbia for Interview Coder. The company raised $5.3M seed (Apr 2025) and a $15M Series A from a16z (Jun 2025) at a reported $120M post-money. Cluely is a real-time AI desktop overlay marketed as 'cheat on everything'. Lee publicly claimed $7M ARR but later admitted exaggerating to TechCrunch. Detection tools (Truely, Proctaroo) and a ~50% web traffic decline in Q4 2025 are emerging headwinds.",
  executiveSummary: {
    summary:
      "Cluely is a high-variance Series A bet: world-class distribution and tier-1 institutional backing offset by serious revenue-credibility issues, an enterprise-hostile brand, and an active detection-tools wave eroding the wedge.",
    investmentView:
      "Conditional interest. Worth a 60-minute meeting if we can validate audited revenue, retention by cohort, and a credible enterprise-positioning plan. Pass on pro-rata until those three are answered.",
    whyNow:
      "Frontier multimodal models have finally made always-on AI assistants useful in real time, and enterprise budgets for meeting copilots are now a confirmed line item across mid-market and F500.",
  },
  founderMarketFit: {
    summary:
      "Roy Lee is a once-in-a-cycle distribution founder for a consumer-AI category but is a weak fit for enterprise sales motions the company will eventually need.",
    strengths: [
      "Generated 1B+ short-form views in under 12 months with a 50-person content org",
      "Shipped 3 consumer AI products before age 22",
      "Built and defended a viral narrative through the Columbia suspension",
    ],
    concerns: [
      "Admitted exaggerating revenue numbers in press interviews",
      "No prior enterprise SaaS experience",
      "Brand and personal positioning may block F500 procurement",
    ],
    sourceUrls: [
      "https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/",
      "https://www.businessinsider.com/cluely-roy-lee-columbia-interview-coder-2025-4",
    ],
  },
  foundingTeam: {
    summary:
      "Two-person founding team out of Columbia CS; both shipped Interview Coder and Cluely v1 in under 6 weeks. Lean ops org, heavy creator-led GTM.",
    knownTeamMembers: [
      { name: "Roy Lee", role: "Co-founder & CEO", background: "Ex-Columbia CS (suspended 2025). Built Interview Coder. Runs content engine." },
      { name: "Neel Shanmugam", role: "Co-founder & CTO", background: "Ex-Columbia CS. Co-built Interview Coder. Shipped Cluely v1 in 6 weeks." },
    ],
    teamGaps: [
      "No head of enterprise sales",
      "No head of security / compliance — critical for any F500 GTM",
      "No experienced finance lead to formalize revenue reporting",
    ],
    sourceUrls: ["https://www.linkedin.com/in/roylee-cluely"],
  },
  publishedMaterialAndSocialPresence: {
    summary:
      "Lee runs one of the strongest founder-led content engines in consumer AI. Cluely's TikTok / IG / YT Shorts presence is the company's true moat today.",
    notableMaterials: [
      { type: "Profile", title: "The 21-year-old behind the viral 'cheat on everything' AI", whyItMatters: "Defines the Cluely brand for the press", url: "https://www.theverge.com/2025/5/15/cluely-roy-lee-profile" },
      { type: "Article", title: "a16z leads $15M Series A in Cluely", whyItMatters: "Tier-1 validation at $120M post-money", url: "https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/" },
      { type: "Follow-up", title: "Cluely founder admits exaggerating revenue", whyItMatters: "Material to revenue diligence", url: "https://techcrunch.com/2026/03/12/cluely-revenue-admission/" },
    ],
  },
  companySnapshot: {
    whatTheyDo: "An undetectable desktop overlay that listens to meetings and reads the screen, whispering AI-generated responses in real time.",
    customer: "Consumers (job seekers, students), with a stated push toward sales reps and enterprise meeting copilots.",
    problem: "People want real-time AI help during high-stakes meetings, interviews, and calls without revealing they're using it.",
    product: "Cross-platform overlay combining frontier LLMs with screen OCR and microphone capture, positioned to evade Zoom and Google Meet screen-share capture.",
    sourceUrls: ["https://cluely.com"],
  },
  tractionValidation: {
    summary:
      "Reported $7M ARR (disputed by founder); 1B+ cumulative video views; 50-person content team; ~50% traffic drop in Q4 2025 after detection tools launched.",
    signals: [
      { signal: "Reported ARR", evidence: "$7M ARR claimed publicly, later admitted to be inflated", confidence: "low", sourceUrls: ["https://techcrunch.com/2026/03/12/cluely-revenue-admission/"] },
      { signal: "Distribution", evidence: "1B+ cumulative short-form views across TikTok/IG/YT", confidence: "high", sourceUrls: ["https://www.theverge.com/2025/5/15/cluely-viral-marketing"] },
      { signal: "Traffic", evidence: "~50% decline in monthly visits between summer and Q4 2025", confidence: "medium", sourceUrls: ["https://similarweb.com/website/cluely.com"] },
    ],
  },
  marketSizing: {
    tam: "$48B (global real-time productivity / meeting assistance)",
    sam: "$9B (English-speaking knowledge worker base with Zoom/Meet/Teams)",
    som: "$420M (early-adopter consumer + SMB sales rep segment)",
    marketGrowth: "~38% YoY, expanding with multimodal model rollout",
    isVentureScale: "Yes if Cluely pivots positioning from 'cheat tool' toward enterprise sales enablement.",
    sourceUrls: [],
  },
  competitorLandscape: {
    summary:
      "Two competitor classes: anti-Cluely detection tools targeting the wedge directly, and well-funded enterprise meeting copilots with cleaner brands.",
    competitors: [
      { name: "Truely", category: "Detection", funding: "Seed (Validia)", whyRelevant: "Anti-Cluely detection plugin for Zoom and browsers" },
      { name: "Proctaroo", category: "Detection", funding: "Bootstrapped", whyRelevant: "Cheating-detection platform targeting Cluely directly" },
      { name: "Granola", category: "Meeting copilot", funding: "Series B 2025", whyRelevant: "Enterprise meeting copilot with real-time prompting" },
      { name: "Read AI", category: "Meeting intelligence", funding: "Series B", whyRelevant: "Meeting intelligence with clean brand and enterprise GTM" },
      { name: "Fellow", category: "Meeting assistant", funding: "Series A", whyRelevant: "Enterprise-positioned meeting assistant" },
    ],
    differentiation: "Truly real-time, screen-aware overlay with consumer-grade UX and unmatched organic distribution.",
    moatPotential: "Distribution and brand recognition with the under-25 segment; technical moat is weak as platforms add anti-overlay enforcement.",
  },
  fundingBenchmark: {
    companyFunding: "$5.3M seed (Apr 2025) + $15M Series A from a16z at $120M post (Jun 2025). Total raised: $20.3M.",
    benchmarkAgainstSimilarCompanies: "Granola Series B at ~$250M post on $4M+ ARR; Read AI Series B at ~$200M post. Cluely is priced as a top-decile consumer-AI Series A.",
    valuationSignal: "$120M post on disputed $7M ARR implies ~17x; if true ARR is closer to $3–4M, multiple jumps to 30–40x — a tough next-round bar.",
    sourceUrls: ["https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/"],
  },
  businessModel: {
    summary:
      "Self-serve consumer subscription with a freemium tier; experimenting with sales-rep packages. No formal enterprise motion yet.",
    pricingModel: "Subscription ($20–$30/mo consumer; team tier in private beta).",
    likelyBuyer: "Individual consumer today; sales rep / SMB sales leader tomorrow.",
    salesMotion: "PLG / creator-led inbound. No outbound sales team.",
    scalabilityConcern: "Brand and product positioning materially limit enterprise procurement and security review.",
  },
  risksAndRedFlags: [
    { risk: "Founder admitted exaggerating revenue figures", severity: "high", whyItMatters: "Direct integrity signal; affects every downstream diligence number", sourceUrls: ["https://techcrunch.com/2026/03/12/cluely-revenue-admission/"] },
    { risk: "Brand built around cheating", severity: "high", whyItMatters: "Caps enterprise TAM and creates procurement and PR risk", sourceUrls: ["https://www.theverge.com/2025/5/15/cluely-viral-marketing"] },
    { risk: "Detection tools and platform enforcement", severity: "medium", whyItMatters: "Truely, Proctaroo, and Zoom/Meet anti-overlay measures erode the wedge", sourceUrls: ["https://www.theverge.com/2025/9/3/truely-launch"] },
    { risk: "~50% traffic decline since summer 2025", severity: "medium", whyItMatters: "Suggests viral peak has passed and retention is unproven", sourceUrls: ["https://similarweb.com/website/cluely.com"] },
    { risk: "$120M post on disputed revenue", severity: "medium", whyItMatters: "Creates a difficult next-round bar even if execution is strong", sourceUrls: ["https://techcrunch.com/2025/06/20/a16z-leads-15m-series-a-in-cluely/"] },
  ],
  diligenceQuestions: [
    { question: "Provide 6 months of Stripe gross revenue, refunds, and net MRR by cohort.", whyAsk: "Validate true ARR after the public admission of exaggeration." },
    { question: "What is 90-day paid retention split by trial vs. referred users?", whyAsk: "Tests whether the viral acquisition produces durable revenue." },
    { question: "What is the 12-month plan to migrate brand from 'cheat tool' to enterprise sales assistant?", whyAsk: "Required to unlock enterprise TAM and survive procurement." },
    { question: "How do you respond to platform-level (Zoom, Google Meet) anti-overlay enforcement?", whyAsk: "Tests defensibility of the core wedge." },
    { question: "Who is on the board and is there an independent director after the a16z round?", whyAsk: "Governance hygiene given the integrity flag." },
    { question: "What is the security and compliance posture (SOC 2, data retention, on-device vs. cloud)?", whyAsk: "Required for any F500 conversation." },
  ],
  investmentView: {
    recommendation: "Conditional — meet once",
    reasoning:
      "Distribution this strong, backed by a16z, in a real and expanding category, deserves a serious meeting. But revenue credibility, brand ceiling, and detection-tool headwinds together justify a high bar before any capital commitment.",
    topReasonsToInvest: [
      "a16z lead at Series A signals tier-1 institutional conviction",
      "1B+ views and a 50-person content org create a distribution moat no enterprise SaaS can replicate cheaply",
      "Real-time AI meeting assistance is a confirmed enterprise budget line",
      "Founder speed and taste in shipping viral consumer AI is genuinely rare",
    ],
    topReasonsToPause: [
      "Founder publicly admitted exaggerating revenue — material integrity flag",
      "'Cheat on everything' brand limits enterprise expansion",
      "Detection tools and platform enforcement are actively eroding the wedge",
      "~50% traffic decline suggests the viral peak may have passed",
      "$120M post on disputed ARR creates a difficult next-round bar",
    ],
  },
};
