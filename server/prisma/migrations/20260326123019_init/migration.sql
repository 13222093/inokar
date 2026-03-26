-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ANALYST', 'AUDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('COMMERCIAL', 'RESIDENTIAL', 'INDUSTRIAL', 'MIXED_USE');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'UNDER_REVIEW', 'RISK_DETECTED');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LIQUIDITY_DROP', 'VACANCY_RISK', 'SEVERE_OUTFLOW', 'THRESHOLD_BREACH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ANALYST',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "marketValue" DOUBLE PRECISION NOT NULL,
    "liquidityScore" DOUBLE PRECISION,
    "capRate" DOUBLE PRECISION,
    "occupancyRate" DOUBLE PRECISION,
    "timeToLiquidity" INTEGER,
    "yoyChange" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "smeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreRequest" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "riskStatus" "RiskStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ScoreRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAssessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "AiAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAlert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "RiskAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeocodeCache" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeocodeCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Property_userId_idx" ON "Property"("userId");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_liquidityScore_idx" ON "Property"("liquidityScore");

-- CreateIndex
CREATE INDEX "ScoreRequest_propertyId_idx" ON "ScoreRequest"("propertyId");

-- CreateIndex
CREATE INDEX "ScoreRequest_createdAt_idx" ON "ScoreRequest"("createdAt");

-- CreateIndex
CREATE INDEX "RiskAlert_resolved_idx" ON "RiskAlert"("resolved");

-- CreateIndex
CREATE INDEX "RiskAlert_propertyId_idx" ON "RiskAlert"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "GeocodeCache_query_key" ON "GeocodeCache"("query");

-- CreateIndex
CREATE INDEX "GeocodeCache_query_idx" ON "GeocodeCache"("query");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreRequest" ADD CONSTRAINT "ScoreRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreRequest" ADD CONSTRAINT "ScoreRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAssessment" ADD CONSTRAINT "AiAssessment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAlert" ADD CONSTRAINT "RiskAlert_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
