import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ComingSoon } from '../components/ComingSoon';
import { useProperties, type Property, type RiskStatus } from '../hooks/useProperties';

const fmtMoney = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const riskMeta = (status: RiskStatus) => {
  if (status === 'LOW_RISK') return { label: 'Prime Active', dot: 'bg-tertiary shadow-[0_0_8px_#0ef7d6]', title: 'group-hover:text-primary', scoreBg: 'bg-surface-container-lowest', scoreText: 'text-tertiary', overlayGrad: 'from-black/60' };
  if (status === 'MEDIUM_RISK') return { label: 'Under Review', dot: 'bg-secondary shadow-[0_0_8px_#facc15]', title: 'group-hover:text-secondary', scoreBg: 'bg-secondary/10 border border-secondary/20', scoreText: 'text-secondary', overlayGrad: 'from-black/70' };
  return { label: 'Risk Detected', dot: 'bg-error shadow-[0_0_8px_#ffb4ab]', title: 'group-hover:text-error', scoreBg: 'bg-error/10 border border-error/20', scoreText: 'text-error', overlayGrad: 'from-black/80' };
};

const PropertyHero: React.FC<{ property: Property }> = ({ property }) => {
  const meta = riskMeta(property.riskStatus);
  if (property.imageUrl) {
    return (
      <div className="relative w-full md:w-48 h-32 flex-shrink-0 overflow-hidden rounded-xl">
        <img className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${property.riskStatus === 'HIGH_RISK' ? 'grayscale group-hover:grayscale-0' : ''}`} src={property.imageUrl} alt={property.name} />
        <div className={`absolute inset-0 bg-gradient-to-t ${meta.overlayGrad} to-transparent`}></div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span>
          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{meta.label}</span>
        </div>
      </div>
    );
  }
  // Gradient fallback for properties without imageUrl
  const initials = property.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  const gradient = property.riskStatus === 'LOW_RISK'
    ? 'from-tertiary/30 via-primary/20 to-surface-container-highest'
    : property.riskStatus === 'MEDIUM_RISK'
      ? 'from-secondary/30 via-primary/10 to-surface-container-highest'
      : 'from-error/30 via-surface-container-high to-surface-container-highest';
  return (
    <div className={`relative w-full md:w-48 h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <span className="text-4xl font-black font-headline text-on-surface/70">{initials}</span>
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span>
        <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">{meta.label}</span>
      </div>
    </div>
  );
};

export const Portfolio: React.FC = () => {
  const { properties } = useProperties();

  const distribution = useMemo(() => {
    const lowRisk = properties.filter(p => p.riskStatus === 'LOW_RISK').length;
    const mediumRisk = properties.filter(p => p.riskStatus === 'MEDIUM_RISK').length;
    const highRisk = properties.filter(p => p.riskStatus === 'HIGH_RISK').length;
    return { lowRisk, mediumRisk, highRisk };
  }, [properties]);

  const sorted = useMemo(() =>
    [...properties].sort((a, b) => b.liquidityScore - a.liquidityScore),
  [properties]);

  return (
    <Layout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">Property Portfolio</h2>
          <p className="text-outline max-w-lg">Manage and analyze your high-liquidity real estate assets with real-time AI appraisal scores and automated risk monitoring.</p>
        </div>
        <div className="flex gap-4">
          <ComingSoon label="Filters — Coming Q2 2026">
            <Button variant="secondary" icon={<span className="material-symbols-outlined">filter_list</span>}>Filters</Button>
          </ComingSoon>
          <ComingSoon label="Bulk register — Coming Q2 2026. Use Dashboard scan instead.">
            <Button icon={<span className="material-symbols-outlined">add_circle</span>}>Register Asset</Button>
          </ComingSoon>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-8">
          <Card level="low" className="rounded-[32px] p-8 space-y-6">
            <h3 className="font-headline text-lg font-bold text-primary">Portfolio Distribution</h3>
            <div className="space-y-4">
              <Card level="high" nested>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1">Low Risk</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-tertiary">{String(distribution.lowRisk).padStart(2, '0')}</span>
                  <span className="text-xs text-tertiary flex items-center gap-1"><span className="material-symbols-outlined text-sm">trending_up</span> Stable</span>
                </div>
              </Card>
              <Card level="high" nested>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1">Medium Risk</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-on-surface">{String(distribution.mediumRisk).padStart(2, '0')}</span>
                  <span className="text-xs text-outline flex items-center gap-1">Monitor</span>
                </div>
              </Card>
              <Card level="high" nested>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1">High Risk</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-error">{String(distribution.highRisk).padStart(2, '0')}</span>
                  {distribution.highRisk > 0 ? (
                    <span className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-sm">warning</span> Action Req.</span>
                  ) : (
                    <span className="text-xs text-outline">All clear</span>
                  )}
                </div>
              </Card>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/10">
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-outline">Sort by:</span>
              <ComingSoon label="Sorting — Coming Q2 2026">
                <button className="text-sm font-bold text-tertiary flex items-center gap-1">Liquidity <span className="material-symbols-outlined text-sm">arrow_downward</span></button>
              </ComingSoon>
              <ComingSoon label="Sorting — Coming Q2 2026">
                <button className="text-sm font-medium text-outline">Value</button>
              </ComingSoon>
            </div>
            <div className="text-xs text-outline">Showing <span className="text-on-surface font-bold">{properties.length} {properties.length === 1 ? 'Property' : 'Properties'}</span></div>
          </div>

          {sorted.length === 0 ? (
            <Card className="text-center py-16">
              <p className="text-outline text-sm mb-4">Your portfolio is empty.</p>
              <Link to="/" className="inline-flex items-center gap-2 text-primary text-sm font-bold underline">
                Run your first analysis <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {sorted.map(p => {
                const meta = riskMeta(p.riskStatus);
                return (
                  <Link
                    key={p.id}
                    to={`/portfolio/${p.id}`}
                    className="group flex flex-col md:flex-row items-center gap-6 p-4 bg-surface-container-low md:rounded-full rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-tertiary/10"
                  >
                    <PropertyHero property={p} />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 w-full items-center">
                      <div className="md:col-span-4">
                        <h4 className={`font-headline text-lg font-bold text-on-surface transition-colors ${meta.title}`}>{p.name}</h4>
                        <p className="text-sm text-outline flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {p.city}{p.state ? `, ${p.state}` : ''}</p>
                      </div>
                      <div className="md:col-span-3">
                        <div className={`text-center px-4 py-2 rounded-xl ${meta.scoreBg}`}>
                          <p className="text-[9px] text-outline uppercase tracking-widest mb-1">Liquidity Score</p>
                          <p className={`text-2xl font-bold font-headline ${meta.scoreText}`}>{p.liquidityScore.toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="md:col-span-3 text-center">
                        <p className="text-[9px] text-outline uppercase tracking-widest mb-1">Market Value</p>
                        <p className="text-lg font-bold text-on-surface">{fmtMoney(p.marketValue)}</p>
                        <p className="text-[10px] text-outline">{p.timeToLiquidity} days to sell</p>
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-2" onClick={e => { e.stopPropagation(); e.preventDefault(); }}>
                        <ComingSoon label="Per-asset export — Coming Q2 2026" block>
                          <button className="w-full py-2 px-3 rounded-xl bg-surface-container-highest text-primary text-[11px] font-bold">Export</button>
                        </ComingSoon>
                        {p.riskStatus === 'HIGH_RISK' ? (
                          <ComingSoon label="Alert resolution — Coming Q2 2026" block>
                            <button className="w-full py-2 px-3 rounded-xl bg-error/20 text-error text-[11px] font-bold">Resolve Alert</button>
                          </ComingSoon>
                        ) : (
                          <ComingSoon label="Review workflow — Coming Q2 2026" block>
                            <button className="w-full py-2 px-3 rounded-xl border border-outline-variant/30 text-on-surface text-[11px] font-bold">Review</button>
                          </ComingSoon>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
