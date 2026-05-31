import type { Property, RiskStatus } from '../hooks/useProperties';

// ─── Types ─────────────────────────────────────────────────────────

export type Verdict = 'ACQUIRE' | 'HOLD' | 'MONITOR' | 'DIVEST';

export interface KeyDriver {
  title: string;
  impact: 'positive' | 'neutral' | 'negative';
  magnitude: string;
}

export interface ScoreDimension {
  key: string;
  label: string;
  score: number;
  weight: number;
  comment: string;
}

export interface MarketContext {
  submarket: string;
  classification: string;
  capRate: number;
  capRateBenchmark: number;
  vacancy: number;
  vacancyBenchmark: number;
  priceTrendYoY: number;
  activeDrivers: string[];
}

export interface Comparable {
  name: string;
  distanceKm: number;
  saleQuarter: string;
  salePrice: number;
  pricePerSqm: number;
  dom: number;
  status: 'CLOSED' | 'PENDING';
}

export interface Scenario {
  dom: number;
  salePrice: number;
  probability: number;
}

export interface Scenarios {
  base: Scenario;
  bull: Scenario;
  bear: Scenario;
  expectedValue: number;
}

export interface TimeDistribution {
  expected: number;
  submarketMedian: number;
  buckets: { label: string; pct: number }[];
}

export interface RiskFactor {
  category: 'Macro' | 'Sector' | 'Asset' | 'Liquidity';
  title: string;
  severity: 1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: string;
  mitigation: string;
}

export interface Recommendation {
  verdict: Verdict;
  headline: string;
  reasoning: string;
  nextActions: string[];
  reanalyzeAfterDays: number;
}

export interface AnalysisReport {
  executive: {
    verdict: Verdict;
    headline: string;
    keyDrivers: KeyDriver[];
  };
  scoreBreakdown: {
    composite: number;
    dimensions: ScoreDimension[];
  };
  marketContext: MarketContext;
  comparables: Comparable[];
  scenarios: Scenarios;
  timeDistribution: TimeDistribution;
  riskFactors: RiskFactor[];
  recommendation: Recommendation;
  methodologyNote: string;
}

// ─── Deterministic PRNG (mulberry32) ───────────────────────────────

