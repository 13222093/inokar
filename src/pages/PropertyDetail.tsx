import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ComingSoon } from '../components/ComingSoon';
import { useProperties, type RiskStatus } from '../hooks/useProperties';
import { useToast } from '../hooks/useToast';
import { deriveReport, type Verdict, type ScoreDimension, type RiskFactor } from '../lib/reportDerivation';
import { exportPropertyAsPdf } from '../lib/exportPdf';

// ─── Formatters ────────────────────────────────────────────────────

const fmtMoney = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;

const formatRelativeFromIso = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const refCode = (id: string) => `AIQ-${id.slice(-6).toUpperCase()}`;

// ─── Visual helpers ────────────────────────────────────────────────

const riskTagMeta = (status: RiskStatus) => {
  if (status === 'LOW_RISK') return { label: 'Active Asset', cls: 'bg-tertiary/10 text-tertiary border-tertiary/20', accent: 'text-tertiary' };
  if (status === 'MEDIUM_RISK') return { label: 'Under Review', cls: 'bg-secondary/10 text-secondary border-secondary/20', accent: 'text-secondary' };
  return { label: 'Risk Detected', cls: 'bg-error/10 text-error border-error/20', accent: 'text-error' };
};

const verdictMeta = (v: Verdict) => {
  switch (v) {
    case 'ACQUIRE': return { cls: 'bg-tertiary/15 text-tertiary border-tertiary/40', icon: 'add_circle' };
    case 'HOLD':    return { cls: 'bg-primary/15 text-primary border-primary/40', icon: 'pause_circle' };
    case 'MONITOR': return { cls: 'bg-secondary/15 text-secondary border-secondary/40', icon: 'visibility' };
    case 'DIVEST':  return { cls: 'bg-error/15 text-error border-error/40', icon: 'logout' };
  }
};

const scoreRingColor = (score: number) => score >= 80 ? 'border-tertiary' : score >= 60 ? 'border-primary' : score >= 40 ? 'border-secondary' : 'border-error';
const scoreTextColor = (score: number) => score >= 80 ? 'text-tertiary' : score >= 60 ? 'text-primary' : score >= 40 ? 'text-secondary' : 'text-error';
const scoreBarColor  = (score: number) => score >= 80 ? 'bg-tertiary' : score >= 60 ? 'bg-primary' : score >= 40 ? 'bg-secondary' : 'bg-error';

const sentimentIconColor = (sentiment: string) =>
  sentiment === 'positive' ? 'text-tertiary' : sentiment === 'negative' ? 'text-error' : 'text-outline';

const impactColor = (impact: 'positive' | 'neutral' | 'negative') =>
  impact === 'positive' ? 'text-tertiary' : impact === 'negative' ? 'text-error' : 'text-secondary';

// Risk heat-map cell color from severity × likelihood
const riskCellColor = (s: number, l: number) => {
  const score = s * l; // 1..25
  if (score >= 16) return 'bg-error/30 text-error border-error/40';
  if (score >= 9)  return 'bg-secondary/25 text-secondary border-secondary/40';
  if (score >= 4)  return 'bg-primary/20 text-primary border-primary/30';
  return 'bg-tertiary/15 text-tertiary border-tertiary/30';
};

// ─── Mini components ───────────────────────────────────────────────

const SectionHeading: React.FC<{ num: string; title: string; subtitle?: string }> = ({ num, title, subtitle }) => (
  <div className="mb-4">
    <p className="text-[10px] uppercase tracking-[0.25em] font-black text-outline mb-1">Section {num}</p>
    <h3 className="font-headline text-xl font-bold text-on-surface">{title}</h3>
    {subtitle && <p className="text-xs text-outline mt-1">{subtitle}</p>}
  </div>
);

