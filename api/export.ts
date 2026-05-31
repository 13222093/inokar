import type { VercelRequest, VercelResponse } from '@vercel/node';
import PDFDocument from 'pdfkit';

// ─── Color palette (matches web app brand) ─────────────────────────

const COLORS = {
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  faint: '#cbd5e1',
  divider: '#e2e8f0',
  surface: '#f8fafc',
  brand: '#6366f1',
  brandSoft: '#eef2ff',
  tertiary: '#14b8a6',
  tertiarySoft: '#ccfbf1',
  secondary: '#f59e0b',
  secondarySoft: '#fef3c7',
  error: '#ef4444',
  errorSoft: '#fee2e2',
  primary: '#6366f1',
  primarySoft: '#eef2ff',
};

// ─── Types matching frontend reportDerivation ──────────────────────

interface PropertyAssessment { title: string; detail: string; sentiment: 'positive' | 'neutral' | 'negative'; icon: string; }
interface PropertyPayload {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  propertyType: string;
  marketValue: number;
  liquidityScore: number;
  riskStatus: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  timeToLiquidity: number;
  confidence: number;
  summary: string;
  assessments: PropertyAssessment[];
  createdAt: string;
  capRate?: number;
  occupancyRate?: number;
}

interface ScoreDimension { key: string; label: string; score: number; weight: number; comment: string; }
interface KeyDriver { title: string; impact: 'positive' | 'neutral' | 'negative'; magnitude: string; }
interface MarketContext { submarket: string; classification: string; capRate: number; capRateBenchmark: number; vacancy: number; vacancyBenchmark: number; priceTrendYoY: number; activeDrivers: string[]; }
interface Comparable { name: string; distanceKm: number; saleQuarter: string; salePrice: number; pricePerSqm: number; dom: number; status: 'CLOSED' | 'PENDING'; }
interface Scenario { dom: number; salePrice: number; probability: number; }
interface Scenarios { base: Scenario; bull: Scenario; bear: Scenario; expectedValue: number; }
interface TimeDistribution { expected: number; submarketMedian: number; buckets: { label: string; pct: number }[]; }
interface RiskFactor { category: string; title: string; severity: number; likelihood: number; impact: string; mitigation: string; }
interface Recommendation { verdict: 'ACQUIRE' | 'HOLD' | 'MONITOR' | 'DIVEST'; headline: string; reasoning: string; nextActions: string[]; reanalyzeAfterDays: number; }

interface ReportPayload {
  executive: { verdict: Recommendation['verdict']; headline: string; keyDrivers: KeyDriver[]; };
  scoreBreakdown: { composite: number; dimensions: ScoreDimension[]; };
  marketContext: MarketContext;
  comparables: Comparable[];
  scenarios: Scenarios;
  timeDistribution: TimeDistribution;
  riskFactors: RiskFactor[];
  recommendation: Recommendation;
  methodologyNote: string;
}

// ─── Formatters ────────────────────────────────────────────────────

const fmtMoney = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;
const today = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// ─── Color helpers for status badges ───────────────────────────────

const riskColor = (status: string) => status === 'LOW_RISK' ? COLORS.tertiary : status === 'MEDIUM_RISK' ? COLORS.secondary : COLORS.error;
const riskBg = (status: string) => status === 'LOW_RISK' ? COLORS.tertiarySoft : status === 'MEDIUM_RISK' ? COLORS.secondarySoft : COLORS.errorSoft;
const riskLabel = (status: string) => status === 'LOW_RISK' ? 'LOW RISK' : status === 'MEDIUM_RISK' ? 'MEDIUM RISK' : 'HIGH RISK';

const verdictColor = (v: string) => v === 'ACQUIRE' ? COLORS.tertiary : v === 'HOLD' ? COLORS.primary : v === 'MONITOR' ? COLORS.secondary : COLORS.error;
const verdictBg = (v: string) => v === 'ACQUIRE' ? COLORS.tertiarySoft : v === 'HOLD' ? COLORS.primarySoft : v === 'MONITOR' ? COLORS.secondarySoft : COLORS.errorSoft;