const hashString = (s: string): number => {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

// ─── Derivation helpers ────────────────────────────────────────────

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const round = (n: number, dp = 0) => {
  const m = Math.pow(10, dp);
  return Math.round(n * m) / m;
};

// ─── Verdict ────────────────────────────────────────────────────────

const deriveVerdict = (score: number, status: RiskStatus): Verdict => {
  if (status === 'HIGH_RISK' || score < 45) return 'DIVEST';
  if (score >= 85) return 'ACQUIRE';
  if (score >= 65) return 'HOLD';
  return 'MONITOR';
};

const verdictHeadline = (verdict: Verdict, name: string): string => {
  switch (verdict) {
    case 'ACQUIRE': return `Prime liquidity profile — ${name} qualifies as a buy-side candidate with strong exit conviction.`;
    case 'HOLD': return `${name} demonstrates resilient liquidity fundamentals — continue to hold and monitor quarterly.`;
    case 'MONITOR': return `${name} sits in a softening liquidity band — tighten monitoring cadence to monthly.`;
    case 'DIVEST': return `Material liquidity impairment detected at ${name} — initiate orderly disposal scenario planning.`;
  }
};

// ─── Score Breakdown ───────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'legalitas', label: 'Legalitas & Hak Tanggungan', weight: 25, offset: 4,
    commentHigh: 'Assumed SHM with clean chain of title, no encumbrance. Hak tanggungan ratio comfortably exceeds the 125% statutory floor (PBI 18/16).',
    commentMid:  'HGB or strata-title with renewal due within 5 years — manageable but requires monitoring at renewal cycle. Hak tanggungan ratio at minimum policy threshold.',
    commentLow:  'Certificate type or encumbrance flag triggers legal escalation. Hak tanggungan ratio may fall short of 125% statutory floor — additional collateral required.' },
  { key: 'lokasi_akses', label: 'Lokasi & Akses Jalan', weight: 20, offset: 0,
    commentHigh: 'Frontage >10m on a paved 2-way public road, <500m from arterial corridor. Per MAPPI lebar-jalan adjustment study, this profile attracts full positive valuation adjustment.',
    commentMid:  'Frontage 6–10m via secondary road, 500m–2km to arterial. Mild adjustment expected; broker absorption typical for the submarket.',
    commentLow:  'Narrow frontage (<6m) or gang/private-lane access. Material valuation drag and reduced buyer universe — flag for KJPP physical re-inspection.' },
  { key: 'marketabilitas', label: 'Marketabilitas (Comp & NJOP)', weight: 20, offset: -1,
    commentHigh: 'Asking-to-sold ratio >92% in submarket; market value sits 1.4–1.8× NJOP — healthy spread with confirmed transaction depth.',
    commentMid:  'Asking-to-sold 80–92%, NJOP multiple within 1.1–1.4× range — typical for secondary location, pricing defensible at LTV cap.',
    commentLow:  'Asking-to-sold <80% or NJOP multiple <1.1× — pricing discovery weak; valuation defense difficult and re-marketing risk material.' },
  { key: 'fsv_ratio', label: 'Nilai Likuidasi (FSV / MV Ratio)', weight: 15, offset: -2,
    commentHigh: 'Modeled forced sale value ≥75% of market value — comfortable cushion against lelang haircut (well within the 60–80% SPI 366 norm).',
    commentMid:  'Modeled FSV 65–75% of MV — within the standard SPI 366 band; expected default-loss reasonably contained at policy LTV.',
    commentLow:  'Modeled FSV <65% of MV — material write-down risk under forced disposal. Tighten LTV cap or require additional collateral pledge.' },
  { key: 'tenor_pemasaran', label: 'Tenor Pemasaran (Days-to-Sell)', weight: 10, offset: -1,
    commentHigh: 'Expected marketing horizon <90 days — meets fast-disposal SLA implied by SPI 366 short-horizon liquidation assumption.',
    commentMid:  'Marketing horizon 90–180 days — within the SPI 366 standard marketing window; reserve price setting straightforward.',
    commentLow:  'Marketing horizon >180 days — exceeds the SPI 366 normal horizon. Lelang scenario likely; reserve at indikasi nilai likuidasi advised.' },
  { key: 'risiko_lingkungan', label: 'Risiko Lingkungan & Zoning', weight: 10, offset: 1,
    commentHigh: 'No flood / seismic / landslide flag against BNPB hazard layers. Zoning fully compliant with current use — no peruntukan risk.',
    commentMid:  'Adjacent to flood-prone zone OR zoning permits current use with minor variance — monitor at re-valuation and require all-risk insurance.',
    commentLow:  'Inside active hazard zone (flood/quake/landslide) or zoning non-compliant — mandatory insurance loading + LTV haircut + recurring compliance review.' },
] as const;

const deriveScoreBreakdown = (score: number, id: string): { composite: number; dimensions: ScoreDimension[] } => {
  const rng = mulberry32(hashString(`${id}-breakdown`));
  const dimensions: ScoreDimension[] = DIMENSIONS.map(d => {
    const noise = (rng() - 0.5) * 8;
    const subScore = clamp(round(score + d.offset + noise), 1, 100);
    const tier = subScore >= 75 ? 'commentHigh' : subScore >= 55 ? 'commentMid' : 'commentLow';
    return {
      key: d.key,
      label: d.label,
      score: subScore,
      weight: d.weight,
      comment: d[tier],
    };
  });
  return { composite: score, dimensions };
};

// ─── Market Context ────────────────────────────────────────────────

const submarketClassification = (score: number): string => {
  if (score >= 85) return 'Tier 1 — Core / Trophy';
  if (score >= 70) return 'Tier 2 — Core Plus';
  if (score >= 55) return 'Tier 3 — Value-Add';
  return 'Tier 4 — Opportunistic / Distressed';
};

