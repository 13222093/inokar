import React from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const PropertyDetail: React.FC = () => {
  return (
    <Layout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-tertiary font-bold tracking-widest text-[10px] uppercase font-manrope">Ref: LP-0482-NY</span>
            <span className="px-2 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold rounded uppercase tracking-wider font-manrope border border-tertiary/20">Active Asset</span>
          </div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">One Central Plaza</h2>
          <p className="text-outline text-sm flex items-center gap-2 font-manrope">
            <span className="material-symbols-outlined text-[16px]">location_on</span> 
            1450 Broadway, Midtown Manhattan, NY 10018
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" icon={<span className="material-symbols-outlined">download</span>}>Export Report</Button>
          <Button icon={<span className="material-symbols-outlined">edit</span>}>Update Appraisal</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1 border border-outline-variant/10 text-center flex flex-col items-center justify-center p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-2">AI Liquidity Score</p>
          <div className="relative">
            <div className="w-40 h-40 rounded-full border-4 border-surface-container-high flex items-center justify-center relative z-10">
              <div className="absolute inset-0 rounded-full border-4 border-tertiary border-r-transparent border-b-transparent rotate-45"></div>
              <h3 className="text-6xl font-black font-headline text-tertiary">94<span className="text-2xl text-outline font-medium">.8</span></h3>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-tertiary/20 rounded-full blur-2xl -z-0"></div>
          </div>
          <p className="text-tertiary font-bold text-sm mt-6 font-manrope flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span> Top 5% Tier
          </p>
        </Card>
        
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <Card level="high" className="border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-1">Current Market Value</p>
            <h4 className="text-3xl font-bold text-on-surface font-headline mb-4">$142.5M</h4>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-tertiary/10 text-tertiary-fixed-dim text-[10px] font-bold rounded">+4.2% YoY</span>
              <span className="text-xs text-outline font-manrope">Last updated: 2 days ago</span>
            </div>
          </Card>
          <Card level="high" className="border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-1">Est. Time-to-Liquidity</p>
            <h4 className="text-3xl font-bold text-primary font-headline mb-4">18 Days</h4>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary-fixed-dim text-[10px] font-bold rounded">-15% faster</span>
              <span className="text-xs text-outline font-manrope">Than market average</span>
            </div>
          </Card>
          <Card level="high" className="border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-1">Yield (Cap Rate)</p>
            <h4 className="text-3xl font-bold text-on-surface font-headline mb-4">5.8%</h4>
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full w-[60%]"></div>
            </div>
          </Card>
          <Card level="high" className="border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-manrope mb-1">Occupancy Risk</p>
            <h4 className="text-3xl font-bold text-on-surface font-headline mb-4">Low (4%)</h4>
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[10%]"></div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="!p-0 border border-outline-variant/10 h-80 relative">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTWcdKXrOsrQ72tkfeQxBFHZDpKD5jIXN1CIVkjWYGfkPfD8KEt55Arm9sWPJNIjNq1sPnAnInFTCEbpqeKHdo7mM3J5Dd9SLbmaWSa97fGVbaZBUpfHL4Ayz1safPda5zV9ZPJDzrReivtRiF1nNJXR40INGj5zJg0jQBrAouytwZj7UH0GyYGVU6pSAN2qqBHtIRF2H3Wo-rD7UtAcmrGM8J2IGEMDZ75cacFQzNHhhsbFm7V1UXqPoB9vQQxawUHw84GZpfFzbP" className="w-full h-full object-cover rounded-xl" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl"></div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
             <div>
                <p className="text-white font-bold font-headline text-xl">Property Visual</p>
                <p className="text-white/70 text-sm font-manrope">Class A Commercial Office</p>
             </div>
             <Button variant="tertiary" className="text-xs py-2 px-4"><span className="material-symbols-outlined text-[16px]">visibility</span> View Gallery</Button>
          </div>
        </Card>
        
        <Card className="border border-outline-variant/10">
          <h3 className="font-headline font-bold text-lg mb-4">AI Liquidity Assessment</h3>
          <div className="space-y-4">
             <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Prime Location Premium</h4>
                  <p className="text-xs text-outline leading-relaxed mt-1">Property benefits from a 15% location premium due to high foot traffic and proximity to major transit hubs.</p>
                </div>
             </div>
             <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Strong Tenant Profile</h4>
                  <p className="text-xs text-outline leading-relaxed mt-1">92% of NLA leased to AAA credit rated tenants with WALE &gt; 6.5 years.</p>
                </div>
             </div>
             <div className="flex gap-4 items-start">
                <span className="material-symbols-outlined text-outline">info</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">CapEx Requirement</h4>
                  <p className="text-xs text-outline leading-relaxed mt-1">Minor HVAC modernization expected within 24 months. Estimated impact on valuation &lt;1.2%.</p>
                </div>
             </div>
          </div>
        </Card>
      </div>

    </Layout>
  );
};