const scoreColor = (s: number) => s >= 80 ? COLORS.tertiary : s >= 60 ? COLORS.primary : s >= 40 ? COLORS.secondary : COLORS.error;

const sentimentColor = (s: string) => s === 'positive' ? COLORS.tertiary : s === 'negative' ? COLORS.error : COLORS.muted;

// ─── PDF render helpers ────────────────────────────────────────────

type Doc = InstanceType<typeof PDFDocument>;

const PAGE_W = 595.28; // A4 width in pt
const PAGE_H = 841.89; // A4 height in pt
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

const hr = (doc: Doc, color = COLORS.divider) => {
  doc.moveTo(MARGIN, doc.y)
    .lineTo(PAGE_W - MARGIN, doc.y)
    .strokeColor(color)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.5);
};

const sectionHeading = (doc: Doc, num: string, title: string) => {
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8).text(`SECTION ${num}`, { characterSpacing: 1.5 });
  doc.moveDown(0.1);
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(13).text(title);
  doc.moveDown(0.4);
};

const badge = (doc: Doc, text: string, bg: string, fg: string, x: number, y: number) => {
  const padX = 6;
  const padY = 3;
  doc.font('Helvetica-Bold').fontSize(7);
  const textWidth = doc.widthOfString(text);
  const w = textWidth + padX * 2;
  const h = 11;
  doc.roundedRect(x, y, w, h, 2).fillColor(bg).fill();
  doc.fillColor(fg).text(text, x + padX, y + padY, { lineBreak: false });
  return w;
};

const labeledMetric = (doc: Doc, label: string, value: string, x: number, y: number, w: number, valueColor = COLORS.ink) => {
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7).text(label.toUpperCase(), x, y, { width: w, characterSpacing: 1 });
  doc.fillColor(valueColor).font('Helvetica-Bold').fontSize(14).text(value, x, y + 12, { width: w });
};

const ensureSpace = (doc: Doc, needed: number) => {
  if (doc.y + needed > PAGE_H - MARGIN - 30) {
    doc.addPage();
  }
};

const scoreBar = (doc: Doc, label: string, score: number, weight: number, comment: string) => {
  ensureSpace(doc, 50);
  const yStart = doc.y;
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text(label, MARGIN, yStart, { continued: true });
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(`  (${weight}% weight)`, { continued: true });
  doc.fillColor(scoreColor(score)).font('Helvetica-Bold').fontSize(11).text(`  ${score}`, { align: 'right' });

  // Bar
  const barY = doc.y + 2;
  const barWidth = CONTENT_W;
  doc.roundedRect(MARGIN, barY, barWidth, 5, 2).fillColor(COLORS.surface).fill();
  doc.roundedRect(MARGIN, barY, barWidth * (score / 100), 5, 2).fillColor(scoreColor(score)).fill();
  doc.y = barY + 9;

  doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5).text(comment, MARGIN, doc.y, { width: CONTENT_W, align: 'left' });
  doc.moveDown(0.8);
};

const pageFooter = (doc: Doc, pageNum: number, totalPages: number, propertyName: string) => {
  const y = PAGE_H - 30;
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7);
  doc.text(`AppraisIQ • ${propertyName}`, MARGIN, y, { width: CONTENT_W / 2, lineBreak: false });
  doc.text(`${today()}  •  Page ${pageNum} of ${totalPages}`, MARGIN + CONTENT_W / 2, y, { width: CONTENT_W / 2, align: 'right', lineBreak: false });
};