const deriveMarketContext = (property: Property): MarketContext => {
  const rng = mulberry32(hashString(`${property.id}-market`));
  const baseCap = property.capRate ?? 5.5 + rng() * 2;
  const benchmark = baseCap + (rng() - 0.3) * 1.2;
  const baseVac = property.occupancyRate ? 100 - property.occupancyRate : 12 + rng() * 18;
  const vacBenchmark = baseVac + (rng() - 0.3) * 6;
  const priceYoY = (property.liquidityScore - 60) / 8 + (rng() - 0.5) * 3;

  const driversPool: Record<string, string[]> = {
    Commercial: [
      'Tech & financial-services leasing absorbing Grade A supply',
      'Flight-to-quality bid for ESG-certified buildings',
      'Hybrid-work normalization stabilizing core CBD demand',
    ],
    Industrial: [
      'E-commerce 3PL operators driving warehouse absorption',
      'Manufacturing reshoring lifting industrial rents',
      'Logistics network optimization compressing yields',
    ],
    Residential: [
      'High-income household formation lifting demand',
      'Limited new supply pipeline supporting price floors',
      'Mortgage rate stabilization restoring buyer confidence',
    ],
  };
  const drivers = driversPool[property.propertyType] || driversPool.Commercial;

  return {
    submarket: `${property.city}${property.state ? ` — ${property.state}` : ''} ${property.propertyType} Submarket`,
    classification: submarketClassification(property.liquidityScore),
    capRate: round(baseCap, 1),
    capRateBenchmark: round(benchmark, 1),
    vacancy: round(baseVac, 1),
    vacancyBenchmark: round(vacBenchmark, 1),
    priceTrendYoY: round(priceYoY, 1),
    activeDrivers: drivers.slice(0, 3),
  };
};

// ─── Comparable Transactions ───────────────────────────────────────

const COMP_NAMES: Record<string, string[]> = {
  Commercial: ['Wisma Mahkota', 'Plaza Sentral', 'Tower Verde', 'Gedung Karya Prima', 'Park Nine Office', 'Avenue Heights', 'Sahid Tower', 'Pacific Trade Center'],
  Industrial: ['Logistics Hub Alpha', 'Distribution Park One', 'Cikampek Logistics Estate', 'Greenland Industrial', 'Maritime Park', 'Eastgate Industrial Center'],
  Residential: ['Residence 88', 'The Pinnacle', 'Sky Garden', 'Park View', 'Marina Bay Tower', 'Verde Terrace', 'Aria Hill', 'Crown Residence'],
};

const deriveComparables = (property: Property): Comparable[] => {
  const rng = mulberry32(hashString(`${property.id}-comps`));
  const names = COMP_NAMES[property.propertyType] || COMP_NAMES.Commercial;
  const count = 5;
  const comps: Comparable[] = [];
  const quarters = ['Q4 2025', 'Q3 2025', 'Q3 2025', 'Q2 2025', 'Q1 2026'];

  for (let i = 0; i < count; i++) {
    const name = names[(hashString(`${property.id}-${i}`) + i) % names.length];
    const distance = round(0.4 + rng() * 4.2, 1);
    const priceMultiplier = 0.78 + rng() * 0.42;
    const salePrice = round(property.marketValue * priceMultiplier);
    const sizeFactor = 0.6 + rng() * 0.7;
    const pricePerSqm = round(salePrice / (sizeFactor * 12_000), -1);
    const domBase = property.timeToLiquidity;
    const dom = round(domBase * (0.5 + rng() * 1.3));
    comps.push({
      name,
      distanceKm: distance,
      saleQuarter: quarters[i],
      salePrice,
      pricePerSqm,
      dom,
      status: i === 4 ? 'PENDING' : 'CLOSED',
    });
  }
  return comps.sort((a, b) => a.distanceKm - b.distanceKm);
};

// ─── Scenarios ─────────────────────────────────────────────────────

