import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface PropertyAssessment {
  title: string;
  detail: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  icon: string;
}

export type RiskStatus = 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  propertyType: string;
  marketValue: number;
  liquidityScore: number;
  riskStatus: RiskStatus;
  timeToLiquidity: number;
  confidence: number;
  assessments: PropertyAssessment[];
  summary: string;
  createdAt: string;
}

const STORAGE_KEY = 'appraisiq_properties';

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const SEED: Property[] = [
  {
    id: 'seed-001',
    name: 'One Central Plaza',
    address: '1450 Broadway',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    propertyType: 'Commercial',
    marketValue: 142500000,
    liquidityScore: 94.8,
    riskStatus: 'LOW_RISK',
    timeToLiquidity: 18,
    confidence: 96,
    assessments: [
      { title: 'Prime Location Premium', detail: 'Property benefits from a 15% location premium due to high foot traffic and proximity to major transit hubs.', sentiment: 'positive', icon: 'check_circle' },
      { title: 'Strong Tenant Profile', detail: '92% of NLA leased to AAA credit rated tenants with WALE > 6.5 years.', sentiment: 'positive', icon: 'trending_up' },
      { title: 'CapEx Requirement', detail: 'Minor HVAC modernization expected within 24 months. Estimated impact on valuation <1.2%.', sentiment: 'neutral', icon: 'info' },
    ],
    summary: 'Class A commercial office in prime Midtown Manhattan location with strong tenant profile and minor CapEx requirements. High liquidity confidence.',
    createdAt: daysAgo(7),
  },
  {
    id: 'seed-002',
    name: '88 Canary Wharf Tower',
    address: '88 Canary Wharf',
    city: 'London',
    state: 'Greater London',
    country: 'United Kingdom',
    propertyType: 'Commercial',
    marketValue: 89000000,
    liquidityScore: 87,
    riskStatus: 'LOW_RISK',
    timeToLiquidity: 32,
    confidence: 89,
    assessments: [
      { title: 'Financial District Demand', detail: 'Canary Wharf retains strong institutional buyer interest despite hybrid-work softening.', sentiment: 'positive', icon: 'check_circle' },
      { title: 'Currency Exposure', detail: 'GBP-denominated; recent volatility may affect cross-border buyer pool.', sentiment: 'neutral', icon: 'info' },
      { title: 'Strong Comparables', detail: '3 nearby comparable sales in past 90 days at 92-96% asking price.', sentiment: 'positive', icon: 'trending_up' },
    ],
    summary: 'Class A office tower in Canary Wharf with stable demand and solid recent comparables. Cross-border buyers may be price-sensitive to GBP movement.',
    createdAt: daysAgo(3),
  },
  {
    id: 'seed-003',
    name: 'Harbor Industrial Park',
    address: '4400 Harbor Ave',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    propertyType: 'Industrial',
    marketValue: 24100000,
    liquidityScore: 44.5,
    riskStatus: 'HIGH_RISK',
    timeToLiquidity: 180,
    confidence: 72,
    assessments: [
      { title: 'Sector Headwinds', detail: 'Industrial demand softening in Pacific Northwest; vacancy up 4.2pp YoY.', sentiment: 'negative', icon: 'trending_down' },
      { title: 'Single-Tenant Risk', detail: 'Sole tenant lease expires in 14 months with no renewal commitment.', sentiment: 'negative', icon: 'warning' },
      { title: 'Below Market Rate', detail: 'Current rent 18% below market average — re-leasing risk significant.', sentiment: 'neutral', icon: 'info' },
    ],
    summary: 'Industrial asset facing significant headwinds: sector softening, single-tenant lease expiry approaching, and below-market rent. Liquidity is impaired.',
    createdAt: daysAgo(1),
  },
];

export type NewPropertyInput = Omit<Property, 'id' | 'createdAt' | 'name'> & { name?: string };

interface PropertiesContextValue {
  properties: Property[];
  addProperty: (data: NewPropertyInput) => Property;
  getProperty: (id: string) => Property | undefined;
  clearAll: () => void;
}

const PropertiesContext = createContext<PropertiesContextValue | null>(null);

const loadInitial = (): Property[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore corrupted storage
  }
  return SEED;
};

export const PropertiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    } catch {
      // storage quota / disabled — silently degrade
    }
  }, [properties]);

  const addProperty = useCallback((data: NewPropertyInput): Property => {
    const property: Property = {
      ...data,
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: data.name || data.address || `${data.city} Asset`,
      createdAt: new Date().toISOString(),
    };
    setProperties(prev => [property, ...prev]);
    return property;
  }, []);

  const getProperty = useCallback((id: string) => properties.find(p => p.id === id), [properties]);

  const clearAll = useCallback(() => setProperties(SEED), []);

  return (
    <PropertiesContext.Provider value={{ properties, addProperty, getProperty, clearAll }}>
      {children}
    </PropertiesContext.Provider>
  );
};

export const useProperties = (): PropertiesContextValue => {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error('useProperties must be used within PropertiesProvider');
  return ctx;
};
