import type { Mode, PillId } from "./types";

export type PlannedQuery = { query: string; pillId: PillId };

export function buildQueries(
  founder: string,
  company: string,
  mode: Mode
): PlannedQuery[] {
  const f = founder.trim();
  const c = company.trim();
  const both = f && c;

  if (mode === "quick") {
    if (both) {
      return [
        { query: `${f} ${c} founder background`, pillId: "founder" },
        { query: `${f} LinkedIn prior companies exit acquisition IPO startup`, pillId: "founder" },
        { query: `${c} startup what does it do product customers`, pillId: "company" },
        { query: `${c} recent news funding product launch hiring`, pillId: "momentum" },
        { query: `${c} funding investors valuation seed series A`, pillId: "funding" },
        { query: `${c} competitors alternatives market category`, pillId: "company" },
        { query: `${f} ${c} controversy lawsuit fraud criticism`, pillId: "redflags" },
      ];
    }
    if (f) {
      return [
        { query: `${f} founder background company`, pillId: "founder" },
        { query: `${f} LinkedIn prior companies exit acquisition IPO startup`, pillId: "founder" },
        { query: `${f} recent interview podcast profile`, pillId: "momentum" },
        { query: `${f} funding startup investors`, pillId: "funding" },
        { query: `${f} controversy lawsuit fraud criticism`, pillId: "redflags" },
      ];
    }
    return [
      { query: `${c} founder CEO background`, pillId: "founder" },
      { query: `${c} startup what does it do product customers`, pillId: "company" },
      { query: `${c} recent news funding product launch hiring`, pillId: "momentum" },
      { query: `${c} funding investors valuation seed series A`, pillId: "funding" },
      { query: `${c} competitors alternatives market category`, pillId: "company" },
      { query: `${c} controversy lawsuit fraud criticism`, pillId: "redflags" },
    ];
  }

  // deep
  if (both) {
    return [
      { query: `${f} ${c} founding team cofounders`, pillId: "founder" },
      { query: `${f} prior startup exit acquisition IPO`, pillId: "founder" },
      { query: `${f} patents publications GitHub Google Scholar`, pillId: "founder" },
      { query: `${f} Twitter X LinkedIn blog Substack podcast`, pillId: "founder" },
      { query: `${c} customers case study reviews G2 Product Hunt`, pillId: "company" },
      { query: `${c} revenue ARR growth traction metrics`, pillId: "momentum" },
      { query: `${c} partnerships enterprise customers`, pillId: "momentum" },
      { query: `${c} hiring jobs headcount growth`, pillId: "momentum" },
      { query: `${c} TAM market size CAGR 2025 2026`, pillId: "company" },
      { query: `${c} enterprise spend adoption trends`, pillId: "company" },
      { query: `${c} SAM SOM market opportunity`, pillId: "company" },
      { query: `${c} competitors alternatives`, pillId: "company" },
      { query: `${c} startups funding competitors`, pillId: "funding" },
      { query: `${c} funding valuation investors`, pillId: "funding" },
      { query: `${c} seed series A funding valuation benchmarks`, pillId: "funding" },
      { query: `${c} similar companies funding valuation`, pillId: "funding" },
      { query: `${c} pricing plans business model`, pillId: "company" },
      { query: `${c} lawsuit controversy complaints`, pillId: "redflags" },
      { query: `${f} lawsuit controversy fraud criticism`, pillId: "redflags" },
      { query: `${c} security breach data privacy compliance layoffs shutdown`, pillId: "redflags" },
    ];
  }
  if (f) {
    return [
      { query: `${f} founder background biography`, pillId: "founder" },
      { query: `${f} prior startup companies exit acquisition IPO`, pillId: "founder" },
      { query: `${f} patents publications GitHub Google Scholar`, pillId: "founder" },
      { query: `${f} Twitter X LinkedIn blog Substack podcast thought leadership`, pillId: "founder" },
      { query: `${f} recent interview profile feature`, pillId: "momentum" },
      { query: `${f} current company startup role`, pillId: "company" },
      { query: `${f} funding investors raised`, pillId: "funding" },
      { query: `${f} associated companies advisor board`, pillId: "funding" },
      { query: `${f} lawsuit controversy fraud criticism`, pillId: "redflags" },
      { query: `${f} reputation peer reviews`, pillId: "redflags" },
    ];
  }
  return [
    { query: `${c} founder CEO team cofounders background`, pillId: "founder" },
    { query: `${c} what does it do product description`, pillId: "company" },
    { query: `${c} customers case study reviews G2 Product Hunt`, pillId: "company" },
    { query: `${c} revenue ARR growth traction metrics`, pillId: "momentum" },
    { query: `${c} hiring jobs headcount growth`, pillId: "momentum" },
    { query: `${c} partnerships enterprise customers`, pillId: "momentum" },
    { query: `${c} TAM SAM SOM market size CAGR`, pillId: "company" },
    { query: `${c} competitors alternatives`, pillId: "company" },
    { query: `${c} funding valuation investors seed series A`, pillId: "funding" },
    { query: `${c} pricing plans business model`, pillId: "company" },
    { query: `${c} lawsuit controversy complaints layoffs breach`, pillId: "redflags" },
  ];
}