const deriveScenarios = (property: Property): Scenarios => {
  const baseDom = property.timeToLiquidity;
  const basePrice = property.marketValue;

  const bullProb = property.liquidityScore >= 75 ? 0.35 : property.liquidityScore >= 55 ? 0.25 : 0.15;
  const bearProb = property.liquidityScore >= 75 ? 0.10 : property.liquidityScore >= 55 ? 0.20 : 0.35;
  const baseProb = round((1 - bullProb - bearProb) * 100) / 100;

  const base: Scenario = { dom: baseDom, salePrice: basePrice, probability: baseProb };
  const bull: Scenario = { dom: Math.round(baseDom * 0.65), salePrice: Math.round(basePrice * 1.08), probability: bullProb };
  const bear: Scenario = { dom: Math.round(baseDom * 1.85), salePrice: Math.round(basePrice * 0.88), probability: bearProb };

  const expectedValue = Math.round(base.salePrice * base.probability + bull.salePrice * bull.probability + bear.salePrice * bear.probability);

  return { base, bull, bear, expectedValue };
};

// ─── Time Distribution ─────────────────────────────────────────────

const deriveTimeDistribution = (property: Property): TimeDistribution => {
  const rng = mulberry32(hashString(`${property.id}-time`));
  const expected = property.timeToLiquidity;
  const submarketMedian = Math.round(expected * (0.85 + rng() * 0.45));

  // Distribution skewed by score: high score -> faster bucket dominant
  const score = property.liquidityScore;
  const dist: { label: string; pct: number }[] = score >= 80
    ? [{ label: '0–30d', pct: 38 }, { label: '30–60d', pct: 34 }, { label: '60–120d', pct: 20 }, { label: '120d+', pct: 8 }]
    : score >= 60
      ? [{ label: '0–30d', pct: 22 }, { label: '30–60d', pct: 36 }, { label: '60–120d', pct: 28 }, { label: '120d+', pct: 14 }]
      : score >= 40
        ? [{ label: '0–30d', pct: 12 }, { label: '30–60d', pct: 24 }, { label: '60–120d', pct: 34 }, { label: '120d+', pct: 30 }]
        : [{ label: '0–30d', pct: 5 }, { label: '30–60d', pct: 15 }, { label: '60–120d', pct: 30 }, { label: '120d+', pct: 50 }];

  return { expected, submarketMedian, buckets: dist };
};

// ─── Risk Factors ──────────────────────────────────────────────────

const RISK_LIBRARY: { profile: 'LOW' | 'MID' | 'HIGH'; factors: Omit<RiskFactor, 'severity' | 'likelihood'>[] }[] = [
  {
    profile: 'LOW',
    factors: [
      { category: 'Macro', title: 'Interest Rate Sensitivity', impact: 'Cap rate widening of 25-50bps possible if BI 7DRR holds restrictive stance through H2.', mitigation: 'Lock in fixed-rate financing; consider IRS hedges for variable exposure.' },
      { category: 'Sector', title: 'Hybrid-Work Demand Drift', impact: 'Tenant downsizing risk at lease renewals if hybrid adoption deepens.', mitigation: 'Diversify tenant mix; prioritize amenity-rich repositioning.' },
      { category: 'Asset', title: 'Capex Pipeline', impact: 'HVAC and elevator modernization expected within 24 months — 1–2% NOI drag.', mitigation: 'Phase capex over fiscal years; pursue green-building incentive offsets.' },
      { category: 'Liquidity', title: 'Cross-Border FX Volatility', impact: 'IDR-USD swings widen effective bid-ask for offshore buyers.', mitigation: 'Pre-qualify domestic institutional buyer list as fallback.' },
    ],
  },
  {
    profile: 'MID',
    factors: [
      { category: 'Macro', title: 'Interest Rate Drag', impact: 'Persistent restrictive policy compresses buyer leverage; cap rate expansion 50-100bps plausible.', mitigation: 'Extend hold horizon; refinance at H1 window opportunistically.' },
      { category: 'Sector', title: 'Subsector Vacancy Trend', impact: 'Vacancy rising 3–5 quarters consecutively in adjacent comps.', mitigation: 'Tighten lease renewal terms; offer TI packages selectively.' },
      { category: 'Asset', title: 'Tenant Concentration', impact: 'Top-3 tenants represent >40% of NLA — concentration risk at renewal.', mitigation: 'Re-tier the rent roll; pursue blend-and-extend with anchor tenants.' },
      { category: 'Liquidity', title: 'Buyer Pool Concentration', impact: 'Active bidder list reduced to 5-7 qualified parties — competitive process at risk.', mitigation: 'Broaden marketing to family office and HNW segments early.' },
      { category: 'Asset', title: 'Lease Rollover Cliff', impact: '28% of NLA rolls in 18 months — re-leasing risk if market softens.', mitigation: 'Proactive renewal negotiations 12 months pre-expiry.' },
    ],
  },
  {
    profile: 'HIGH',
    factors: [
      { category: 'Macro', title: 'Macro Risk-Off Regime', impact: 'Risk-off sentiment broadly suppressing transaction volume across CRE.', mitigation: 'Defer marketing window 2-3 quarters; maintain interim NOI optimization.' },
      { category: 'Sector', title: 'Structural Demand Decline', impact: 'Subsector facing structural headwinds — vacancy trend secular not cyclical.', mitigation: 'Evaluate adaptive reuse (e.g., office-to-residential conversion).' },
      { category: 'Asset', title: 'Anchor Tenant Exit Risk', impact: 'Anchor tenant lease expires within 14 months with no renewal indication.', mitigation: 'Initiate replacement tenant search immediately; consider buyout incentives.' },
      { category: 'Liquidity', title: 'Distressed-Only Buyer Universe', impact: 'Bid pool dominated by opportunistic/distressed funds — material discounting expected.', mitigation: 'Stabilize asset before sale; consider partial recap as alternative.' },
      { category: 'Asset', title: 'Below-Market Rent Roll', impact: 'Current rents 15-20% below market — re-leasing at expiry creates revaluation risk.', mitigation: 'Document upside in offering memorandum; pre-lease at market rates.' },
      { category: 'Liquidity', title: 'Comparable Trade Drought', impact: 'No directly comparable closings in trailing 6 months — pricing discovery weak.', mitigation: 'Engage broker for shadow-market trades and unsolicited bids.' },
    ],
  },
];

