import { PrismaClient, PropertyStatus, PropertyType, AlertType, RiskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const cities = [
  { city: 'New York', state: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { city: 'London', state: 'Greater London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { city: 'San Francisco', state: 'California', country: 'United States', lat: 37.7749, lng: -122.4194 },
  { city: 'Seattle', state: 'Washington', country: 'United States', lat: 47.6062, lng: -122.3321 },
  { city: 'Austin', state: 'Texas', country: 'United States', lat: 30.2672, lng: -97.7431 },
  { city: 'Rotterdam', state: 'South Holland', country: 'Netherlands', lat: 51.9244, lng: 4.4777 },
  { city: 'Singapore', state: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'Berlin', state: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { city: 'Toronto', state: 'Ontario', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { city: 'Sydney', state: 'NSW', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { city: 'Dubai', state: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { city: 'Tokyo', state: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { city: 'Munich', state: 'Bavaria', country: 'Germany', lat: 48.1351, lng: 11.582 },
  { city: 'Phoenix', state: 'Arizona', country: 'United States', lat: 33.4484, lng: -112.074 },
];

const propertyNames = [
  'One Central Plaza', 'The Nexus Logistics', 'Harbor Industrial Park', 'Oakwood Terraces',
  'Canary Wharf Tower', 'Apex Plaza Retail', 'Centennial Office Tower', 'The Grand Mall',
  'Harbor Light Logistics', 'Pacific Gateway', 'Meridian Heights', 'Atlas Commerce Center',
  'Pinnacle Residences', 'Quantum Tech Campus', 'Riverside Executive Park', 'Crown Business Hub',
  'Emerald Square', 'Noble Tower', 'Skyline Lofts', 'The Foundry District',
];

const smeNames = [
  'Lumina Tech Solutions', 'Vertex Capital Group', 'Horizon Real Estate Inc', 'Atlas Logistics Ltd',
  'Pacific Ventures', 'Sterling Holdings', 'Meridian Investments', 'Quantum Analytics',
  'Crown Capital Corp', 'Noble Ventures Ltd', 'Skyline Partners', 'Emerald Corp',
];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing
  await prisma.aiAssessment.deleteMany();
  await prisma.scoreRequest.deleteMany();
  await prisma.riskAlert.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const password = await bcrypt.hash('demo1234', 12);
  const user = await prisma.user.create({
    data: { email: 'analyst@liquifi.io', name: 'Analyst 042', role: 'ANALYST', password },
  });

  const admin = await prisma.user.create({
    data: { email: 'admin@liquifi.io', name: 'Marcus Chen', role: 'ADMIN', password },
  });

  // Create 174 properties: 142 ACTIVE, 28 UNDER_REVIEW, 4 RISK_DETECTED
  const statusDistribution: { status: PropertyStatus; count: number }[] = [
    { status: 'ACTIVE', count: 142 },
    { status: 'UNDER_REVIEW', count: 28 },
    { status: 'RISK_DETECTED', count: 4 },
  ];

  let propIndex = 0;

  for (const { status, count } of statusDistribution) {
    for (let i = 0; i < count; i++) {
      const loc = pick(cities);
      const nameBase = pick(propertyNames);
      const liquidityScore = status === 'RISK_DETECTED'
        ? rand(20, 50)
        : status === 'UNDER_REVIEW'
          ? rand(50, 70)
          : rand(70, 99);
      const marketValue = rand(5_000_000, 200_000_000);

      const property = await prisma.property.create({
        data: {
          name: `${nameBase} ${propIndex > 19 ? `#${propIndex}` : ''}`.trim(),
          address: `${Math.floor(rand(1, 999))} ${pick(['Broadway', 'Main St', 'High St', 'Market St', 'King Rd'])}`,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          lat: loc.lat + rand(-0.05, 0.05),
          lng: loc.lng + rand(-0.05, 0.05),
          propertyType: pick(['COMMERCIAL', 'RESIDENTIAL', 'INDUSTRIAL', 'MIXED_USE']) as PropertyType,
          status,
          marketValue: Math.round(marketValue),
          liquidityScore: Math.round(liquidityScore * 10) / 10,
          capRate: Math.round(rand(3, 8) * 10) / 10,
          occupancyRate: Math.round(rand(70, 99) * 10) / 10,
          timeToLiquidity: Math.floor(rand(10, 90)),
          yoyChange: Math.round(rand(-15, 10) * 10) / 10,
          smeName: pick(smeNames),
          userId: pick([user.id, admin.id]),
        },
      });

      // Add score request for each property
      await prisma.scoreRequest.create({
        data: {
          score: property.liquidityScore!,
          riskStatus: property.liquidityScore! > 70 ? 'LOW_RISK' : property.liquidityScore! > 50 ? 'MEDIUM_RISK' : 'HIGH_RISK' as RiskStatus,
          propertyId: property.id,
          userId: property.userId,
        },
      });

      // Add risk alerts for RISK_DETECTED + some UNDER_REVIEW
      if (status === 'RISK_DETECTED' || (status === 'UNDER_REVIEW' && Math.random() > 0.7)) {
        await prisma.riskAlert.create({
          data: {
            type: pick(['LIQUIDITY_DROP', 'VACANCY_RISK', 'SEVERE_OUTFLOW']) as AlertType,
            delta: Math.round(rand(-20, -3) * 10) / 10,
            propertyId: property.id,
          },
        });
      }

      // Add AI assessments for the first 20 properties
      if (propIndex < 20) {
        await prisma.aiAssessment.createMany({
          data: [
            { title: 'Location Premium', detail: 'Benefits from high foot traffic and transit proximity.', sentiment: 'positive', icon: 'check_circle', propertyId: property.id },
            { title: 'Tenant Profile', detail: 'Majority leased to investment-grade tenants.', sentiment: 'positive', icon: 'trending_up', propertyId: property.id },
            { title: 'CapEx Outlook', detail: 'Minor modernization expected within 24 months.', sentiment: 'neutral', icon: 'info', propertyId: property.id },
          ],
        });
      }

      propIndex++;
    }
  }

  console.log(`✅ Seeded ${propIndex} properties, 2 users, score requests, alerts, and assessments`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