const drawHeader = (doc: Doc, property: PropertyPayload, report: ReportPayload) => {
  // Brand mark + title
  doc.fillColor(COLORS.brand).font('Helvetica-Bold').fontSize(11).text('AppraisIQ', MARGIN, MARGIN, { continued: true });
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text('  •  Liquidity Intelligence Report', { continued: false });

  // Right side: date
  doc.fillColor(COLORS.muted).fontSize(9).text(today(), MARGIN, MARGIN, { align: 'right' });
  doc.moveDown(0.5);
  hr(doc);
  doc.moveDown(0.8);

  // Ref + badges
  const refY = doc.y;
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7.5).text(`REF: AIQ-${property.id.slice(-6).toUpperCase()}`, MARGIN, refY, { continued: false, characterSpacing: 1.5 });

  // badges row
  let bx = MARGIN;
  const by = doc.y + 3;
  bx += badge(doc, riskLabel(property.riskStatus), riskBg(property.riskStatus), riskColor(property.riskStatus), bx, by) + 5;
  badge(doc, report.executive.verdict, verdictBg(report.executive.verdict), verdictColor(report.executive.verdict), bx, by);
  doc.y = by + 14;
  doc.moveDown(0.4);

  // Property name
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(22).text(property.name, MARGIN, doc.y, { width: CONTENT_W });
  doc.moveDown(0.2);

  // Address
  const addressLine = [property.address, property.city, property.state, property.country].filter(Boolean).join(', ');
  doc.fillColor(COLORS.body).font('Helvetica').fontSize(10).text(addressLine, MARGIN, doc.y, { width: CONTENT_W });
  doc.moveDown(0.3);

  // Meta line
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(
    `${property.propertyType}  •  Market Value ${fmtMoney(property.marketValue)}  •  ${property.confidence}% AI Confidence  •  ${property.assessments.length} Findings`,
    MARGIN, doc.y, { width: CONTENT_W }
  );
  doc.moveDown(1);
  hr(doc);
  doc.moveDown(0.6);
};

// ─── Section renderers ─────────────────────────────────────────────

const renderExecutiveSummary = (doc: Doc, property: PropertyPayload, report: ReportPayload) => {
  sectionHeading(doc, '01', 'Executive Summary');

  // Score + verdict box (side by side)
  const yStart = doc.y;
  const scoreBoxW = 110;
  const scoreBoxH = 80;
  doc.roundedRect(MARGIN, yStart, scoreBoxW, scoreBoxH, 6).fillColor(COLORS.surface).fill();
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7).text('COMPOSITE SCORE', MARGIN + 8, yStart + 10, { width: scoreBoxW - 16, characterSpacing: 1.2 });
  doc.fillColor(scoreColor(property.liquidityScore)).font('Helvetica-Bold').fontSize(36).text(`${Math.round(property.liquidityScore)}`, MARGIN + 8, yStart + 24, { width: scoreBoxW - 16 });
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('/ 100', MARGIN + 8, yStart + 62);

  // Headline next to score
  const textX = MARGIN + scoreBoxW + 16;
  const textW = CONTENT_W - scoreBoxW - 16;
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(11).text(report.executive.headline, textX, yStart + 4, { width: textW, lineGap: 2 });

  doc.y = yStart + scoreBoxH + 18;

  // Key drivers row
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8).text('KEY DRIVERS', MARGIN, doc.y, { characterSpacing: 1.2 });
  doc.moveDown(0.4);

  const driverY = doc.y;
  const driverW = (CONTENT_W - 16) / 3;
  report.executive.keyDrivers.forEach((d, i) => {
    const x = MARGIN + i * (driverW + 8);
    doc.roundedRect(x, driverY, driverW, 60, 4).fillColor(COLORS.surface).fill();
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7).text(`DRIVER ${i + 1}`, x + 8, driverY + 8, { characterSpacing: 1 });
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text(d.title, x + 8, driverY + 20, { width: driverW - 16, lineGap: 1 });
    doc.fillColor(sentimentColor(d.impact)).font('Helvetica-Bold').fontSize(8).text(d.magnitude, x + 8, driverY + 44, { width: driverW - 16 });
  });
  doc.y = driverY + 70;
  doc.moveDown(0.5);
};

