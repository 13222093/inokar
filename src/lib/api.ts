// Centralized API client with mock fallback for MVP
const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: { page: number; pageSize: number; total: number; totalPages: number };
  error?: { code: string; message: string; details?: unknown[] };
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('liquifi_token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ success: false, error: { code: 'NETWORK', message: res.statusText } }));
    throw error;
  }
  return res.json();
}

// ─── Mock Data (MVP fallbacks) ─────────────────────────────────────

const mockDashboardSummary = {
  liquidityScore: 78,
  portfolioValue: 412_800_000,
  avgTimeToSell: 42,
  assetCount: 14,
};

const mockPortfolioDistribution = {
  highLiquidity: 142,
  underReview: 28,
  riskWarning: 4,
};

const mockRecentRequests = [
  { id: '1', score: 92, riskStatus: 'LOW_RISK', createdAt: new Date().toISOString(), property: { name: '88 Canary Wharf Tower', address: 'London, E14 5AA', city: 'London', smeName: 'Lumina Tech Solutions' } },
  { id: '2', score: 67, riskStatus: 'MEDIUM_RISK', createdAt: new Date().toISOString(), property: { name: 'Apex Plaza Retail', address: 'San Francisco, CA', city: 'San Francisco', smeName: 'Sterling Holdings' } },
];

const mockRiskMetrics = {
  portfolioHealth: 84.2,
  marketExposure: 4_200_000_000,
  liquidReserve: 18.5,
  systemUptime: 99.9,
  unresolvedAlerts: 3,
};

const mockHighRiskAssets = [
  { id: '1', type: 'LIQUIDITY_DROP', delta: -14.2, property: { name: 'Apex Plaza Retail', city: 'San Francisco', state: 'CA' } },
  { id: '2', type: 'VACANCY_RISK', delta: -9.8, property: { name: 'Centennial Tower', city: 'Austin', state: 'TX' } },
  { id: '3', type: 'SEVERE_OUTFLOW', delta: -1.2, property: { name: 'Harbor Light Logistics', city: 'Seattle', state: 'WA' } },
];

const mockProperties = [
  {
    id: 'prop-1', name: 'One Central Plaza', address: '1450 Broadway', city: 'New York', state: 'New York', country: 'United States',
    lat: 40.7549, lng: -73.9840, propertyType: 'COMMERCIAL', status: 'ACTIVE',
    marketValue: 142_500_000, liquidityScore: 94.8, capRate: 5.8, occupancyRate: 96,
    timeToLiquidity: 18, yoyChange: 4.2, smeName: 'Lumina Tech Solutions',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTWcdKXrOsrQ72tkfeQxBFHZDpKD5jIXN1CIVkjWYGfkPfD8KEt55Arm9sWPJNIjNq1sPnAnInFTCEbpqeKHdo7mM3J5Dd9SLbmaWSa97fGVbaZBUpfHL4Ayz1safPda5zV9ZPJDzrReivtRiF1nNJXR40INGj5zJg0jQBrAouytwZj7UH0GyYGVU6pSAN2qqBHtIRF2H3Wo-rD7UtAcmrGM8J2IGEMDZ75cacFQzNHhhsbFm7V1UXqPoB9vQQxawUHw84GZpfFzbP',
    assessments: [
      { title: 'Prime Location Premium', detail: 'Property benefits from a 15% location premium due to high foot traffic and proximity to major transit hubs.', sentiment: 'positive', icon: 'check_circle' },
      { title: 'Strong Tenant Profile', detail: '92% of NLA leased to AAA credit rated tenants with WALE > 6.5 years.', sentiment: 'positive', icon: 'trending_up' },
      { title: 'CapEx Requirement', detail: 'Minor HVAC modernization expected within 24 months. Estimated impact on valuation <1.2%.', sentiment: 'neutral', icon: 'info' },
    ],
  },
  {
    id: 'prop-2', name: 'Harbor Industrial Park', address: '200 Harbor Ave', city: 'Seattle', state: 'Washington', country: 'United States',
    lat: 47.6062, lng: -122.3321, propertyType: 'INDUSTRIAL', status: 'RISK_DETECTED',
    marketValue: 24_100_000, liquidityScore: 44.5, capRate: 4.1, occupancyRate: 72,
    timeToLiquidity: 85, yoyChange: -12.4, smeName: 'Atlas Logistics Ltd',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBK2lkIEP74GQ6O-76Yftkrv0wtT9GCpDUUad0NZWrBKk1GsHRndZ1o713FknqyrVUdMiMmnShnJvgh8RRUQS1yc_72GtjNo_kgWhiCBBIaPN7chzpVs2_4tcC9j0uU3AFgc-er2undGa9INpM9MiChAhA5zQFcvALn-zy5A1FWCP-sNT3n96VRwtby6AZwfrzdV5Ah1QaUIIGgiI8hOKke6C0R3KuIjkYeltP3CfHXumK2SCSJAyJX7fbFbwsZlqO1ORvOogIo4e5T',
    assessments: [],
  },
];

// ─── Public API ────────────────────────────────────────────────────

export async function getDashboardSummary() {
  try { return (await fetchApi<typeof mockDashboardSummary>('/dashboard/summary')).data; }
  catch { return mockDashboardSummary; }
}

export async function getRecentRequests(page = 1, pageSize = 10) {
  try { return await fetchApi<typeof mockRecentRequests>(`/dashboard/recent-requests?page=${page}&pageSize=${pageSize}`); }
  catch { return { success: true, data: mockRecentRequests, pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 } }; }
}

export async function getPortfolioDistribution() {
  try { return (await fetchApi<typeof mockPortfolioDistribution>('/portfolio/distribution')).data; }
  catch { return mockPortfolioDistribution; }
}

export async function getProperties(params: { sort?: string; status?: string; page?: number; pageSize?: number } = {}) {
  try {
    const qs = new URLSearchParams();
    if (params.sort) qs.set('sort', params.sort);
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    return await fetchApi<typeof mockProperties>(`/properties?${qs}`);
  } catch {
    return { success: true, data: mockProperties, pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 } };
  }
}

export async function getPropertyDetail(id: string) {
  try { return (await fetchApi<typeof mockProperties[0]>(`/properties/${id}`)).data; }
  catch { return mockProperties.find(p => p.id === id) ?? mockProperties[0]; }
}

export async function getRiskMetrics() {
  try { return (await fetchApi<typeof mockRiskMetrics>('/risk/metrics')).data; }
  catch { return mockRiskMetrics; }
}

export async function getHighRiskAssets(page = 1, pageSize = 10) {
  try { return await fetchApi<typeof mockHighRiskAssets>(`/risk/high-risk-assets?page=${page}&pageSize=${pageSize}`); }
  catch { return { success: true, data: mockHighRiskAssets, pagination: { page: 1, pageSize: 10, total: 3, totalPages: 1 } }; }
}

export async function searchProperties(q: string) {
  try { return (await fetchApi<Array<{ id: string; name: string; city: string; state: string; liquidityScore: number; status: string }>>(`/search?q=${encodeURIComponent(q)}`)).data; }
  catch { return []; }
}

export async function login(email: string, password: string) {
  return fetchApi<{ user: { id: string; name: string; email: string; role: string }; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, name: string, password: string) {
  return fetchApi<{ user: { id: string; name: string; email: string; role: string }; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  });
}

export function logout() {
  localStorage.removeItem('liquifi_token');
}
