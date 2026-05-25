import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Layout } from '../components/Layout';
import { ComingSoon } from '../components/ComingSoon';
import { useProperties, type Property, type RiskStatus } from '../hooks/useProperties';
import { useToast } from '../hooks/useToast';

const ResultSkeleton: React.FC = () => (
  <Card className="lg:col-span-7 space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-6 w-44 bg-surface-container-highest rounded" />
      <div className="h-6 w-20 bg-surface-container-highest rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="text-center space-y-2">
          <div className="h-10 w-16 mx-auto bg-surface-container-highest rounded" />
          <div className="h-3 w-20 mx-auto bg-surface-container-highest rounded" />
        </div>
      ))}
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-surface-container-highest rounded" />
      <div className="h-3 w-5/6 bg-surface-container-highest rounded" />
      <div className="h-3 w-4/6 bg-surface-container-highest rounded" />
    </div>
    <div className="space-y-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest/30">
          <div className="h-5 w-5 bg-surface-container-highest rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-surface-container-highest rounded" />
            <div className="h-3 w-full bg-surface-container-highest rounded" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-center gap-2 text-outline text-xs font-bold pt-2">
      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
      Running predictive analysis…
    </div>
  </Card>
);

interface AnalysisResult {
  liquidityScore: number;
  riskStatus: RiskStatus;
  timeToLiquidity: number;
  confidence: number;
  assessments: { title: string; detail: string; sentiment: 'positive' | 'neutral' | 'negative'; icon: string }[];
  summary: string;
}

const fmtMoney = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const riskBadge = (status: RiskStatus) => {
  if (status === 'LOW_RISK') return { label: 'Low Risk', cls: 'bg-tertiary/10 text-tertiary-fixed border-tertiary/20' };
  if (status === 'MEDIUM_RISK') return { label: 'Medium Risk', cls: 'bg-secondary/10 text-secondary border-secondary/20' };
  return { label: 'High Risk', cls: 'bg-error/10 text-error border-error/20' };
};

