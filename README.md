# SG MacroProp: Singapore Domestic Interest Rates & HDB Resale Prices Monitor

A sovereign macroeconomic analytics web application correlating the Monetary Authority of Singapore (MAS) Singapore Overnight Rate Average (SORA) interest rates with Data.gov.sg Housing & Development Board (HDB) resale flat transaction prices.

---

## Features

- **Live Official Singapore Open APIs**:
  - **MAS SORA Rates API**: Automated ingestion of 3M Compounded SORA, 1M Compounded SORA, and Overnight SORA benchmark rates (`resource_id: 9a0bf14e-15e3-424e-973d-2338f019b53f`), with resilient statutory fallback during upstream gateway maintenance windows.
  - **Data.gov.sg CKAN Datastore**: Real-time querying of statutory HDB resale property transaction data (`resource_id: d_8b84c4ee58e3cfc0ece0d773c8ca6abc`) across 241,000+ records.
- **Dual-Axis Chart Visualizer**:
  - Left Y-Axis: MAS SORA (% per annum) in Crimson.
  - Right Y-Axis: HDB Monthly Median Resale Price (S$) in Navy Slate with gradient area fill.
  - Secondary Volume Bars: Monthly market liquidity and transaction flows.
  - Interactive Hover Crosshair Scrubber with detailed month-by-month floating tooltips.
- **Multi-Dimensional Filters**:
  - **Time Horizon**: Trailing 12 Months (1Y), Last 3 Years (3Y), Last 5 Years (5Y), Full Series (ALL).
  - **Town**: Islandwide Aggregate + 26 individual Singapore HDB towns (Ang Mo Kio, Bedok, Bishan, Clementi, Punggol, Queenstown, Tampines, etc.).
  - **Flat Category**: 2 Room, 3 Room, 4 Room, 5 Room, Executive, All.
  - **Tenor**: 3M SORA, 1M SORA, Overnight SORA.
- **Statistical KPIs**:
  - Latest benchmark rates and MoM deltas with sparklines.
  - Latest median price, YoY growth, and average S$ psf.
  - Pearson correlation coefficient ($r$), $R^2$, and mortgage sensitivity estimates (+50bps).
- **Diagnostics & Query Playground**:
  - Live probe testing latency and response status for both MAS and Data.gov.sg.
  - Interactive query tester with JSON syntax viewer and copy functionality.
- **Next.js 14/15 Architecture Guide**:
  - Step-by-step App Router reference and copyable route handlers.
  - Zero-key public data access protocol documentation.
- **Export Data**:
  - Client-side CSV export of filtered monthly telemetry series.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion.
- **Backend / Ingestion**: Node.js, Express, Vite middleware, SWR in-memory edge caching.
- **Data Gateways**:
  - Monetary Authority of Singapore (MAS API v2)
  - Data.gov.sg CKAN Open Data Datastore

---

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/puppysiva/InterestRates-HDBResalePrice.git
cd InterestRates-HDBResalePrice

# Install dependencies
npm install

# Start the full-stack dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

---

## API Keys & Authentication

Both the **Monetary Authority of Singapore (MAS)** and **Data.gov.sg** open data APIs are publicly accessible with **zero required API keys**. No paid subscriptions or credit cards are needed.

An optional `DATA_GOV_SG_API_KEY` can be specified in `.env` if elevated rate limits are required.

---

## License

Apache-2.0