const renderScoreBreakdown = (doc: Doc, report: ReportPayload) => {
  ensureSpace(doc, 100);
  sectionHeading(doc, '02', 'Liquidity Score Breakdown');
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text('Five weighted dimensions adapted from MSCI RCA Capital Liquidity Score methodology.', { width: CONTENT_W });
  doc.moveDown(0.6);

  report.scoreBreakdown.dimensions.forEach(d => scoreBar(doc, d.label, d.score, d.weight, d.comment));

  // Composite footer
  hr(doc);
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8).text('WEIGHTED COMPOSITE', MARGIN, doc.y, { continued: true, characterSpacing: 1 });
  doc.fillColor(scoreColor(report.scoreBreakdown.composite)).font('Helvetica-Bold').fontSize(14).text(`  ${report.scoreBreakdown.composite.toFixed(1)} / 100`, { align: 'right' });
  doc.moveDown(0.8);
};

const renderMarketContext = (doc: Doc, report: ReportPayload) => {
  ensureSpace(doc, 200);
  sectionHeading(doc, '03', 'Market Context');
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(report.marketContext.submarket, { width: CONTENT_W });
  doc.moveDown(0.6);

  const colW = (CONTENT_W - 24) / 3;
  const y = doc.y;
  const cap = report.marketContext;

  labeledMetric(doc, 'Cap Rate', fmtPct(cap.capRate), MARGIN, y, colW, cap.capRate < cap.capRateBenchmark ? COLORS.tertiary : COLORS.secondary);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(`vs ${fmtPct(cap.capRateBenchmark)} benchmark`, MARGIN, y + 30, { width: colW });

  labeledMetric(doc, 'Vacancy', fmtPct(cap.vacancy), MARGIN + colW + 12, y, colW, cap.vacancy < cap.vacancyBenchmark ? COLORS.tertiary : COLORS.secondary);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(`vs ${fmtPct(cap.vacancyBenchmark)} benchmark`, MARGIN + colW + 12, y + 30, { width: colW });

  labeledMetric(doc, 'Price Trend YoY', `${cap.priceTrendYoY >= 0 ? '+' : ''}${cap.priceTrendYoY.toFixed(1)}%`, MARGIN + (colW + 12) * 2, y, colW, cap.priceTrendYoY >= 0 ? COLORS.tertiary : COLORS.error);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(cap.classification, MARGIN + (colW + 12) * 2, y + 30, { width: colW });

  doc.y = y + 50;
  doc.moveDown(0.5);

  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8).text('ACTIVE DEMAND DRIVERS', MARGIN, doc.y, { characterSpacing: 1 });
  doc.moveDown(0.3);
  cap.activeDrivers.forEach(d => {
    doc.fillColor(COLORS.tertiary).font('Helvetica-Bold').fontSize(8).text('▲  ', MARGIN, doc.y, { continued: true });
    doc.fillColor(COLORS.body).font('Helvetica').fontSize(9).text(d, { width: CONTENT_W - 14 });
    doc.moveDown(0.2);
  });
  doc.moveDown(0.5);
};

