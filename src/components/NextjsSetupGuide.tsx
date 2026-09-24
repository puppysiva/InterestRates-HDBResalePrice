import React, { useState } from 'react';
import {
  Code,
  KeyRound,
  Copy,
  Check,
  FolderTree,
  Terminal,
  FileCode,
  CheckCircle2,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export const NextjsSetupGuide: React.FC = () => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'hdb' | 'mas' | 'aggregator'>('hdb');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const envContent = `# .env.local - Next.js Configuration
# Both MAS API and data.gov.sg APIs are publicly accessible with NO mandatory API keys.
# (Optional) Optional developer key for data.gov.sg to access elevated rate limits:
DATA_GOV_SG_API_KEY=""

# Cache TTL Configuration (in seconds)
CACHE_REVALIDATE_SECONDS=3600
`;

  const cliSetupCommands = `# 1. Initialize Next.js 14/15 App Router Project
npx create-next-app@latest sg-macroprop-monitor \\
  --typescript --tailwind --eslint --app --src-dir

# 2. Install High-Performance Visualizer & Utility Packages
npm install lucide-react clsx tailwind-merge
`;

  const projectTree = `sg-macroprop-monitor/
├── .env.local                     # Optional API keys & cache TTL
├── app/
│   ├── layout.tsx                 # Root HTML shell & fonts
│   ├── page.tsx                   # Main Dashboard & Visualizer
│   └── api/
│       ├── sora/route.ts          # MAS SORA Fetcher with Cache
│       ├── hdb/route.ts           # Data.gov.sg Chunk Ingestion
│       └── cache/refresh/route.ts # On-demand revalidation trigger
├── lib/
│   ├── mas-client.ts              # MAS API integration & fallback
│   ├── datagov-client.ts          # Pagination loop & medians
│   └── statistics.ts              # Pearson correlation & p-values
└── components/
    ├── Header.tsx                 # Top navigation & sync status
    ├── DualAxisChart.tsx          # SVG visualizer with scrubber
    └── MetricCard.tsx             # Tabular numeral KPI cards`;

  const hdbSnippet = `// lib/datagov-client.ts
// Handles pagination loop over data.gov.sg CKAN datastore

export interface HdbTransaction {
  month: string;
  town: string;
  flat_type: string;
  resale_price: string;
  floor_area_sqm: string;
}

export async function fetchHdbResaleTransactions(limitPerChunk = 5000) {
  const resourceId = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
  const endpoint = "https://data.gov.sg/api/action/datastore_search";
  
  const records: HdbTransaction[] = [];
  let offset = 0;
  let keepPaginating = true;
  let maxChunks = 4; // Fetch up to 20k rows for 2022-2026 coverage

  while (keepPaginating && maxChunks > 0) {
    const url = \`\${endpoint}?resource_id=\${resourceId}&limit=\${limitPerChunk}&offset=\${offset}&sort=_id desc\`;
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Next.js edge caching
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) throw new Error(\`data.gov.sg error: \${res.statusText}\`);

    const json = await res.json();
    if (json.success && json.result?.records) {
      records.push(...json.result.records);
      if (json.result.records.length < limitPerChunk || !json.result._links?.next) {
        keepPaginating = false;
      } else {
        offset += limitPerChunk;
        maxChunks--;
      }
    } else {
      keepPaginating = false;
    }
  }

  return records;
}`;

  const masSnippet = `// app/api/sora/route.ts
// Next.js Route Handler for MAS SORA benchmark rates

import { NextResponse } from "next/server";
import { STATUTORY_SORA_HISTORY } from "@/lib/sora-history";

export const revalidate = 3600; // Cache on edge for 1 hour

export async function GET() {
  const MAS_URL = "https://eservices.mas.gov.sg/api/action/datastore/search.json";
  const RESOURCE_ID = "9a0bf14e-15e3-424e-973d-2338f019b53f";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(\`\${MAS_URL}?resource_id=\${RESOURCE_ID}&limit=1000\`, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Nextjs-Applet; MAS-Connector)",
      },
    });
    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json({ success: true, records: data.result?.records });
    }
  } catch (err) {
    console.warn("MAS gateway fallback engaged:", err);
  }

  // Resilient Statutory Fallback Store
  return NextResponse.json({
    success: true,
    source: "MAS Official Historical Publication (SWR)",
    records: STATUTORY_SORA_HISTORY,
  });
}`;

  const aggregatorSnippet = `// lib/statistics.ts
// Calculates Pearson correlation (r), R-squared, and medians

export function calculatePearsonCorrelation(x: number[], y: number[]) {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const avgX = x.reduce((a, b) => a + b, 0) / n;
  const avgY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - avgX;
    const dy = y[i] - avgY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : Number((num / den).toFixed(3));
}

export function computeMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}`;

  return (
    <div className="w-full px-4 sm:px-8 py-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Title Card */}
      <div className="bg-white p-5 rounded border border-[#e2e8f0] shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-[#0f172a]" />
          <h1 className="font-geist text-lg sm:text-xl font-bold text-[#0f172a]">
            Next.js 14/15 App Router Architecture &amp; Zero-Key Deployment
          </h1>
        </div>
        <p className="text-xs text-[#64748b] leading-relaxed">
          Comprehensive production engineering guide detailing server-side route handlers, edge caching strategies, and pagination loops for the Monetary Authority of Singapore (MAS) and Data.gov.sg APIs.
        </p>
      </div>

      {/* Authentication & Keys Protocol */}
      <div className="bg-white p-5 rounded border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#0c9488]" />
          <h2 className="font-geist text-base font-bold text-[#0f172a]">
            Public Access Authentication Protocol (Zero Keys Required)
          </h2>
        </div>

        <div className="bg-[#f8fafc] p-4 rounded border border-[#e2e8f0] flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0c9488] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-xs font-geist text-[#334155]">
              <span className="font-bold text-[#0f172a]">
                Zero-Key Policy for Official Singapore Open Data:
              </span>
              <span>
                Both the MAS API (<code className="bg-[#e2e8f0] px-1 py-0.5 rounded text-[#0f172a]">eservices.mas.gov.sg</code>) and the data.gov.sg CKAN Datastore (<code className="bg-[#e2e8f0] px-1 py-0.5 rounded text-[#0f172a]">data.gov.sg</code>) operate under public open licenses. You can run and deploy this application immediately without credit cards or paid API keys.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e2e8f0]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#0f172a]">
                .env.local Template
              </span>
              <button
                onClick={() => handleCopy('env', envContent)}
                className="flex items-center gap-1 text-xs text-[#0f172a] hover:underline cursor-pointer font-geist font-semibold"
              >
                {copiedId === 'env' ? <Check className="w-3.5 h-3.5 text-[#0c9488]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'env' ? 'Copied' : 'Copy .env.local'}</span>
              </button>
            </div>
            <pre className="bg-[#0b1c30] text-[#dae2fd] p-3 rounded font-mono text-xs overflow-x-auto">
              {envContent}
            </pre>
          </div>
        </div>
      </div>

      {/* Step 1 & Step 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: CLI Setup */}
        <div className="bg-white p-5 rounded border border-[#e2e8f0] shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#0f172a]" />
              <h2 className="font-geist text-base font-bold text-[#0f172a]">
                Step 1: CLI Setup &amp; Dependencies
              </h2>
            </div>
            <span className="text-xs text-[#64748b]">
              Bootstrap Next.js with TypeScript and Lucide icons.
            </span>
            <div className="relative mt-2">
              <button
                onClick={() => handleCopy('cli', cliSetupCommands)}
                className="absolute top-2 right-2 text-xs text-[#89f5e7] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'cli' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'cli' ? 'Copied' : 'Copy'}</span>
              </button>
              <pre className="bg-[#0b1c30] text-[#dae2fd] p-3 rounded font-mono text-xs overflow-x-auto">
                {cliSetupCommands}
              </pre>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#0c9488] font-geist">
            <CheckCircle2 className="w-4 h-4" />
            <span>Compatible with Node 18+, Next.js 14 &amp; 15</span>
          </div>
        </div>

        {/* Step 2: Target Project Architecture */}
        <div className="bg-white p-5 rounded border border-[#e2e8f0] shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#0f172a]" />
              <h2 className="font-geist text-base font-bold text-[#0f172a]">
                Step 2: Target Project Architecture
              </h2>
            </div>
            <span className="text-xs text-[#64748b]">
              Modular App Router structure separating ingestors, statistics, and UI.
            </span>
            <pre className="bg-[#0b1c30] text-[#89f5e7] p-3 rounded font-mono text-[11px] overflow-x-auto max-h-[160px]">
              {projectTree}
            </pre>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748b] font-geist">
            <span>Server components handle zero-client-secret data orchestration.</span>
          </div>
        </div>
      </div>

      {/* Step 3: Production Implementation Snippets */}
      <div className="bg-white p-5 rounded border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#0f172a]" />
            <h2 className="font-geist text-base font-bold text-[#0f172a]">
              Step 3: Production Implementation Snippets
            </h2>
          </div>

          {/* Snippet Tabs */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded">
            <button
              onClick={() => setActiveSnippetTab('hdb')}
              className={`px-3 py-1 rounded font-geist text-xs font-semibold cursor-pointer transition-colors ${
                activeSnippetTab === 'hdb'
                  ? 'bg-white text-[#0f172a] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              1. HDB Pagination Loop
            </button>
            <button
              onClick={() => setActiveSnippetTab('mas')}
              className={`px-3 py-1 rounded font-geist text-xs font-semibold cursor-pointer transition-colors ${
                activeSnippetTab === 'mas'
                  ? 'bg-white text-[#0f172a] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              2. MAS SORA Route &amp; Cache
            </button>
            <button
              onClick={() => setActiveSnippetTab('aggregator')}
              className={`px-3 py-1 rounded font-geist text-xs font-semibold cursor-pointer transition-colors ${
                activeSnippetTab === 'aggregator'
                  ? 'bg-white text-[#0f172a] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              3. Rate Aggregator &amp; Medians
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="relative">
          <div className="flex justify-between items-center bg-[#0b1c30] px-4 py-2 rounded-t border-b border-[#213145]">
            <span className="font-mono text-xs text-[#89f5e7]">
              {activeSnippetTab === 'hdb'
                ? 'lib/datagov-client.ts'
                : activeSnippetTab === 'mas'
                ? 'app/api/sora/route.ts'
                : 'lib/statistics.ts'}
            </span>
            <button
              onClick={() =>
                handleCopy(
                  'snippet',
                  activeSnippetTab === 'hdb'
                    ? hdbSnippet
                    : activeSnippetTab === 'mas'
                    ? masSnippet
                    : aggregatorSnippet
                )
              }
              className="flex items-center gap-1 text-xs text-[#89f5e7] hover:underline cursor-pointer"
            >
              {copiedId === 'snippet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'snippet' ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>
          <pre className="bg-[#0b1c30] text-[#dae2fd] p-4 rounded-b font-mono text-xs overflow-x-auto max-h-96">
            {activeSnippetTab === 'hdb'
              ? hdbSnippet
              : activeSnippetTab === 'mas'
              ? masSnippet
              : aggregatorSnippet}
          </pre>
        </div>
      </div>

      {/* Verification SLA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm flex flex-col gap-1">
          <span className="font-geist text-xs font-bold text-[#0f172a]">Daily MAS Publication</span>
          <span className="text-xs text-[#64748b]">
            MAS updates compounded SORA rates every business day at 09:00 SGT. Cache revalidation automatically picks up the latest published rates.
          </span>
        </div>
        <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm flex flex-col gap-1">
          <span className="font-geist text-xs font-bold text-[#0f172a]">Monthly Datastore Update</span>
          <span className="text-xs text-[#64748b]">
            HDB releases previous month's resale transaction data by the 1st week of each month on data.gov.sg.
          </span>
        </div>
        <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm flex flex-col gap-1">
          <span className="font-geist text-xs font-bold text-[#0f172a]">CORS Elimination</span>
          <span className="text-xs text-[#64748b]">
            Executing fetches server-side via Next.js Route Handlers eliminates browser CORS errors and prevents browser token exposure.
          </span>
        </div>
      </div>
    </div>
  );
};
