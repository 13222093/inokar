import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ComingSoon } from '../components/ComingSoon';
import { useProperties, type Property, type RiskStatus } from '../hooks/useProperties';
import { useToast } from '../hooks/useToast';

const fmtMoney = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const riskTagMeta = (status: RiskStatus) => {
  if (status === 'LOW_RISK') return { label: 'Active Asset', cls: 'bg-tertiary/10 text-tertiary border-tertiary/20', accent: 'text-tertiary' };
  if (status === 'MEDIUM_RISK') return { label: 'Under Review', cls: 'bg-secondary/10 text-secondary border-secondary/20', accent: 'text-secondary' };
  return { label: 'Risk Detected', cls: 'bg-error/10 text-error border-error/20', accent: 'text-error' };
};

const scoreRingColor = (score: number) => score >= 80 ? 'border-tertiary' : score >= 60 ? 'border-primary' : score >= 40 ? 'border-secondary' : 'border-error';
const scoreTextColor = (score: number) => score >= 80 ? 'text-tertiary' : score >= 60 ? 'text-primary' : score >= 40 ? 'text-secondary' : 'text-error';

const sentimentIconColor = (sentiment: string) =>
  sentiment === 'positive' ? 'text-tertiary' : sentiment === 'negative' ? 'text-error' : 'text-outline';

const refCode = (id: string) => `AIQ-${id.slice(-6).toUpperCase()}`;

const formatRelativeFromIso = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const exportPropertyAsHtml = async (property: Property): Promise<void> => {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyName: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      marketValue: property.marketValue,
      liquidityScore: property.liquidityScore,
      capRate: property.capRate ?? 5.8,
      occupancyRate: property.occupancyRate ?? 96,
      timeToLiquidity: property.timeToLiquidity,
      assessments: property.assessments,
    }),
  });
  if (!res.ok) throw new Error('Export request failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `appraisiq-${property.name.replace(/\s+/g, '-').toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProperty } = useProperties();
  const { success, error: toastError } = useToast();
  const [exporting, setExporting] = useState(false);

  const property = id ? getProperty(id) : undefined;

  if (!property) {
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
  const scoreInt = Math.floor(property.liquidityScore);
  const scoreDec = (property.liquidityScore % 1).toFixed(1).slice(1); // ".8" etc, or "" if integer
  const occupancyPct = property.occupancyRate ?? 96;
  const occupancyRiskPct = 100 - occupancyPct;
  const capRate = property.capRate ?? 5.8;
  const capRateBarWidth = Math.min(100, Math.round(capRate * 10)); // visual approx

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportPropertyAsHtml(property);
      success(`Exported ${property.name} report`);
    } catch (err) {
      console.error(err);
      toastError('Export failed. Check your connection and retry.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-start mb-8 gap-6 flex-wrap">
        <div>
          <Link to="/portfolio" className="inline-flex items-center gap-1 text-outline hover:text-primary text-xs font-bold uppercase tracking-widest mb-3 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Portfolio
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className={`font-bold tracking-widest text-[10px] uppercase font-manrope ${tag.accent}`}>Ref: {refCode(property.id)}</span>
            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider font-manrope border ${tag.cls}`}>{tag.label}</span>
          </div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">{property.name}</h2>
          <p className="text-outline text-sm flex items-center gap-2 font-manrope">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            {[property.address, property.city, property.state, property.country].filter(Boolean).join(', ')}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1 border border-outline-variant/10 text-center flex flex-col items-center justify-center p-8 relative overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${
            property.riskStatus === 'LOW_RISK' ? 'from-tertiary/10' : property.riskStatus === 'MEDIUM_RISK' ? 'from-secondary/10' : 'from-error/10'
          } to-transparent`}></div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-2">AI Liquidity Score</p>
          <div className="relative">
            <div className={`w-40 h-40 rounded-full border-4 border-surface-container-high flex items-center justify-center relative z-10`}>
              <div className={`absolute inset-0 rounded-full border-4 ${scoreRingColor(property.liquidityScore)} border-r-transparent border-b-transparent rotate-45`}></div>
              <h3 className={`text-6xl font-black font-headline ${scoreTextColor(property.liquidityScore)}`}>
                {scoreInt}<span className="text-2xl text-outline font-medium">{scoreDec}</span>
              </h3>
            </div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 ${
              property.riskStatus === 'LOW_RISK' ? 'bg-tertiary/20' : property.riskStatus === 'MEDIUM_RISK' ? 'bg-secondary/20' : 'bg-error/20'
            } rounded-full blur-2xl -z-0`}></div>
          </div>
          <p className={`font-bold text-sm mt-6 font-manrope flex items-center gap-1 ${tag.accent}`}>
            <span className="material-symbols-outlined text-sm">{property.liquidityScore >= 80 ? 'trending_up' : property.liquidityScore >= 50 ? 'trending_flat' : 'trending_down'}</span>
            {property.confidence}% AI Confidence
          </p>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <Card level="high" className="border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-1">Current Market Value</p>
            <h4 className="text-3xl font-bold text-on-surface font-headline mb-4">{fmtMoney(property.marketValue)}</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-outline font-manrope">Analyzed {formatRelativeFromIso(property.createdAt)}</span>
            </div>
          </Card>
          <Card level="high" className="border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-1">Est. Time-to-Liquidity</p>
            <h4 className={`text-3xl font-bold font-headline mb-4 ${scoreTextColor(property.liquidityScore)}`}>{property.timeToLiquidity} Days</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-outline font-manrope">
                {property.timeToLiquidity < 30 ? 'Above market avg' : property.timeToLiquidity < 90 ? 'Within market avg' : 'Below market avg'}
              </span>
            </div>
          </Card>
          <Card level="high" className="border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-1">Yield (Cap Rate)</p>
            <h4 className="text-3xl font-bold text-on-surface font-headline mb-4">{capRate.toFixed(1)}%</h4>
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full" style={{ width: `${capRateBarWidth}%` }}></div>
            </div>
          </Card>
          <Card level="high" className="border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-1">Occupancy</p>
            <h4 className="text-3xl font-bold text-on-surface font-headline mb-4">{occupancyPct}%</h4>
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div className={`h-full ${occupancyPct >= 90 ? 'bg-tertiary' : occupancyPct >= 70 ? 'bg-secondary' : 'bg-error'}`} style={{ width: `${occupancyPct}%` }}></div>
            </div>
            <p className="text-[10px] text-outline mt-2">Vacancy: {occupancyRiskPct}%</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="!p-0 border border-outline-variant/10 h-80 relative overflow-hidden rounded-xl">
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
                <p className="text-white/70 text-sm font-manrope">{property.propertyType}</p>
             </div>
             <ComingSoon label="Gallery — Coming Q2 2026">
               <Button variant="tertiary" className="text-xs py-2 px-4"><span className="material-symbols-outlined text-[16px]">visibility</span> View Gallery</Button>
             </ComingSoon>
          </div>
        </Card>

        <Card className="border border-outline-variant/10">
          <h3 className="font-headline font-bold text-lg mb-2">AI Liquidity Assessment</h3>
          <p className="text-xs text-outline mb-4">{property.summary}</p>
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
      </div>

    </Layout>
  );
};