const ScoreBar: React.FC<{ dim: ScoreDimension }> = ({ dim }) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-on-surface">{dim.label}</span>
        <span className="text-[10px] text-outline uppercase tracking-wider">{dim.weight}% weight</span>
      </div>
      <span className={`text-lg font-black font-headline ${scoreTextColor(dim.score)}`}>{dim.score}</span>
    </div>
    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
      <div className={`h-full ${scoreBarColor(dim.score)} transition-all duration-700`} style={{ width: `${dim.score}%` }}></div>
    </div>
    <p className="text-xs text-outline leading-relaxed">{dim.comment}</p>
  </div>
);

const RiskHeatCell: React.FC<{ rf: RiskFactor }> = ({ rf }) => {
  const cell = riskCellColor(rf.severity, rf.likelihood);
  return (
    <div className={`border rounded-xl p-4 space-y-2 ${cell}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{rf.category}</span>
        <div className="flex flex-col items-end text-[10px] font-bold opacity-90">
          <span>SEV {rf.severity}/5</span>
          <span>LIK {rf.likelihood}/5</span>
        </div>
      </div>
      <h4 className="text-sm font-bold text-on-surface">{rf.title}</h4>
      <p className="text-xs text-on-surface/80 leading-relaxed">{rf.impact}</p>
      <div className="pt-2 border-t border-current/15">
        <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1">Mitigation</p>
        <p className="text-xs text-on-surface/90 leading-relaxed">{rf.mitigation}</p>
      </div>
    </div>
  );
};

// ─── Export logic ──────────────────────────────────────────────────

// ─── Main Component ────────────────────────────────────────────────

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProperty } = useProperties();
  const { success, error: toastError } = useToast();
  const [exporting, setExporting] = useState(false);

  const property = id ? getProperty(id) : undefined;
  const report = useMemo(() => (property ? deriveReport(property) : null), [property]);

  if (!property || !report) {
    return (
      <Layout>
        <Card className="text-center py-16 max-w-xl mx-auto">
          <span className="material-symbols-outlined text-5xl text-outline mb-4 block">search_off</span>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Property Not Found</h2>
          <p className="text-outline text-sm mb-6">
            The property <code className="px-2 py-0.5 rounded bg-surface-container-highest text-xs">{id}</code> doesn't exist or has been removed from your portfolio.
          </p>
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-primary font-bold text-sm underline">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Portfolio
          </Link>
        </Card>
      </Layout>
    );
  }

  const tag = riskTagMeta(property.riskStatus);
  const verdict = verdictMeta(report.executive.verdict);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportPropertyAsPdf(property, report);
      success(`Exported ${property.name} report (PDF)`);
    } catch (err) {
      console.error(err);
      toastError('Export failed. Check your connection and retry.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-8 gap-6 flex-wrap">
        <div>
          <Link to="/portfolio" className="inline-flex items-center gap-1 text-outline hover:text-primary text-xs font-bold uppercase tracking-widest mb-3 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Portfolio
          </Link>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className={`font-bold tracking-widest text-[10px] uppercase font-manrope ${tag.accent}`}>Ref: {refCode(property.id)}</span>
            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider font-manrope border ${tag.cls}`}>{tag.label}</span>
            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider font-manrope border ${verdict.cls} inline-flex items-center gap-1`}>
              <span className="material-symbols-outlined text-xs">{verdict.icon}</span> {report.executive.verdict}
            </span>
          </div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">{property.name}</h2>
          <p className="text-outline text-sm flex items-center gap-2 font-manrope flex-wrap">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            {[property.address, property.city, property.state, property.country].filter(Boolean).join(', ')}
          </p>
          <p className="text-[11px] text-outline mt-2 font-manrope">
            Analyzed {formatRelativeFromIso(property.createdAt)} • {property.confidence}% AI confidence • {property.assessments.length} narrative findings
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            icon={<span className={`material-symbols-outlined ${exporting ? 'animate-spin' : ''}`}>{exporting ? 'progress_activity' : 'download'}</span>}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : 'Export Report'}
          </Button>
          <ComingSoon label="Re-appraisal flow — Coming Q2 2026">
            <Button icon={<span className="material-symbols-outlined">edit</span>}>Update Appraisal</Button>
          </ComingSoon>
        </div>
      </div>

      {/* ─── SECTION 1: EXECUTIVE SUMMARY ──────────────────────── */}
      <Card className="mb-6 border border-outline-variant/15 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br opacity-30 ${
          property.riskStatus === 'LOW_RISK' ? 'from-tertiary/15' : property.riskStatus === 'MEDIUM_RISK' ? 'from-secondary/15' : 'from-error/15'
        } to-transparent pointer-events-none`}></div>
        <div className="relative">
          <SectionHeading num="01" title="Executive Summary" subtitle="At-a-glance verdict for stakeholders." />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-3 flex flex-col items-center text-center">
              <div className={`w-32 h-32 rounded-full border-4 border-surface-container-high flex items-center justify-center relative`}>
                <div className={`absolute inset-0 rounded-full border-4 ${scoreRingColor(property.liquidityScore)} border-r-transparent border-b-transparent rotate-45`}></div>
                <span className={`text-5xl font-black font-headline ${scoreTextColor(property.liquidityScore)}`}>{Math.round(property.liquidityScore)}</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-outline tracking-widest mt-3">Composite Liquidity</p>
            </div>
            <div className="lg:col-span-9 space-y-4">
              <p className="text-lg font-headline font-semibold text-on-surface leading-relaxed">{report.executive.headline}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {report.executive.keyDrivers.map((d, i) => (
                  <div key={i} className="bg-surface-container-lowest/40 border border-outline-variant/10 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Key Driver {i + 1}</p>
                    <p className="text-sm font-bold text-on-surface mb-1">{d.title}</p>
                    <p className={`text-xs font-semibold ${impactColor(d.impact)}`}>{d.magnitude}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── SECTION 2: ASSET PROFILE ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <Card className="lg:col-span-7 !p-0 border border-outline-variant/10 h-80 relative overflow-hidden rounded-xl">
          {property.imageUrl ? (
            <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${
              property.riskStatus === 'LOW_RISK' ? 'from-tertiary/30 via-primary/20' : property.riskStatus === 'MEDIUM_RISK' ? 'from-secondary/30 via-primary/10' : 'from-error/30 via-surface-container-high'
            } to-surface-container-highest flex items-center justify-center`}>
              <span className="material-symbols-outlined text-on-surface/40" style={{ fontSize: '120px' }}>domain</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div>
              <p className="text-white font-bold font-headline text-xl">{property.name}</p>
              <p className="text-white/70 text-sm font-manrope">{property.propertyType} • {fmtMoney(property.marketValue)}</p>
            </div>
            <ComingSoon label="Gallery — Coming Q2 2026">
              <Button variant="tertiary" className="text-xs py-2 px-4"><span className="material-symbols-outlined text-[16px]">visibility</span> View Gallery</Button>
            </ComingSoon>
          </div>
        </Card>

        <Card className="lg:col-span-5 border border-outline-variant/10 space-y-3">
          <SectionHeading num="02" title="Asset Profile" />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-lowest/40 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-outline">Type</p>
              <p className="text-sm font-bold text-on-surface mt-1">{property.propertyType}</p>
            </div>
            <div className="bg-surface-container-lowest/40 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-outline">Market Value</p>
              <p className="text-sm font-bold text-on-surface mt-1">{fmtMoney(property.marketValue)}</p>
            </div>
            <div className="bg-surface-container-lowest/40 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-outline">Cap Rate</p>
              <p className="text-sm font-bold text-on-surface mt-1">{fmtPct(report.marketContext.capRate)}</p>
            </div>
            <div className="bg-surface-container-lowest/40 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-outline">Occupancy</p>
              <p className="text-sm font-bold text-on-surface mt-1">{fmtPct(100 - report.marketContext.vacancy)}</p>
            </div>
            <div className="bg-surface-container-lowest/40 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-outline">Submarket Tier</p>
              <p className="text-sm font-bold text-on-surface mt-1">{report.marketContext.classification.split(' — ')[0]}</p>
            </div>
            <div className="bg-surface-container-lowest/40 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-outline">Est. Time-to-Sell</p>
              <p className="text-sm font-bold text-on-surface mt-1">{property.timeToLiquidity} days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── SECTION 3: LIQUIDITY SCORE BREAKDOWN ──────────────── */}
      <Card className="mb-6 border border-outline-variant/10">
        <SectionHeading num="03" title="Liquidity Score Breakdown" subtitle="Five weighted dimensions adapted from MSCI RCA Capital Liquidity Score methodology." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          {report.scoreBreakdown.dimensions.map(d => (
            <ScoreBar key={d.key} dim={d} />
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-outline-variant/10 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-outline">Weighted composite</p>
          <p className={`text-2xl font-black font-headline ${scoreTextColor(report.scoreBreakdown.composite)}`}>
            {report.scoreBreakdown.composite.toFixed(1)} <span className="text-sm text-outline font-medium">/ 100</span>
          </p>
        </div>
      </Card>

      {/* ─── SECTION 4: MARKET CONTEXT ─────────────────────────── */}
      <Card className="mb-6 border border-outline-variant/10">
        <SectionHeading num="04" title="Market Context" subtitle={report.marketContext.submarket} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-2">Cap Rate vs Submarket</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-headline ${report.marketContext.capRate < report.marketContext.capRateBenchmark ? 'text-tertiary' : 'text-secondary'}`}>
                {fmtPct(report.marketContext.capRate)}
              </span>
              <span className="text-xs text-outline">vs {fmtPct(report.marketContext.capRateBenchmark)} benchmark</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, report.marketContext.capRate * 10)}%` }}></div>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-2">Vacancy vs Submarket</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-headline ${report.marketContext.vacancy < report.marketContext.vacancyBenchmark ? 'text-tertiary' : 'text-secondary'}`}>
                {fmtPct(report.marketContext.vacancy)}
              </span>
              <span className="text-xs text-outline">vs {fmtPct(report.marketContext.vacancyBenchmark)} benchmark</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className={`h-full ${report.marketContext.vacancy < 15 ? 'bg-tertiary' : report.marketContext.vacancy < 25 ? 'bg-secondary' : 'bg-error'}`} style={{ width: `${Math.min(100, report.marketContext.vacancy * 2)}%` }}></div>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-2">Price Trend YoY</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-headline ${report.marketContext.priceTrendYoY >= 0 ? 'text-tertiary' : 'text-error'}`}>
                {report.marketContext.priceTrendYoY >= 0 ? '+' : ''}{report.marketContext.priceTrendYoY.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-outline mt-2">{report.marketContext.classification}</p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-outline-variant/10">
          <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-3">Active Demand Drivers</p>
          <ul className="space-y-2">
            {report.marketContext.activeDrivers.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-on-surface">
                <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">trending_up</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* ─── SECTION 5: TIME-TO-LIQUIDITY DISTRIBUTION ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <Card className="lg:col-span-7 border border-outline-variant/10">
          <SectionHeading num="05" title="Time-to-Liquidity Distribution" subtitle="Probability density of days-on-market based on submarket history." />
          <div className="space-y-3 mt-4">
            {report.timeDistribution.buckets.map(b => (
              <div key={b.label}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-bold text-on-surface">{b.label}</span>
                  <span className="text-xs text-outline">{b.pct}%</span>
                </div>
                <div className="h-3 w-full bg-surface-container-highest rounded overflow-hidden">
                  <div className={`h-full ${b.pct >= 30 ? 'bg-primary' : b.pct >= 15 ? 'bg-secondary' : 'bg-error'} transition-all duration-700`} style={{ width: `${b.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/10 flex justify-between text-xs">
            <span className="text-outline">Expected: <span className="text-on-surface font-bold">{report.timeDistribution.expected}d</span></span>
            <span className="text-outline">Submarket median: <span className="text-on-surface font-bold">{report.timeDistribution.submarketMedian}d</span></span>
          </div>
        </Card>

        {/* ─── SECTION 6: SCENARIO ANALYSIS ──────────────────────── */}
        <Card className="lg:col-span-5 border border-outline-variant/10">
          <SectionHeading num="06" title="Scenario Analysis" subtitle="Probability-weighted disposition outcomes." />
          <div className="space-y-3 mt-4">
            {([
              { label: 'Bull', tier: 'bull', cls: 'border-tertiary/30 bg-tertiary/5', text: 'text-tertiary' },
              { label: 'Base', tier: 'base', cls: 'border-primary/30 bg-primary/5', text: 'text-primary' },
              { label: 'Bear', tier: 'bear', cls: 'border-error/30 bg-error/5', text: 'text-error' },
            ] as const).map(s => {
              const sc = report.scenarios[s.tier];
              return (
                <div key={s.tier} className={`border rounded-xl p-3 ${s.cls}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black uppercase tracking-widest ${s.text}`}>{s.label}</span>
                    <span className={`text-xs font-bold ${s.text}`}>{Math.round(sc.probability * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <p className="text-[10px] text-outline uppercase tracking-wider">DOM</p>
                      <p className="text-sm font-bold text-on-surface">{sc.dom}d</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-outline uppercase tracking-wider">Sale Price</p>
                      <p className="text-sm font-bold text-on-surface">{fmtMoney(sc.salePrice)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Expected Value</p>
            <p className="text-xl font-black text-on-surface font-headline">{fmtMoney(report.scenarios.expectedValue)}</p>
          </div>
        </Card>
      </div>

      {/* ─── SECTION 7: COMPARABLE TRANSACTIONS ─────────────────── */}
      <Card className="mb-6 border border-outline-variant/10 !p-0">
        <div className="p-6 pb-3">
          <SectionHeading num="07" title="Comparable Transactions" subtitle={`${report.comparables.length} comparable assets within ${Math.max(...report.comparables.map(c => c.distanceKm)).toFixed(1)} km, last 4 quarters.`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-container-lowest/40">
                <th className="px-6 py-3 text-[10px] uppercase font-black text-outline tracking-widest">Asset</th>
                <th className="px-6 py-3 text-[10px] uppercase font-black text-outline tracking-widest">Distance</th>
                <th className="px-6 py-3 text-[10px] uppercase font-black text-outline tracking-widest">Sold</th>
                <th className="px-6 py-3 text-[10px] uppercase font-black text-outline tracking-widest text-right">Price</th>
                <th className="px-6 py-3 text-[10px] uppercase font-black text-outline tracking-widest text-right">$ / sqm</th>
                <th className="px-6 py-3 text-[10px] uppercase font-black text-outline tracking-widest text-right">DOM</th>
                <th className="px-6 py-3 text-[10px] uppercase font-black text-outline tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {report.comparables.map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-semibold text-on-surface">{c.name}</td>
                  <td className="px-6 py-4 text-outline">{c.distanceKm.toFixed(1)} km</td>
                  <td className="px-6 py-4 text-outline">{c.saleQuarter}</td>
                  <td className="px-6 py-4 text-right font-bold text-on-surface">{fmtMoney(c.salePrice)}</td>
                  <td className="px-6 py-4 text-right text-on-surface">${c.pricePerSqm.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-on-surface">{c.dom}d</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'CLOSED' ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : 'bg-secondary/10 text-secondary border border-secondary/20'}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── SECTION 8: RISK FACTORS ────────────────────────────── */}
      <Card className="mb-6 border border-outline-variant/10">
        <SectionHeading num="08" title="Risk Factors" subtitle="Mapped to Macro / Sector / Asset / Liquidity dimensions. Color = severity × likelihood." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.riskFactors.map((rf, i) => (
            <RiskHeatCell key={i} rf={rf} />
          ))}
        </div>
      </Card>

      {/* ─── SECTION 9: AI ASSESSMENT NARRATIVE ─────────────────── */}
      <Card className="mb-6 border border-outline-variant/10">
        <SectionHeading num="09" title="AI Assessment Narrative" subtitle="Qualitative findings from generative analysis layer." />
        <p className="text-sm text-outline mb-5 leading-relaxed">{property.summary}</p>
        <div className="space-y-4">
          {property.assessments.map((a, i) => (
            <div key={i} className={`flex gap-4 items-start ${i < property.assessments.length - 1 ? 'pb-4 border-b border-outline-variant/10' : ''}`}>
              <span className={`material-symbols-outlined ${sentimentIconColor(a.sentiment)}`}>{a.icon}</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface">{a.title}</h4>
                <p className="text-xs text-outline leading-relaxed mt-1">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── SECTION 10: RECOMMENDATION ─────────────────────────── */}
      <Card className={`mb-6 border ${verdict.cls.replace('text-', 'border-').replace('/15', '/30').split(' ')[0]}`}>
        <SectionHeading num="10" title="Recommendation" />
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-full border-2 ${verdict.cls} flex items-center justify-center flex-shrink-0`}>
            <span className="material-symbols-outlined">{verdict.icon}</span>
          </div>
          <div className="flex-1">
            <p className={`text-2xl font-black font-headline ${verdict.cls.split(' ').find(c => c.startsWith('text-')) || ''}`}>{report.recommendation.verdict}</p>
            <p className="text-sm text-outline mt-1">{report.recommendation.headline}</p>
          </div>
        </div>
        <p className="text-sm text-on-surface leading-relaxed mb-5">{report.recommendation.reasoning}</p>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-3">Recommended Next Actions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {report.recommendation.nextActions.map((a, i) => (
              <div key={i} className="bg-surface-container-lowest/40 border border-outline-variant/10 rounded-xl p-3">
                <p className={`text-xs font-black ${verdict.cls.split(' ').find(c => c.startsWith('text-')) || ''} mb-1`}>{String(i + 1).padStart(2, '0')}</p>
                <p className="text-xs text-on-surface leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-outline-variant/10 flex items-center gap-2 text-xs text-outline">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Re-analyze recommended after <span className="text-on-surface font-bold mx-1">{report.recommendation.reanalyzeAfterDays} days</span>
        </div>
      </Card>

      {/* ─── SECTION 11: METHODOLOGY & DISCLAIMER ──────────────── */}
      <Card className="mb-6 border border-outline-variant/10 bg-surface-container-lowest/40">
        <SectionHeading num="11" title="Methodology & Disclaimer" />
        <p className="text-xs text-outline leading-relaxed mb-4">{report.methodologyNote}</p>
        <div className="pt-4 border-t border-outline-variant/10 flex items-start gap-2">
          <span className="material-symbols-outlined text-outline text-sm mt-0.5">info</span>
          <p className="text-[11px] text-outline italic leading-relaxed">
            This report is an AI-derived decision-support analysis and is <span className="text-on-surface font-bold">not a substitute for a licensed appraisal under SPI (MAPPI) or USPAP</span>. For binding valuation or transaction purposes, consult a certified appraiser. Comparable transactions, market benchmarks, and scenario weights shown are synthesized for demonstration; production deployments integrate licensed feeds from Knight Frank, Colliers, and BPN. AppraisIQ disclaims liability for decisions made solely on this report.
          </p>
        </div>
      </Card>

    </Layout>
  );
};