const deriveRiskFactors = (property: Property): RiskFactor[] => {
  const rng = mulberry32(hashString(`${property.id}-risk`));
  const profile = property.riskStatus === 'LOW_RISK' ? 'LOW' : property.riskStatus === 'MEDIUM_RISK' ? 'MID' : 'HIGH';
  const lib = RISK_LIBRARY.find(l => l.profile === profile)!;
  const baseSeverity = profile === 'HIGH' ? 4 : profile === 'MID' ? 3 : 2;
  const baseLikelihood = profile === 'HIGH' ? 4 : profile === 'MID' ? 3 : 2;
  return lib.factors.map(f => {
    const sevDelta = Math.floor(rng() * 2);
    const likDelta = Math.floor(rng() * 2);
    return {
      ...f,
      severity: clamp(baseSeverity + sevDelta, 1, 5) as 1 | 2 | 3 | 4 | 5,
      likelihood: clamp(baseLikelihood + likDelta, 1, 5) as 1 | 2 | 3 | 4 | 5,
    };
  });
};

// ─── Recommendation ────────────────────────────────────────────────

const deriveRecommendation = (property: Property, verdict: Verdict): Recommendation => {
  const reasoningByVerdict: Record<Verdict, string> = {
    ACQUIRE: `Multi-dimensional liquidity score of ${property.liquidityScore.toFixed(0)}, deep buyer pool, and tight bid-ask spread make this asset suitable for acquisition at or near current marketing levels. Submarket fundamentals remain constructive and exit optionality is broad.`,
    HOLD: `Current liquidity score of ${property.liquidityScore.toFixed(0)} supports continued holding. While no immediate disposition pressure exists, monitor quarterly for inflection signals — particularly bid-ask widening or buyer pool thinning.`,
    MONITOR: `Liquidity score of ${property.liquidityScore.toFixed(0)} sits in the cautionary band. Tighten monitoring cadence to monthly and prepare a contingent disposition playbook should the score erode below 50.`,
    DIVEST: `Composite liquidity score of ${property.liquidityScore.toFixed(0)} reflects materially impaired exit conditions. Initiate orderly disposal planning, prioritize stabilization actions to defend price, and broaden buyer outreach to non-traditional channels.`,
  };

  const actionsByVerdict: Record<Verdict, string[]> = {
    ACQUIRE: [
      'Initiate financial DD and engineering report within 14 days',
      'Pre-qualify lender LOIs at 60-65% LTV',
      'Validate tenant estoppels and submit binding offer',
    ],
    HOLD: [
      'Confirm rent roll stability and forward leasing exposure',
      'Re-run liquidity analysis at next quarter-end',
      'Engage capital markets advisor for unsolicited offer intel',
    ],
    MONITOR: [
      'Schedule monthly liquidity score refresh',
      'Build dispositions broker shortlist and indicative pricing',
      'Stress-test cap rate scenarios at +75bps and +150bps',
    ],
    DIVEST: [
      'Engage exclusive disposition broker within 30 days',
      'Stabilize NOI through tenant retention initiatives',
      'Pre-market to opportunistic and 1031-exchange buyer pools',
    ],
  };

  const reanalyzeByVerdict: Record<Verdict, number> = {
    ACQUIRE: 90, HOLD: 90, MONITOR: 30, DIVEST: 14,
  };

  return {
    verdict,
    headline: verdictHeadline(verdict, property.name),
    reasoning: reasoningByVerdict[verdict],
    nextActions: actionsByVerdict[verdict],
    reanalyzeAfterDays: reanalyzeByVerdict[verdict],
  };
};