const renderTimeAndScenarios = (doc: Doc, report: ReportPayload) => {
  ensureSpace(doc, 240);
  sectionHeading(doc, '04', 'Time-to-Liquidity & Scenarios');

  const y = doc.y;
  const halfW = (CONTENT_W - 16) / 2;

  // LEFT: distribution
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8).text('DAYS-ON-MARKET DISTRIBUTION', MARGIN, y, { characterSpacing: 1, width: halfW });
  let dy = y + 14;
  report.timeDistribution.buckets.forEach(b => {
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(9).text(b.label, MARGIN, dy, { width: 60, lineBreak: false });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(`${b.pct}%`, MARGIN + halfW - 30, dy, { width: 30, align: 'right', lineBreak: false });
    // bar
    const barY = dy + 12;
    const barFull = halfW - 6;
    doc.roundedRect(MARGIN, barY, barFull, 5, 2).fillColor(COLORS.surface).fill();
    doc.roundedRect(MARGIN, barY, barFull * (b.pct / 100), 5, 2).fillColor(b.pct >= 30 ? COLORS.primary : b.pct >= 15 ? COLORS.secondary : COLORS.error).fill();
    dy = barY + 11;
  });
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(`Expected: ${report.timeDistribution.expected}d  •  Submarket median: ${report.timeDistribution.submarketMedian}d`, MARGIN, dy + 4, { width: halfW });
  const leftEnd = dy + 16;

  // RIGHT: scenarios
  const rightX = MARGIN + halfW + 16;
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8).text('PROBABILITY-WEIGHTED SCENARIOS', rightX, y, { characterSpacing: 1, width: halfW });
  let sy = y + 14;
  ([
    { label: 'BULL', tier: 'bull' as const, color: COLORS.tertiary, soft: COLORS.tertiarySoft },
    { label: 'BASE', tier: 'base' as const, color: COLORS.primary, soft: COLORS.primarySoft },
    { label: 'BEAR', tier: 'bear' as const, color: COLORS.error, soft: COLORS.errorSoft },
  ]).forEach(s => {
    const sc = report.scenarios[s.tier];
    doc.roundedRect(rightX, sy, halfW, 32, 4).fillColor(s.soft).fill();
    doc.fillColor(s.color).font('Helvetica-Bold').fontSize(8).text(s.label, rightX + 8, sy + 6, { characterSpacing: 1.2, width: 40 });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7).text(`${Math.round(sc.probability * 100)}% prob`, rightX + 8, sy + 18, { width: 50 });
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(9).text(`${sc.dom}d`, rightX + halfW - 110, sy + 12, { width: 40, align: 'right', lineBreak: false });
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text(fmtMoney(sc.salePrice), rightX + halfW - 70, sy + 11, { width: 65, align: 'right', lineBreak: false });
    sy += 38;
  });
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7).text('EXPECTED VALUE', rightX, sy + 2, { characterSpacing: 1 });
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(13).text(fmtMoney(report.scenarios.expectedValue), rightX, sy + 12);
  const rightEnd = sy + 32;

  doc.y = Math.max(leftEnd, rightEnd) + 10;
};

const renderComparables = (doc: Doc, report: ReportPayload) => {
  ensureSpace(doc, 180);
  sectionHeading(doc, '05', 'Comparable Transactions');

  // Table header
  const cols = [
    { label: 'ASSET', x: MARGIN, w: 130, align: 'left' as const },
    { label: 'DIST', x: MARGIN + 130, w: 50, align: 'left' as const },
    { label: 'SOLD', x: MARGIN + 180, w: 65, align: 'left' as const },
    { label: 'PRICE', x: MARGIN + 245, w: 70, align: 'right' as const },
    { label: '$/SQM', x: MARGIN + 315, w: 75, align: 'right' as const },
    { label: 'DOM', x: MARGIN + 390, w: 45, align: 'right' as const },
    { label: 'STATUS', x: MARGIN + 435, w: 60, align: 'left' as const },
  ];

  const headerY = doc.y;
  doc.rect(MARGIN, headerY - 2, CONTENT_W, 16).fillColor(COLORS.surface).fill();
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7.5);
  cols.forEach(c => doc.text(c.label, c.x + 6, headerY + 3, { width: c.w - 12, align: c.align, lineBreak: false, characterSpacing: 0.8 }));
  doc.y = headerY + 18;

  // Rows
  report.comparables.forEach((c, i) => {
    const ry = doc.y;
    if (i % 2 === 1) {
      doc.rect(MARGIN, ry - 2, CONTENT_W, 16).fillColor('#fafafa').fill();
    }
    doc.font('Helvetica').fontSize(9);
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').text(c.name, cols[0].x + 6, ry + 2, { width: cols[0].w - 12, lineBreak: false });
    doc.fillColor(COLORS.muted).font('Helvetica').text(`${c.distanceKm.toFixed(1)} km`, cols[1].x + 6, ry + 2, { width: cols[1].w - 12, lineBreak: false });
    doc.fillColor(COLORS.muted).text(c.saleQuarter, cols[2].x + 6, ry + 2, { width: cols[2].w - 12, lineBreak: false });
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').text(fmtMoney(c.salePrice), cols[3].x + 6, ry + 2, { width: cols[3].w - 12, align: 'right', lineBreak: false });
    doc.fillColor(COLORS.ink).font('Helvetica').text(`$${c.pricePerSqm.toLocaleString()}`, cols[4].x + 6, ry + 2, { width: cols[4].w - 12, align: 'right', lineBreak: false });
    doc.fillColor(COLORS.ink).text(`${c.dom}d`, cols[5].x + 6, ry + 2, { width: cols[5].w - 12, align: 'right', lineBreak: false });
    const stColor = c.status === 'CLOSED' ? COLORS.tertiary : COLORS.secondary;
    doc.fillColor(stColor).font('Helvetica-Bold').fontSize(7.5).text(c.status, cols[6].x + 6, ry + 4, { width: cols[6].w - 12, lineBreak: false });
    doc.y = ry + 16;
  });
  doc.moveDown(0.6);
};

