export type Mode = "quick" | "deep";

export type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

export type TavilyResponse = {
  query: string;
  answer?: string;
  results: TavilyResult[];
};

export type FeedItem = {
  id: string;
  query: string;
  status: "pending" | "searching" | "done" | "failed";
  resultCount?: number;
  error?: string;
  pillId?: string;
};

export type PillId =
  | "founder"
  | "company"
  | "momentum"
  | "funding"
  | "redflags"
  | "brief";

export type QuickScreen = {
  companyOneLiner: string;
  founderCredibility: { summary: string; signals: string[]; sourceUrls: string[] };
  companyClarity: { summary: string; isClear: boolean; sourceUrls: string[] };
  recentMomentum: { signal: string; date: string; sourceUrls: string[] }[];
  fundingSignal: { summary: string; stage: string; knownInvestors: string[]; sourceUrls: string[] };
  marketCategory: { summary: string; isVentureScalePotential: string; sourceUrls: string[] };
  competitors: { name: string; whyRelevant: string }[];
  reasonsToBeInterested: string[];
  redFlagsOrUnknowns: string[];
  quickVerdict: "interesting" | "maybe" | "pass" | "unclear" | string;
  theOneQuestion: string;
};

export type DeepBrief = {
  executiveSummary: { summary: string; investmentView: string; whyNow: string };
  founderMarketFit: { summary: string; strengths: string[]; concerns: string[]; sourceUrls: string[] };
  foundingTeam: {
    summary: string;
    knownTeamMembers: { name: string; role: string; background: string }[];
    teamGaps: string[];
    sourceUrls: string[];
  };
  publishedMaterialAndSocialPresence: {
    summary: string;
    notableMaterials: { type: string; title: string; whyItMatters: string; url: string }[];
  };
  companySnapshot: { whatTheyDo: string; customer: string; problem: string; product: string; sourceUrls: string[] };
  tractionValidation: {
    summary: string;
    signals: { signal: string; evidence: string; confidence: string; sourceUrls: string[] }[];
  };
  marketSizing: { tam: string; sam: string; som: string; marketGrowth: string; isVentureScale: string; sourceUrls: string[] };
  competitorLandscape: {
    summary: string;
    competitors: { name: string; category: string; funding: string; whyRelevant: string }[];
    differentiation: string;
    moatPotential: string;
  };
  fundingBenchmark: {
    companyFunding: string;
    benchmarkAgainstSimilarCompanies: string;
    valuationSignal: string;
    sourceUrls: string[];
  };
  businessModel: {
    summary: string;
    pricingModel: string;
    likelyBuyer: string;
    salesMotion: string;
    scalabilityConcern: string;
  };
  risksAndRedFlags: { risk: string; severity: string; whyItMatters: string; sourceUrls: string[] }[];
  diligenceQuestions: { question: string; whyAsk: string }[];
  investmentView: {
    recommendation: string;
    reasoning: string;
    topReasonsToInvest: string[];
    topReasonsToPause: string[];
  };
};