const scoreColor = (score: number) => score >= 80 ? 'text-tertiary' : score >= 60 ? 'text-primary' : score >= 40 ? 'text-secondary' : 'text-error';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { properties, addProperty } = useProperties();
  const { success, error: toastError } = useToast();

  const [country, setCountry] = useState('United Kingdom');
  const [state, setState] = useState('Greater London');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!city) { setError('Please enter a city'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, state, city, address, propertyType: 'Commercial', marketValue: 50000000 }),
      });
      const data = await res.json();
      if (data.success) {
        const analysis: AnalysisResult = data.data;
        setResult(analysis);
        const saved = addProperty({
          address,
          city,
          state,
          country,
          propertyType: 'Commercial',
          marketValue: 50000000,
          liquidityScore: analysis.liquidityScore,
          riskStatus: analysis.riskStatus,
          timeToLiquidity: analysis.timeToLiquidity,
          confidence: analysis.confidence,
          assessments: analysis.assessments,
          summary: analysis.summary,
        });
        success(`Saved "${saved.name}" to portfolio`, {
          action: { label: 'View in portfolio →', onClick: () => navigate(`/portfolio/${saved.id}`) },
        });
      } else {
        const msg = data.error?.message || 'Analysis failed';
        setError(msg);
        toastError(msg);
      }
    } catch {
      const msg = 'Network error — try again';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const aggregates = useMemo(() => {
    if (properties.length === 0) return { avgScore: 0, totalValue: 0, avgDays: 0, activeCount: 0 };
    const totalValue = properties.reduce((s, p) => s + p.marketValue, 0);
    const avgScore = properties.reduce((s, p) => s + p.liquidityScore, 0) / properties.length;
    const avgDays = Math.round(properties.reduce((s, p) => s + p.timeToLiquidity, 0) / properties.length);
    const activeCount = properties.filter(p => p.liquidityScore >= 70).length;
    return { avgScore, totalValue, avgDays, activeCount };
  }, [properties]);

  const recent = useMemo(() =>
    [...properties]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  [properties]);

  const exportProperty = async (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    if (exportingId) return;
    setExportingId(property.id);
    try {
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
          capRate: 5.8,
          occupancyRate: 96,
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
    } catch (err) {
      console.error(err);
      toastError('Export failed. Check your connection and retry.');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <Layout>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card level="gradient" className="relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
          <p className="text-outline text-xs font-bold uppercase tracking-widest mb-2">Avg. Liquidity Score</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black font-headline text-primary">{Math.round(aggregates.avgScore)}</h2>
            <span className="text-outline text-lg font-bold">/100</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-tertiary">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs font-bold">{properties.length} assets in portfolio</span>
          </div>
        </Card>

        <Card level="gradient" className="relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-all"></div>
          <p className="text-outline text-xs font-bold uppercase tracking-widest mb-2">Portfolio Value</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black font-headline text-on-surface">{fmtMoney(aggregates.totalValue)}</h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            <span className="text-xs font-bold">{aggregates.activeCount} High-Liquidity Assets</span>
          </div>
        </Card>

        <Card level="gradient" className="relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all"></div>
          <p className="text-outline text-xs font-bold uppercase tracking-widest mb-2">Avg. Time-to-Sell</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black font-headline text-secondary">{aggregates.avgDays}</h2>
            <span className="text-outline text-lg font-bold">Days</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="text-xs font-bold">Across all monitored assets</span>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-5 space-y-6">
          <div>
            <h2 className="font-headline text-4xl font-extrabold text-on-surface mb-4 leading-tight">Instant Asset <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">Liquidity Mapping.</span></h2>
            <p className="text-outline text-sm">Define property location for AI-driven liquidity analysis.</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-outline tracking-wider ml-1">Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg text-sm text-on-surface py-3 px-3 outline-none focus:ring-2 ring-surface-tint/20">
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>Germany</option>
                  <option>Singapore</option>
                  <option>Australia</option>
                  <option>Japan</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-outline tracking-wider ml-1">Province / State</label>
                <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg text-sm text-on-surface py-3 px-3 outline-none focus:ring-2 ring-surface-tint/20">
                  <option>Greater London</option>
                  <option>New York</option>
                  <option>Bavaria</option>
                  <option>California</option>
                  <option>Texas</option>
                </select>
              </div>
            </div>
            <Input label="City" placeholder="e.g. London" value={city} onChange={e => setCity(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-outline tracking-wider ml-1">Street / Specific Address</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg focus-within:ring-2 ring-surface-tint/20 flex items-center">
                  <input className="bg-transparent border-none text-sm text-on-surface px-3 py-3 w-full outline-none" placeholder="221B Baker St" type="text" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <ComingSoon label="Geo-pin picker — Coming Q2 2026">
                  <button className="bg-surface-container-lowest text-tertiary px-4 py-3 rounded-lg flex items-center justify-center border border-outline-variant/10">
                    <span className="material-symbols-outlined">location_on</span>
                  </button>
                </ComingSoon>
              </div>
            </div>
          </div>
          {error && <p className="text-error text-xs font-bold">{error}</p>}
          <Button
            variant="ghost"
            className="w-full border border-tertiary/20 text-tertiary font-bold hover:bg-tertiary/10"
            icon={<span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>{loading ? 'progress_activity' : 'auto_awesome'}</span>}
            onClick={runAnalysis}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Run Predictive Analysis'}
          </Button>
        </Card>

        {loading ? (
          <ResultSkeleton />
        ) : result ? (
          <Card className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xl font-bold">AI Analysis Result</h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${riskBadge(result.riskStatus).cls}`}>
                {riskBadge(result.riskStatus).label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className={`text-3xl font-black ${scoreColor(result.liquidityScore)}`}>{Math.round(result.liquidityScore)}</p>
                <p className="text-[10px] uppercase font-bold text-outline tracking-widest">Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-secondary">{result.timeToLiquidity}</p>
                <p className="text-[10px] uppercase font-bold text-outline tracking-widest">Days to Sell</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-tertiary">{result.confidence}%</p>
                <p className="text-[10px] uppercase font-bold text-outline tracking-widest">Confidence</p>
              </div>
            </div>
            <p className="text-sm text-outline">{result.summary}</p>
            <div className="space-y-3">
              {result.assessments.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest/30">
                  <span className={`material-symbols-outlined text-sm mt-0.5 ${a.sentiment === 'positive' ? 'text-tertiary' : a.sentiment === 'negative' ? 'text-error' : 'text-secondary'}`}>{a.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{a.title}</p>
                    <p className="text-xs text-outline">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="lg:col-span-7 !p-0 relative min-h-[400px]">
            <img alt="Map" className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0H88nQv3cvO-j7GpmzSAUhfvzUZZyPNhoYMU49f8am6VjNTiGe6XVV2gZqhmQXA1UuQyilXYMBaASJvn0GoLUeHxyJesZ43Q9UidVZpkMxeb2SCPvd5MvPlxrd-cuiGakoxktSzRAg2D1Z7RrssIRrIMKrSGc1FmBu2iAJKlaGTTxNrAP6YOUCFgZ_WcQUaRlNJRH7jCKL6zRTzIv2tbSwZLWaCaB4pQ139MRcggMugkgv6ajKr0mYPnlq4dVqgF1sbdUCHWxTnwk"/>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 left-6 right-6 glass-effect p-4 rounded-xl flex items-center justify-between border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">gps_fixed</span>
                </div>
                <div>
                  <p className="text-xs text-outline font-bold uppercase tracking-widest">Pin Precision</p>
                  <p className="text-sm font-semibold text-on-surface">51.5237° N, 0.1585° W</p>
                </div>
              </div>
              <ComingSoon label="Manual pin adjust — Coming Q2 2026">
                <button className="text-xs font-bold text-tertiary bg-tertiary/10 px-4 py-2 rounded-full border border-tertiary/20">
                  Manual Adjust
                </button>
              </ComingSoon>
            </div>
          </Card>
        )}
      </section>

      <Card className="!p-0 border border-outline-variant/10">
        <div className="p-6 flex justify-between items-center border-b border-outline-variant/10">
          <div>
            <h3 className="font-headline text-xl font-bold">Recent Score Requests</h3>
            <p className="text-xs text-outline mt-1">Click a row to open detail • last {recent.length} of {properties.length}</p>
          </div>
          <ComingSoon label="Bulk export — Coming Q2 2026">
            <button className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              Export Report <span className="material-symbols-outlined text-sm">download</span>
            </button>
          </ComingSoon>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest/30">
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">Property</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">Risk Status</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">Score</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-outline text-sm">No score requests yet. Run your first analysis above.</td></tr>
              ) : recent.map(p => {
                const badge = riskBadge(p.riskStatus);
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/portfolio/${p.id}`)}
                    className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-xs text-outline">{fmtMoney(p.marketValue)} • {p.propertyType}</p>
                    </td>
                    <td className="px-6 py-5"><p className="text-sm font-medium text-outline">{p.city}{p.state ? `, ${p.state}` : ''}</p></td>
                    <td className="px-6 py-5"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${badge.cls}`}>{badge.label}</span></td>
                    <td className="px-6 py-5"><p className={`text-lg font-bold ${scoreColor(p.liquidityScore)}`}>{Math.round(p.liquidityScore)}</p></td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => exportProperty(p, e)}
                        disabled={exportingId === p.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-tertiary bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/20 transition-all disabled:opacity-50"
                      >
                        <span className={`material-symbols-outlined text-sm ${exportingId === p.id ? 'animate-spin' : ''}`}>
                          {exportingId === p.id ? 'progress_activity' : 'download'}
                        </span>
                        {exportingId === p.id ? 'Exporting…' : 'Export'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </Layout>
  );
};
