# LiqUIFI Frontend Implementation Plan

This plan details the process of converting the downloaded Google Stitch HTML screens for "LiqUIFI Dashboard Overview" into a production-ready, interactive React frontend using Vite and Tailwind CSS. The design strictly adheres to the "Liquid Intelligence Framework".

## Proposed Changes

### 1. Project Initialization & Architecture
We will set up a new React + TypeScript project using Vite inside the `liquifi` workspace root. We will run this scaffolding via Vite's automated initialization.
- **Framework:** React + TypeScript (via Vite)
- **Styling:** Tailwind CSS + PostCSS
- **Routing:** React Router DOM
- **Icons:** Material Symbols (via Google Fonts or Lucide for React equivalents)

### 2. Design System Configuration (`tailwind.config.js` & `index.css`)
We will configure Tailwind to precisely match the MCP metadata and "Liquid Intelligence" strategy.
- **Tokens:** Inject all specific hex codes (e.g., `surface: #0f1419`, `tertiary: #0ef7d6`, `primary: #a4e6ff`, `surface-container-highest: #30353b`).
- **Typography:** Add `Manrope` (headlines) and `Inter` (body/labels) families from Google Fonts.
- **Custom Utilities:** Add CSS layer bases for `liquid-gradient`, `card-gradient`, and `glass-effect` matching the strict CSS rules provided in the downloaded markup and MCP docs.

### 3. Core Reusable Components (`src/components/`)
We will build out the primitive components following the "No-Line", "Tonal Layering", and "Glassmorphism" rules:
- `Sidebar`: The main left navigation (fixed, specific width, nav links).
- `TopBar`: The top navigation with search header and breadcrumbs.
- `Layout`: A master wrapper holding Sidebar, TopBar, and main content area.
- `Card`: A component that applies the standard dark gradient (`card-gradient`) or nested tonal shifts without sharp divider borders.
- `Button` / `IconButton`: Implementing primary gradients, secondary ghosts, and tertiary AI-actions.
- `MetricDisplay`: To render the large Manrope numerical insights with correct styling.

### 4. Application Pages (`src/pages/`)
We will extract the HTML content from the four downloaded Stitch screens and convert them into React page components, integrating the reusable components above:
- [NEW] `src/pages/Dashboard.tsx` (Asset Liquidity Mapping - from `01-dashboard.html`)
- [NEW] `src/pages/Portfolio.tsx` (Property Portfolio - from `02-property-portfolio.html`)
- [NEW] `src/pages/PropertyDetail.tsx` (Property Liquidity Profile - from `03-liquidity-profile.html`)
- [NEW] `src/pages/RiskAnalytics.tsx` (Risk Portfolio Analytics - from `04-risk-analytics.html`)

### 5. Routing Assembly (`src/App.tsx`)
We will use React Router to handle client-side transitions between the four screens smoothly, wrapping them inside the universal `Layout` component.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify there are no TypeScript compilation or Vite build errors.
- Ensure Tailwind compiles the custom design system rules successfully without missing tokens.

### Manual Verification
- Run `npm run dev` and navigate to `http://localhost:5173`.
- **Navigation Test:** Click side menu buttons to ensure switching between Dashboard, Portfolio, and Analytics works seamlessly without full-page reloads.
- **Design Review:** Verify the dark theme "Liquid Intelligence" design is fully applied (no 1px solid sectioning lines, proper use of surface-container tiered colors, Manrope & Inter fonts loading).
- **Interactivity Review:** Verify hover states (glassmorphism tooltips, glowing AI inputs, gradient buttons) function properly as per the strategy doc.