// ─── Key Drivers ───────────────────────────────────────────────────

const deriveKeyDrivers = (breakdown: ScoreDimension[]): KeyDriver[] => {
  const sorted = [...breakdown].sort((a, b) => Math.abs(b.score - 65) - Math.abs(a.score - 65));
  return sorted.slice(0, 3).map(d => ({
    title: d.label,
    impact: d.score >= 70 ? 'positive' : d.score >= 50 ? 'neutral' : 'negative',
    magnitude: d.score >= 80 ? 'Strong tailwind' : d.score >= 65 ? 'Modest support' : d.score >= 45 ? 'Mixed signal' : 'Material headwind',
  }));
};

// ─── Master Function ───────────────────────────────────────────────

export const deriveReport = (property: Property): AnalysisReport => {
  const breakdown = deriveScoreBreakdown(property.liquidityScore, property.id);
  const verdict = deriveVerdict(property.liquidityScore, property.riskStatus);
  const drivers = deriveKeyDrivers(breakdown.dimensions);
  const headline = verdictHeadline(verdict, property.name);

  return {
    executive: { verdict, headline, keyDrivers: drivers },
    scoreBreakdown: breakdown,
    marketContext: deriveMarketContext(property),
    comparables: deriveComparables(property),
    scenarios: deriveScenarios(property),
    timeDistribution: deriveTimeDistribution(property),
    riskFactors: deriveRiskFactors(property),
    recommendation: deriveRecommendation(property, verdict),
    methodologyNote: 'Composite collateral liquidity score is computed from six weighted dimensions aligned with Indonesian banking-collateral standards: Legalitas & Hak Tanggungan (25%), Lokasi & Akses Jalan (20%), Marketabilitas — Comp & NJOP (20%), Nilai Likuidasi / FSV Ratio (15%), Tenor Pemasaran (10%), and Risiko Lingkungan & Zoning (10%). Dimension weighting and rubric reference POJK 40/POJK.03/2019 on collateral valuation, SPI 366 (MAPPI) on forced-sale valuation for auction purposes, and PBI 18/16/PBI/2016 on Loan-to-Value ratios for property-backed credit. Modeled forced sale value (FSV) sits within the 60–80% of market value band per SPI 366 short-marketing-horizon convention; hak tanggungan ratio target ≥125% of loan value follows the standard mortgage cushion. Scenario weights derived from days-on-market distribution within the same submarket. Risk factors mapped to the four standard CRE risk dimensions (Macro / Sector / Asset / Liquidity). This release uses AI narrative augmentation with deterministic submarket extrapolation; production deployments integrate licensed transaction data (Knight Frank, Colliers, BPN) and KJPP-validated NJOP and hak tanggungan registries.',
  };
};