const renderRiskFactors = (doc: Doc, report: ReportPayload) => {
  ensureSpace(doc, 80);
  sectionHeading(doc, '06', 'Risk Factors');
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text('Mapped to Macro / Sector / Asset / Liquidity dimensions. SEV × LIK on 1–5 scale.', { width: CONTENT_W });
  doc.moveDown(0.5);

  report.riskFactors.forEach(rf => {
    ensureSpace(doc, 80);
    const severity = rf.severity * rf.likelihood;
    const color = severity >= 16 ? COLORS.error : severity >= 9 ? COLORS.secondary : severity >= 4 ? COLORS.primary : COLORS.tertiary;
    const soft = severity >= 16 ? COLORS.errorSoft : severity >= 9 ? COLORS.secondarySoft : severity >= 4 ? COLORS.primarySoft : COLORS.tertiarySoft;

    const ry = doc.y;
    doc.roundedRect(MARGIN, ry, CONTENT_W, 4, 2).fillColor(color).fill();
    doc.y = ry + 8;

    doc.fillColor(color).font('Helvetica-Bold').fontSize(7).text(rf.category.toUpperCase(), MARGIN, doc.y, { continued: true, characterSpacing: 1.2 });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7).text(`   SEV ${rf.severity}/5  •  LIK ${rf.likelihood}/5`, { align: 'right' });

    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text(rf.title, MARGIN, doc.y);
    doc.moveDown(0.15);
    doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5).text(rf.impact, MARGIN, doc.y, { width: CONTENT_W, lineGap: 1 });
    doc.moveDown(0.3);
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7).text('MITIGATION', MARGIN, doc.y, { characterSpacing: 1 });
    doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5).text(rf.mitigation, MARGIN, doc.y + 2, { width: CONTENT_W, lineGap: 1 });

    // colored side strip background for the whole block
    doc.moveDown(0.8);
    void soft;
  });
};

const renderAiNarrative = (doc: Doc, property: PropertyPayload) => {
  ensureSpace(doc, 120);
  sectionHeading(doc, '07', 'AI Assessment Narrative');
  doc.fillColor(COLORS.body).font('Helvetica').fontSize(9).text(property.summary, { width: CONTENT_W, lineGap: 1.5 });
  doc.moveDown(0.6);

  property.assessments.forEach(a => {
    ensureSpace(doc, 50);
    doc.fillColor(sentimentColor(a.sentiment)).font('Helvetica-Bold').fontSize(7).text(a.sentiment.toUpperCase(), MARGIN, doc.y, { characterSpacing: 1 });
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text(a.title);
    doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5).text(a.detail, { width: CONTENT_W, lineGap: 1 });
    doc.moveDown(0.5);
  });
};

