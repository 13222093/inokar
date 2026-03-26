import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Layout } from '../components/Layout';

export const Dashboard: React.FC = () => {
  return (
    <Layout>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card level="gradient" className="relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
          <p className="text-outline text-xs font-bold uppercase tracking-widest mb-2">Liquidity Score</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black font-headline text-primary">78</h2>
            <span className="text-outline text-lg font-bold">/100</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-tertiary">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs font-bold">+2.4% from last month</span>
          </div>
        </Card>
        
        <Card level="gradient" className="relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-all"></div>
          <p className="text-outline text-xs font-bold uppercase tracking-widest mb-2">Portfolio Value</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black font-headline text-on-surface">£412.8M</h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            <span className="text-xs font-bold">14 Active High-Value Assets</span>
          </div>
        </Card>

        <Card level="gradient" className="relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all"></div>
          <p className="text-outline text-xs font-bold uppercase tracking-widest mb-2">Avg. Time-to-Sell</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black font-headline text-secondary">42</h2>
            <span className="text-outline text-lg font-bold">Days</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-error">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="text-xs font-bold">+5 days increase (Market Shift)</span>
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
                <select className="w-full bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg text-sm text-on-surface py-3 px-3 outline-none focus:ring-2 ring-surface-tint/20">
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>Germany</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-outline tracking-wider ml-1">Province / State</label>
                <select className="w-full bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg text-sm text-on-surface py-3 px-3 outline-none focus:ring-2 ring-surface-tint/20">
                  <option>Greater London</option>
                  <option>New York</option>
                  <option>Bavaria</option>
                </select>
              </div>
            </div>
            <Input label="City" placeholder="e.g. London" />
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-outline tracking-wider ml-1">Street / Specific Address</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg focus-within:ring-2 ring-surface-tint/20 flex items-center">
                  <input className="bg-transparent border-none text-sm text-on-surface px-3 py-3 w-full outline-none" placeholder="221B Baker St" type="text"/>
                </div>
                <button className="bg-surface-container-lowest text-tertiary px-4 rounded-lg flex items-center justify-center hover:bg-surface-container-highest transition-all border border-outline-variant/10">
                  <span className="material-symbols-outlined">location_on</span>
                </button>
              </div>
            </div>
          </div>
          <Button variant="ghost" className="w-full border border-tertiary/20 text-tertiary font-bold hover:bg-tertiary/10" icon={<span className="material-symbols-outlined">auto_awesome</span>}>
            Run Predictive Analysis
          </Button>
        </Card>

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
            <button className="text-xs font-bold text-tertiary bg-tertiary/10 px-4 py-2 rounded-full hover:bg-tertiary/20 border border-tertiary/20 transition-all">
              Manual Adjust
            </button>
          </div>
        </Card>
      </section>

      <Card className="!p-0 border border-outline-variant/10">
        <div className="p-6 flex justify-between items-center border-b border-outline-variant/10">
          <h3 className="font-headline text-xl font-bold">Recent Score Requests</h3>
          <button className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-80">
            Export Report <span className="material-symbols-outlined text-sm">download</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest/30">
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">Property Address</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">SME Name</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">Risk Status</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">Score</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-outline tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              <tr className="hover:bg-white/[0.03] transition-colors group">
                <td className="px-6 py-5">
                  <p className="text-sm font-semibold text-on-surface">88 Canary Wharf Tower</p>
                  <p className="text-xs text-outline">London, E14 5AA</p>
                </td>
                <td className="px-6 py-5"><p className="text-sm font-medium">Lumina Tech Solutions</p></td>
                <td className="px-6 py-5"><span className="px-3 py-1 rounded-full text-[10px] font-bold bg-tertiary/10 text-tertiary-fixed uppercase border border-tertiary/20">Low Risk</span></td>
                <td className="px-6 py-5"><p className="text-lg font-bold text-primary">92</p></td>
                <td className="px-6 py-5"><button className="text-outline hover:text-primary"><span className="material-symbols-outlined">more_vert</span></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <button className="fixed bottom-10 right-10 w-16 h-16 rounded-full liquid-gradient text-on-primary shadow-2xl shadow-primary/40 flex items-center justify-center group hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-3xl font-bold">add_location_alt</span>
        <span className="absolute right-20 bg-surface-container-highest px-4 py-2 rounded-lg text-xs font-bold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-outline-variant/10">New Asset Scan</span>
      </button>
    </Layout>
  );
};
