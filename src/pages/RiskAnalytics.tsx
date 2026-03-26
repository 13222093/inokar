import React from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';

export const RiskAnalytics: React.FC = () => {
  return (
    <Layout>
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-[10px] uppercase mb-2 block">Real-Time Risk Monitoring</span>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Risk Portfolio <span className="text-primary">Analytics</span></h2>
          <p className="text-outline mt-2 max-w-2xl">Visualizing multi-sector liquidity exposure and geographic risk concentration using machine learning volatility projections.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/10">
          <button className="px-5 py-2 rounded-lg bg-surface-container-high text-xs font-bold text-primary shadow-lg">Global</button>
          <button className="px-5 py-2 rounded-lg hover:bg-surface-container-high text-xs font-bold text-outline">North America</button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[ { title: 'Health', value: '84.2', color: 'bg-tertiary', text: 'text-tertiary', delta: '+2.1%', pct: '84%' },
           { title: 'Exposure', value: '$4.2B', color: 'bg-primary', text: 'text-primary', delta: 'STABLE', pct: '65%' },
           { title: 'Reserve', value: '18.5%', color: 'bg-error', text: 'text-error', delta: '-0.8%', pct: '18%' },
           { title: 'Uptime', value: '99.9%', color: 'bg-tertiary', text: 'text-tertiary', delta: 'NOMINAL', pct: '99%' }
        ].map((item, idx) => (
          <Card key={idx} level="low" className="flex flex-col justify-between h-32 border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{item.title}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.color}/10 ${item.text}`}>{item.delta}</span>
            </div>
            <h4 className={`text-3xl font-bold font-headline ${item.text}`}>{item.value}</h4>
            <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden mt-2">
              <div className={`h-full ${item.color}`} style={{ width: item.pct }}></div>
            </div>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card level="low" className="lg:col-span-8 !p-0 border border-outline-variant/10 flex flex-col">
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
            <div>
              <h3 className="font-headline font-bold text-lg">Geographic Risk Distribution</h3>
              <p className="text-xs text-outline">Global hotspot intensity based on sector volatility</p>
            </div>
          </div>
          <div className="relative h-[480px] bg-background flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-cover opacity-30 mix-blend-screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvjgK63io3JArGi6kBJ1NOkj1Blu5dOxk8yQ0UZ37fCe6Rz6yrNBtNk3Ij2qTjW6P0u6cqamwuC5klu7-_sffYmlpv2pSSD-IkF-ohhVs7uUIF9nHnW8VOrC7hurn1g6MSfpHR47hNzG4rlMvqhLABqqPhaKSVU-mD5S2uV2bMS6kFLOYbz_Z5NdkvWDVS4pr8hvozKYI_e6fjfxIDidkySiyR_r53__-3tw3-pZHVxP-QyJ8GFi89XgMWQqo23_kPreLCpI6jxkAi"/>
          </div>
        </Card>

        <Card level="low" className="lg:col-span-4 !p-0 border border-outline-variant/10 flex flex-col">
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
            <h3 className="font-headline font-bold text-lg">High Risk Assets</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[480px]">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-outline-variant/5">
                {[
                  { name: "Apex Plaza Retail", loc: "San Francisco, CA", delta: "-14.2%", status: "Liquidity Drop", risk: true },
                  { name: "Centennial Tower", loc: "Austin, TX", delta: "-9.8%", status: "Vacancy Risk", risk: true },
                  { name: "Harbor Light Logs", loc: "Seattle, WA", delta: "-1.2%", status: "Stable Monitor", risk: false }
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-high/40 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-on-surface">{item.name}</p>
                      <p className="text-[10px] text-outline">{item.loc}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`${item.risk ? 'text-error' : 'text-on-surface'} font-bold text-sm`}>
                          {item.delta}
                        </span>
                        <span className="text-[9px] text-outline uppercase">{item.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