const renderRecommendation = (doc: Doc, report: ReportPayload) => {
  ensureSpace(doc, 200);
  sectionHeading(doc, '08', 'Recommendation');

  const v = report.recommendation.verdict;
  const vc = verdictColor(v);
  const vbg = verdictBg(v);

  // Verdict box
  const y = doc.y;
  doc.roundedRect(MARGIN, y, CONTENT_W, 50, 6).fillColor(vbg).fill();
  doc.fillColor(vc).font('Helvetica-Bold').fontSize(20).text(v, MARGIN + 14, y + 12, { width: 120 });
  doc.fillColor(COLORS.ink).font('Helvetica').fontSize(9).text(report.recommendation.headline, MARGIN + 140, y + 14, { width: CONTENT_W - 154, lineGap: 1 });
  doc.y = y + 60;

  doc.fillColor(COLORS.body).font('Helvetica').fontSize(9).text(report.recommendation.reasoning, { width: CONTENT_W, lineGap: 1.5 });
  doc.moveDown(0.6);

  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8).text('RECOMMENDED NEXT ACTIONS', { characterSpacing: 1 });
  doc.moveDown(0.3);
  report.recommendation.nextActions.forEach((a, i) => {
    doc.fillColor(vc).font('Helvetica-Bold').fontSize(9).text(`${String(i + 1).padStart(2, '0')}. `, MARGIN, doc.y, { continued: true });
    doc.fillColor(COLORS.body).font('Helvetica').fontSize(9).text(a, { width: CONTENT_W - 20, lineGap: 1 });
    doc.moveDown(0.3);
  });

  doc.moveDown(0.3);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(`Re-analyze recommended after ${report.recommendation.reanalyzeAfterDays} days.`, { width: CONTENT_W });
  doc.moveDown(0.5);
};

const renderMethodology = (doc: Doc, report: ReportPayload) => {
  ensureSpace(doc, 120);
  sectionHeading(doc, '09', 'Methodology & Disclaimer');
  doc.fillColor(COLORS.body).font('Helvetica').fontSize(8).text(report.methodologyNote, { width: CONTENT_W, lineGap: 1.5 });
  doc.moveDown(0.5);
  hr(doc);
  doc.moveDown(0.3);
  doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(7.5).text(
    'This report is an AI-derived decision-support analysis and is not a substitute for a licensed appraisal under SPI (MAPPI) or USPAP. For binding valuation or transaction purposes, consult a certified appraiser. Comparable transactions, market benchmarks, and scenario weights shown are synthesized for demonstration; production deployments integrate licensed feeds from Knight Frank, Colliers, and BPN. AppraisIQ disclaims liability for decisions made solely on this report.',
    { width: CONTENT_W, lineGap: 1.5 }
  );
};

// ─── Handler ───────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } });
  }

  const { property, report } = req.body || {};
  if (!property || !report) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'property and report are required' } });
  }

  try {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true, info: { Title: `AppraisIQ — ${property.name}`, Author: 'AppraisIQ', Subject: 'Liquidity Intelligence Report' } });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const finished = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Render content
    drawHeader(doc, property as PropertyPayload, report as ReportPayload);
    renderExecutiveSummary(doc, property as PropertyPayload, report as ReportPayload);
    renderScoreBreakdown(doc, report as ReportPayload);
    renderMarketContext(doc, report as ReportPayload);
    renderTimeAndScenarios(doc, report as ReportPayload);
    renderComparables(doc, report as ReportPayload);
    renderRiskFactors(doc, report as ReportPayload);
    renderAiNarrative(doc, property as PropertyPayload);
    renderRecommendation(doc, report as ReportPayload);
    renderMethodology(doc, report as ReportPayload);

    // Page footers
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      pageFooter(doc, i + 1, range.count, property.name);
    }

    doc.end();
    const pdfBuffer = await finished;

    const filename = `appraisiq-${String(property.name).replace(/\s+/g, '-').toLowerCase()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('Export PDF error:', err);
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: `PDF generation failed: ${message}` } });
  }
}
