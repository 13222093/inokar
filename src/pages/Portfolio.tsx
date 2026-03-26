import React from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const Portfolio: React.FC = () => {
  return (
    <Layout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">Property Portfolio</h2>
          <p className="text-outline max-w-lg">Manage and analyze your high-liquidity real estate assets with real-time AI appraisal scores and automated risk monitoring.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" icon={<span className="material-symbols-outlined">filter_list</span>}>Filters</Button>
          <Button icon={<span className="material-symbols-outlined">add_circle</span>}>Register Asset</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-8">
          <Card level="low" className="rounded-[32px] p-8 space-y-6">
            <h3 className="font-headline text-lg font-bold text-primary">Portfolio Distribution</h3>
            <div className="space-y-4">
              <Card level="high" nested>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1">High Liquidity</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-tertiary">142</span>
                  <span className="text-xs text-tertiary flex items-center gap-1"><span className="material-symbols-outlined text-sm">trending_up</span> 12%</span>
                </div>
              </Card>
              <Card level="high" nested>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1">Under Review</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-on-surface">28</span>
                  <span className="text-xs text-outline flex items-center gap-1">Stable</span>
                </div>
              </Card>
              <Card level="high" nested>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1">Risk Warning</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-error">04</span>
                  <span className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-sm">warning</span> Action Req.</span>
                </div>
              </Card>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/10">
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-outline">Sort by:</span>
              <button className="text-sm font-bold text-tertiary flex items-center gap-1">Liquidity <span className="material-symbols-outlined text-sm">arrow_downward</span></button>
              <button className="text-sm font-medium text-outline hover:text-on-surface">Value</button>
            </div>
            <div className="text-xs text-outline">Showing <span className="text-on-surface font-bold">14 Properties</span></div>
          </div>
          
          <div className="space-y-4">
            <div className="group flex flex-col md:flex-row items-center gap-6 p-4 bg-surface-container-low md:rounded-full rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-tertiary/10">
              <div className="relative w-full md:w-48 h-32 flex-shrink-0 overflow-hidden rounded-xl">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTWcdKXrOsrQ72tkfeQxBFHZDpKD5jIXN1CIVkjWYGfkPfD8KEt55Arm9sWPJNIjNq1sPnAnInFTCEbpqeKHdo7mM3J5Dd9SLbmaWSa97fGVbaZBUpfHL4Ayz1safPda5zV9ZPJDzrReivtRiF1nNJXR40INGj5zJg0jQBrAouytwZj7UH0GyYGVU6pSAN2qqBHtIRF2H3Wo-rD7UtAcmrGM8J2IGEMDZ75cacFQzNHhhsbFm7V1UXqPoB9vQQxawUHw84GZpfFzbP"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_#0ef7d6]"></span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Prime Active</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 w-full items-center">
                <div className="md:col-span-4">
                  <h4 className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">One Central Plaza</h4>
                  <p className="text-sm text-outline flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> Midtown, New York</p>
                </div>
                <div className="md:col-span-3">
                  <div className="text-center px-4 py-2 bg-surface-container-lowest rounded-xl">
                    <p className="text-[9px] text-outline uppercase tracking-widest mb-1">Liquidity Score</p>
                    <p className="text-2xl font-bold font-headline text-tertiary">94.8</p>
                  </div>
                </div>
                <div className="md:col-span-3 text-center">
                  <p className="text-[9px] text-outline uppercase tracking-widest mb-1">Market Value</p>
                  <p className="text-lg font-bold text-on-surface">$142.5M</p>
                  <p className="text-[10px] text-tertiary">+4.2% YoY</p>
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <button className="w-full py-2 px-3 rounded-xl bg-surface-container-highest text-primary text-[11px] font-bold hover:bg-primary hover:text-on-primary transition-all">Export</button>
                  <button className="w-full py-2 px-3 rounded-xl border border-outline-variant/30 text-on-surface text-[11px] font-bold hover:border-tertiary/50 transition-all">Review</button>
                </div>
              </div>
            </div>
            
            <div className="group flex flex-col md:flex-row items-center gap-6 p-4 bg-surface-container-low md:rounded-full rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-tertiary/10">
              <div className="relative w-full md:w-48 h-32 flex-shrink-0 overflow-hidden rounded-xl">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK2lkIEP74GQ6O-76Yftkrv0wtT9GCpDUUad0NZWrBKk1GsHRndZ1o713FknqyrVUdMiMmnShnJvgh8RRUQS1yc_72GtjNo_kgWhiCBBIaPN7chzpVs2_4tcC9j0uU3AFgc-er2undGa9INpM9MiChAhA5zQFcvALn-zy5A1FWCP-sNT3n96VRwtby6AZwfrzdV5Ah1QaUIIGgiI8hOKke6C0R3KuIjkYeltP3CfHXumK2SCSJAyJX7fbFbwsZlqO1ORvOogIo4e5T"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]"></span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Risk Detected</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 w-full items-center">
                <div className="md:col-span-4">
                  <h4 className="font-headline text-lg font-bold text-on-surface group-hover:text-error transition-colors">Harbor Industrial Park</h4>
                  <p className="text-sm text-outline flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> Seattle, WA</p>
                </div>
                <div className="md:col-span-3">
                  <div className="text-center px-4 py-2 bg-error/10 border border-error/20 rounded-xl">
                    <p className="text-[9px] text-error uppercase tracking-widest mb-1">Liquidity Score</p>
                    <p className="text-2xl font-bold font-headline text-error">44.5</p>
                  </div>
                </div>
                <div className="md:col-span-3 text-center">
                  <p className="text-[9px] text-outline uppercase tracking-widest mb-1">Market Value</p>
                  <p className="text-lg font-bold text-on-surface">$24.1M</p>
                  <p className="text-[10px] text-error">-12.4% YoY</p>
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <button className="w-full py-2 px-3 rounded-xl bg-surface-container-highest text-primary text-[11px] font-bold hover:bg-primary hover:text-on-primary transition-all">Export</button>
                  <button className="w-full py-2 px-3 rounded-xl bg-error/20 text-error text-[11px] font-bold hover:bg-error hover:text-on-error transition-all">Resolve Alert</button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
};
