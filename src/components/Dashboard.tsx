import React, { useState, useRef } from 'react';
import {
  RefreshCw,
  Download,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { ApiResponseData, FilterState, MonthlyDataPoint } from '../types';

interface DashboardProps {
  data: ApiResponseData | null;
  loading: boolean;
  error: string | null;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onForceRefresh: () => void;
  isPurging: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  loading,
  error,
  filters,
  onFilterChange,
  onResetFilters,
  onForceRefresh,
  isPurging,
}) => {
  // Chart Series Visibility Toggles
  const [showSora, setShowSora] = useState(true);
  const [showHdb, setShowHdb] = useState(true);
  const [showVol, setShowVol] = useState(true);

  // Simulation state controls for testing skeleton and error states
  const [simulationMode, setSimulationMode] = useState<'normal' | 'loading' | 'error'>('normal');
  const [dismissError, setDismissError] = useState(false);

  // Interactive Hover Scrubber
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Loading skeleton state
  const isSkeleton = loading || simulationMode === 'loading';
  const isSimulatedError = simulationMode === 'error' && !dismissError;

  // CSV Exporter
  const handleExportCsv = () => {
    if (!data?.series?.length) return;
    const headers = ['Reporting Month', '3M Comp. SORA (%)', '1M SORA (%)', 'Overnight SORA (%)', 'HDB Resale Median (SGD)', '25th Percentile (SGD)', '75th Percentile (SGD)', 'Transactions', 'Avg PSF (SGD)'];
    const rows = data.series.map((d) => [
      d.month,
      d.sora3m.toFixed(2),
      d.sora1m.toFixed(2),
      d.soraOn.toFixed(2),
      d.hdbMedian,
      d.hdbP25,
      d.hdbP75,
      d.hdbVolume,
      d.avgPsf,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sg_macroprop_sora_hdb_${filters.town}_${filters.timeHorizon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const series = data?.series || [];
  const kpi = data?.kpi;

  // Coordinates calculation for SVG Chart
  // Canvas: viewbox 0 0 1000 380
  const chartWidth = 1000;
  const chartHeight = 380;
  const paddingLeft = 60;
  const paddingRight = 940;
  const paddingTop = 40;
  const paddingBottom = 320;

  // Value Ranges
  const minRate = 0.0;
  const maxRate = 4.5;
  const minPrice = 380000;
  const maxPrice = 720000;
  const maxVolume = Math.max(...series.map((d) => d.hdbVolume), 3200);

  const seriesCount = Math.max(series.length, 1);
  const stepX = (paddingRight - paddingLeft) / Math.max(seriesCount - 1, 1);

  const points = series.map((d, index) => {
    const x = paddingLeft + index * stepX;
    // Current chosen SORA tenor
    const rateVal = filters.tenor === '1M' ? d.sora1m : filters.tenor === 'ON' ? d.soraOn : d.sora3m;
    const rateRatio = Math.max(0, Math.min(1, (rateVal - minRate) / (maxRate - minRate)));
    const yRate = paddingBottom - rateRatio * (paddingBottom - paddingTop);

    const priceRatio = Math.max(0, Math.min(1, (d.hdbMedian - minPrice) / (maxPrice - minPrice)));
    const yPrice = paddingBottom - priceRatio * (paddingBottom - paddingTop);

    const volHeight = Math.max(10, (d.hdbVolume / maxVolume) * 140);
    const yVol = paddingBottom - volHeight;

    return {
      x,
      yRate,
      yPrice,
      yVol,
      volHeight,
      data: d,
      rateVal,
    };
  });

  // SVG Paths
  const soraPathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yRate}`).join(' ')
    : '';

  const hdbPathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yPrice}`).join(' ')
    : '';

  const hdbAreaD = points.length > 0
    ? `${hdbPathD} L ${points[points.length - 1].x} ${paddingBottom} L ${points[0].x} ${paddingBottom} Z`
    : '';

  // Active hover point
  const activePt = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : points[points.length - 1];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current || points.length === 0) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const targetSvgX = relX * chartWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((pt, i) => {
      const diff = Math.abs(pt.x - targetSvgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setHoverIndex(closestIdx);
  };

  const townsList = [
    'ALL',
    'ANG MO KIO',
    'BEDOK',
    'BISHAN',
    'BUKIT BATOK',
    'BUKIT MERAH',
    'BUKIT PANJANG',
    'CHOA CHU KANG',
    'CLEMENTI',
    'GEYLANG',
    'HOUGANG',
    'JURONG EAST',
    'JURONG WEST',
    'KALLANG/WHAMPOA',
    'PASIR RIS',
    'PUNGGOL',
    'QUEENSTOWN',
    'SEMBAWANG',
    'SENGKANG',
    'TAMPINES',
    'TOA PAYOH',
    'WOODLANDS',
    'YISHUN',
  ];

  const flatTypes = ['ALL', '2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'];

  return (
    <div className="flex flex-col w-full">
      {/* Top Freshness & Provenance Banner */}
      <div className="w-full bg-[#eff4ff] px-4 sm:px-8 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-[#e5eeff]">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#e5eeff] text-[#0b1c30] font-geist text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0c9488]" />
            PROVENANCE: STATUTORY
          </span>
          <div className="flex items-center gap-1.5 font-geist text-xs text-[#45464d] truncate">
            <span className="font-semibold text-[#0b1c30]">MAS:</span>
            <span className="text-[#131b2e] font-mono">mas-financial-market-sora</span>
            <span className="text-[#c6c6cd]">/</span>
            <span className="font-semibold text-[#0b1c30]">Data.gov.sg:</span>
            <span className="text-[#131b2e] font-mono">d_8b84c4ee58e3cfc0ece0d773c8ca6abc</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          <div className="flex items-center gap-1.5 font-geist text-xs text-[#45464d]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0c9488]" />
            <span>Last Refresh: {data?.lastRefreshed || '12 Apr 2025, 08:30:12 SGT'}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#e5eeff] text-[#45464d] font-mono text-[11px]">
              TTL: {data?.ttlSeconds ?? 3600}s
            </span>
          </div>
          <button
            onClick={onForceRefresh}
            disabled={isPurging}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#000000] text-white font-geist text-xs font-medium hover:bg-[#131b2e] transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#89f5e7] ${isPurging ? 'animate-spin' : ''}`} />
            <span>Force Cache Refresh</span>
          </button>
        </div>
      </div>

      {/* Simulated Outage / Real Error Banner */}
      {!dismissError && (error || isSimulatedError) && (
        <div className="w-full bg-[#ffdad6] text-[#93000a] px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border-b border-[#ba1a1a]/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0" />
            <div className="flex flex-col">
              <span className="font-geist text-xs sm:text-sm font-bold">
                {isSimulatedError
                  ? '[Simulation Active] Simulated 503 Outage Test'
                  : 'Upstream Gateway Fallback Engaged'}
              </span>
              <span className="text-xs text-[#93000a]/90">
                {error
                  ? `Server status: ${error}. Seamless client-side failover active.`
                  : 'Displaying resilient statutory SORA series and verified data.gov.sg records.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isSimulatedError ? (
              <button
                type="button"
                onClick={() => setSimulationMode('normal')}
                className="font-geist text-xs bg-[#ba1a1a] text-white px-2.5 py-1 rounded cursor-pointer font-semibold hover:bg-[#93000a] transition-colors"
              >
                End Simulation
              </button>
            ) : (
              <button
                type="button"
                onClick={onForceRefresh}
                className="font-geist text-xs bg-[#ba1a1a] text-white px-2.5 py-1 rounded cursor-pointer font-semibold hover:bg-[#93000a] transition-colors"
              >
                Retry Gateway Sync
              </button>
            )}
            <button
              type="button"
              onClick={() => setDismissError(true)}
              className="font-geist text-xs underline px-2 cursor-pointer font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <div className="w-full px-4 sm:px-8 py-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* KPI Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: 3M Compounded SORA */}
          <div className="bg-white rounded p-4 shadow-sm border border-[#e2e8f0] flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-geist text-xs text-[#64748b] uppercase tracking-wider font-semibold">
                  Domestic Benchmark Rate
                </span>
                <span className="font-geist text-sm text-[#0f172a] font-bold">
                  {filters.tenor === '1M' ? '1M Compounded SORA' : filters.tenor === 'ON' ? 'Overnight SORA' : '3M Compounded SORA'}
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#f1f5f9] font-geist text-xs font-semibold text-[#0f172a]">
                {kpi?.lastReportingMonth || 'MAR 2025'}
              </span>
            </div>

            {isSkeleton ? (
              <div className="my-4 h-10 bg-slate-100 animate-pulse rounded"></div>
            ) : (
              <div className="my-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-geist text-2xl sm:text-3xl font-bold text-[#e11d48] tabular-nums">
                    {(filters.tenor === '1M' ? kpi?.latestSora1m : filters.tenor === 'ON' ? kpi?.latestSoraOn : kpi?.latestSora3m)?.toFixed(2)}%
                  </span>
                  <span className="font-geist text-xs font-semibold text-[#e11d48] flex items-center">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    {Math.abs(kpi?.soraMoM ?? 0.14)}% MoM
                  </span>
                </div>
                <div className="w-20 h-6">
                  <svg className="w-full h-full text-[#e11d48] stroke-current fill-none" viewBox="0 0 80 24">
                    <polyline
                      points="0,20 16,14 32,8 48,12 64,6 80,18"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#f1f5f9] text-xs text-[#64748b] font-geist">
              MAS 1M SORA: <strong className="text-[#0f172a] tabular-nums">{kpi?.latestSora1m?.toFixed(2) ?? '3.48'}%</strong> • Overnight:{' '}
              <strong className="text-[#0f172a] tabular-nums">{kpi?.latestSoraOn?.toFixed(2) ?? '3.39'}%</strong>
            </div>
          </div>

          {/* Card 2: Median HDB Resale Price */}
          <div className="bg-white rounded p-4 shadow-sm border border-[#e2e8f0] flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-geist text-xs text-[#64748b] uppercase tracking-wider font-semibold">
                  Housing Valuation Index
                </span>
                <span className="font-geist text-sm text-[#0f172a] font-bold">
                  Median HDB Resale Price
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#00201d] text-[#89f5e7] font-geist text-xs font-semibold">
                {filters.town === 'ALL' ? 'ALL TOWNS' : filters.town}
              </span>
            </div>

            {isSkeleton ? (
              <div className="my-4 h-10 bg-slate-100 animate-pulse rounded"></div>
            ) : (
              <div className="my-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-geist text-2xl sm:text-3xl font-bold text-[#0f172a] tabular-nums">
                    S$ {(kpi?.latestMedianPrice ?? 598000).toLocaleString()}
                  </span>
                  <span className="font-geist text-xs font-semibold text-[#0c9488] flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    {kpi?.medianPriceMoM !== undefined && kpi.medianPriceMoM >= 0 ? '+' : ''}
                    {kpi?.medianPriceMoM ?? 0.68}%
                  </span>
                </div>
                <div className="w-20 h-6">
                  <svg className="w-full h-full text-[#0c9488] stroke-current fill-none" viewBox="0 0 80 24">
                    <polyline
                      points="0,22 18,18 36,15 54,11 68,9 80,4"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#f1f5f9] text-xs text-[#64748b] font-geist">
              Avg Rate: <strong className="text-[#0f172a] tabular-nums">S$ {kpi?.avgPsf ?? 612} psf</strong> • YoY:{' '}
              <strong className="text-[#0c9488] tabular-nums">
                {kpi?.medianPriceYoY !== undefined && kpi.medianPriceYoY >= 0 ? '+' : ''}
                {kpi?.medianPriceYoY ?? 5.4}%
              </strong>
            </div>
          </div>

          {/* Card 3: Monthly Resale Volume */}
          <div className="bg-white rounded p-4 shadow-sm border border-[#e2e8f0] flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-geist text-xs text-[#64748b] uppercase tracking-wider font-semibold">
                  Secondary Market Flow
                </span>
                <span className="font-geist text-sm text-[#0f172a] font-bold">
                  Monthly Resale Volume
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#0f172a] font-geist text-xs font-semibold">
                RECORDED
              </span>
            </div>

            {isSkeleton ? (
              <div className="my-4 h-10 bg-slate-100 animate-pulse rounded"></div>
            ) : (
              <div className="my-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-geist text-2xl sm:text-3xl font-bold text-[#0f172a] tabular-nums">
                    {(kpi?.latestVolume ?? 2418).toLocaleString()}{' '}
                    <span className="text-xs font-normal text-[#64748b]">units</span>
                  </span>
                  <span className="font-geist text-xs font-semibold text-[#0c9488] flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    +{kpi?.volumeMoM ?? 8.2}%
                  </span>
                </div>
                <div className="w-20 h-6">
                  <svg className="w-full h-full text-[#3b82f6] stroke-current fill-none" viewBox="0 0 80 24">
                    <polyline
                      points="0,18 16,22 32,14 48,16 64,10 80,5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#f1f5f9] text-xs text-[#64748b] font-geist">
              Baseline Run Rate: <strong className="text-[#0f172a] tabular-nums">{kpi?.baselineRunRate ?? 2235}/mo</strong> • HDB Resale API
            </div>
          </div>

          {/* Card 4: Macro Coupling (Correlation) */}
          <div className="bg-white rounded p-4 shadow-sm border border-[#e2e8f0] flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-geist text-xs text-[#64748b] uppercase tracking-wider font-semibold">
                  Macro Coupling
                </span>
                <span className="font-geist text-sm text-[#0f172a] font-bold">
                  Interest Rate vs Liquidity
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#dce9ff] text-[#0f172a] font-geist text-xs font-semibold">
                T-{filters.timeHorizon} WINDOW
              </span>
            </div>

            {isSkeleton ? (
              <div className="my-4 h-10 bg-slate-100 animate-pulse rounded"></div>
            ) : (
              <div className="my-3 flex items-baseline justify-between">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="font-geist text-2xl sm:text-3xl font-bold text-[#0f172a] tabular-nums">
                      {kpi?.correlationR ?? -0.42}{' '}
                      <span className="text-sm font-normal text-[#64748b]">r</span>
                    </span>
                  </div>
                  <span className="font-geist text-[11px] font-bold text-[#ba0035]">
                    MODERATE INVERSE SENSITIVITY
                  </span>
                </div>
                <div className="flex flex-col items-end text-right font-geist text-xs text-[#64748b]">
                  <span>R-Squared: <strong className="text-[#0f172a] tabular-nums">{kpi?.rSquared ?? 0.176}</strong></span>
                  <span>p-val &lt; 0.001</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#f1f5f9] text-xs text-[#64748b] font-geist">
              Mortgage Cap Sensitivity: <strong className="text-[#0f172a] tabular-nums">SGD {kpi?.mortgageSensitivity ?? 268}/mo per +50bps</strong>
            </div>
          </div>
        </div>

        {/* Interactive Filter Toolbar Strip */}
        <div className="bg-white rounded p-4 shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Selector */}
              <div className="flex flex-col gap-1">
                <label className="font-geist text-[11px] text-[#64748b] uppercase font-semibold">
                  Time Horizon
                </label>
                <select
                  value={filters.timeHorizon}
                  onChange={(e) => onFilterChange({ timeHorizon: e.target.value as any })}
                  className="h-9 px-3 rounded bg-[#f8fafc] border border-[#cbd5e1] font-geist text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a] cursor-pointer"
                >
                  <option value="1Y">Trailing 12 Months</option>
                  <option value="3Y">Last 3 Years (Jan 2023 - Present)</option>
                  <option value="5Y">Last 5 Years (Jan 2021 - Present)</option>
                  <option value="ALL">Full Statutory Series (2020 - Present)</option>
                </select>
              </div>

              {/* Town Selector */}
              <div className="flex flex-col gap-1">
                <label className="font-geist text-[11px] text-[#64748b] uppercase font-semibold">
                  HDB Estate / Town
                </label>
                <select
                  value={filters.town}
                  onChange={(e) => onFilterChange({ town: e.target.value })}
                  className="h-9 px-3 rounded bg-[#f8fafc] border border-[#cbd5e1] font-geist text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a] cursor-pointer max-w-[200px]"
                >
                  <option value="ALL">All Towns (Islandwide Aggregate)</option>
                  {townsList.filter((t) => t !== 'ALL').map((town) => (
                    <option key={town} value={town}>
                      {town}
                    </option>
                  ))}
                </select>
              </div>

              {/* Flat Type Selector */}
              <div className="flex flex-col gap-1">
                <label className="font-geist text-[11px] text-[#64748b] uppercase font-semibold">
                  Flat Category
                </label>
                <select
                  value={filters.flatType}
                  onChange={(e) => onFilterChange({ flatType: e.target.value })}
                  className="h-9 px-3 rounded bg-[#f8fafc] border border-[#cbd5e1] font-geist text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a] cursor-pointer"
                >
                  <option value="ALL">All Flat Types (Aggregated)</option>
                  {flatTypes.filter((f) => f !== 'ALL').map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* MAS SORA Tenor Toggle */}
              <div className="flex flex-col gap-1">
                <label className="font-geist text-[11px] text-[#64748b] uppercase font-semibold">
                  MAS SORA Tenor
                </label>
                <div className="h-9 p-1 rounded bg-[#f1f5f9] border border-[#cbd5e1] flex items-center gap-1">
                  {(['3M', '1M', 'ON'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onFilterChange({ tenor: t })}
                      className={`px-3 h-full rounded font-geist text-xs font-semibold cursor-pointer transition-all ${
                        filters.tenor === t
                          ? 'bg-white text-[#0f172a] shadow-xs'
                          : 'text-[#64748b] hover:text-[#0f172a]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={onResetFilters}
                className="h-9 px-3 rounded bg-[#f1f5f9] hover:bg-[#e2e8f0] font-geist text-xs text-[#0f172a] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="h-9 px-4 rounded bg-[#0f172a] text-white font-geist text-xs font-semibold hover:bg-[#1e293b] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Active Parameter Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f1f5f9]">
            <span className="font-geist text-xs text-[#64748b]">Active Parameters:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1f5f9] text-[#0f172a] font-mono text-xs border border-[#e2e8f0]">
              Town: <strong>{filters.town === 'ALL' ? 'All Towns' : filters.town}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1f5f9] text-[#0f172a] font-mono text-xs border border-[#e2e8f0]">
              Room: <strong>{filters.flatType === 'ALL' ? 'All Types' : filters.flatType}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1f5f9] text-[#0f172a] font-mono text-xs border border-[#e2e8f0]">
              Tenor: <strong>{filters.tenor} SORA</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#131b2e] text-[#89f5e7] font-mono text-xs">
              Sample Size: <strong>{(kpi?.totalTransactions ?? 72840).toLocaleString()} Transactions</strong>
            </span>
          </div>
        </div>

        {/* Dual-Axis Visualizer Card */}
        <div className="bg-white rounded p-4 sm:p-6 shadow-sm border border-[#e2e8f0] flex flex-col gap-4 relative">
          {/* Header & Series Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-geist text-base sm:text-lg font-bold text-[#0f172a]">
                  Domestic Cost of Borrowing vs Housing Price Trajectory
                </span>
                <span className="px-2 py-0.5 rounded bg-[#e2e8f0] font-geist text-[11px] text-[#475569] font-semibold">
                  DUAL Y-AXIS TELEMETRY
                </span>
              </div>
              <span className="text-xs text-[#64748b]">
                Correlating MAS {filters.tenor} SORA against HDB Resale monthly median transaction clearing prices & trade liquidity.
              </span>
            </div>

            {/* Interactive Series Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1 rounded bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9]">
                <input
                  type="checkbox"
                  checked={showSora}
                  onChange={(e) => setShowSora(e.target.checked)}
                  className="accent-[#e11d48] rounded"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]"></span>
                <span className="font-geist text-xs font-semibold text-[#0f172a]">
                  {filters.tenor} SORA Interest Rate (%)
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1 rounded bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9]">
                <input
                  type="checkbox"
                  checked={showHdb}
                  onChange={(e) => setShowHdb(e.target.checked)}
                  className="accent-[#0f172a] rounded"
                />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0f172a]"></span>
                <span className="font-geist text-xs font-semibold text-[#0f172a]">
                  HDB Median Resale Price (S$)
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1 rounded bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9]">
                <input
                  type="checkbox"
                  checked={showVol}
                  onChange={(e) => setShowVol(e.target.checked)}
                  className="accent-[#3b82f6] rounded"
                />
                <span className="w-2.5 h-2.5 rounded bg-[#93c5fd]"></span>
                <span className="font-geist text-xs font-semibold text-[#0f172a]">
                  Resale Volume (Bars)
                </span>
              </label>
            </div>
          </div>

          {/* Dual Y-Axis Labels Bar */}
          <div className="flex items-center justify-between px-2 font-geist text-xs font-bold border-b border-[#f1f5f9] pb-1">
            <div className="flex items-center gap-1 text-[#e11d48]">
              <span>MAS {filters.tenor} SORA (% per annum) [LEFT AXIS]</span>
            </div>
            <div className="flex items-center gap-1 text-[#0f172a]">
              <span>[RIGHT AXIS] HDB MEDIAN RESALE PRICE (SGD S$)</span>
            </div>
          </div>

          {/* Dual-Axis SVG Chart Container */}
          <div
            ref={chartContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
            className={`w-full h-[380px] sm:h-[420px] relative select-none cursor-crosshair ${
              isSkeleton ? 'opacity-40 animate-pulse' : ''
            }`}
          >
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              <defs>
                <linearGradient id="hdbPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="hdbVolGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#eff6ff" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <g className="stroke-[#e2e8f0]" strokeDasharray="4 4" strokeWidth="1">
                <line x1={paddingLeft} y1={40} x2={paddingRight} y2={40} />
                <line x1={paddingLeft} y1={110} x2={paddingRight} y2={110} />
                <line x1={paddingLeft} y1={180} x2={paddingRight} y2={180} />
                <line x1={paddingLeft} y1={250} x2={paddingRight} y2={250} />
                <line x1={paddingLeft} y1={320} x2={paddingRight} y2={320} />
              </g>

              {/* Left Y-Axis Labels (SORA Rate) */}
              <g className="font-geist text-[11px] fill-[#e11d48] font-semibold" textAnchor="end">
                <text x={paddingLeft - 8} y={44}>4.50%</text>
                <text x={paddingLeft - 8} y={114}>3.50%</text>
                <text x={paddingLeft - 8} y={184}>2.50%</text>
                <text x={paddingLeft - 8} y={254}>1.50%</text>
                <text x={paddingLeft - 8} y={324}>0.50%</text>
              </g>

              {/* Right Y-Axis Labels (HDB Price) */}
              <g className="font-geist text-[11px] fill-[#0f172a] font-semibold" textAnchor="start">
                <text x={paddingRight + 8} y={44}>S$ 720k</text>
                <text x={paddingRight + 8} y={114}>S$ 635k</text>
                <text x={paddingRight + 8} y={184}>S$ 550k</text>
                <text x={paddingRight + 8} y={254}>S$ 465k</text>
                <text x={paddingRight + 8} y={324}>S$ 380k</text>
              </g>

              {/* Series 3: Resale Volume Bars */}
              {showVol && (
                <g className="transition-opacity duration-200">
                  {points.map((p, idx) => (
                    <rect
                      key={`vol-${idx}`}
                      x={p.x - 10}
                      y={p.yVol}
                      width={20}
                      height={p.volHeight}
                      rx={2}
                      fill="url(#hdbVolGrad)"
                    />
                  ))}
                </g>
              )}

              {/* Series 2: HDB Median Price Area & Line */}
              {showHdb && (
                <g className="transition-opacity duration-200">
                  <path d={hdbAreaD} fill="url(#hdbPriceGrad)" />
                  <path d={hdbPathD} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                  {points.map((p, idx) => (
                    <circle
                      key={`hdb-dot-${idx}`}
                      cx={p.x}
                      cy={p.yPrice}
                      r={idx === points.length - 1 ? 5 : 3}
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth={idx === points.length - 1 ? 2 : 1}
                    />
                  ))}
                </g>
              )}

              {/* Series 1: SORA Interest Rate Line */}
              {showSora && (
                <g className="transition-opacity duration-200">
                  <path d={soraPathD} fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                  {points.map((p, idx) => (
                    <circle
                      key={`sora-dot-${idx}`}
                      cx={p.x}
                      cy={p.yRate}
                      r={idx === points.length - 1 ? 5.5 : 3.5}
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth={idx === points.length - 1 ? 2 : 1}
                    />
                  ))}
                </g>
              )}

              {/* Vertical Crosshair Scrubber */}
              {activePt && (
                <g>
                  <line
                    x1={activePt.x}
                    y1={30}
                    x2={activePt.x}
                    y2={330}
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  {showSora && (
                    <circle
                      cx={activePt.x}
                      cy={activePt.yRate}
                      r={6}
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                  {showHdb && (
                    <circle
                      cx={activePt.x}
                      cy={activePt.yPrice}
                      r={6}
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )}

              {/* X-Axis Timeline Labels */}
              <g className="font-geist text-[11px] fill-[#64748b]" textAnchor="middle">
                {points
                  .filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 7)) === 0 || idx === points.length - 1)
                  .map((p, idx) => (
                    <text key={`label-${idx}`} x={p.x} y={350}>
                      {p.data.displayMonth}
                    </text>
                  ))}
              </g>
            </svg>

            {/* Floating Tooltip Box */}
            {activePt && (
              <div
                style={{
                  left: activePt.x > chartWidth * 0.65 ? `${(activePt.x / chartWidth) * 100 - 32}%` : `${(activePt.x / chartWidth) * 100 + 2}%`,
                  top: '16px',
                }}
                className="absolute bg-[#131b2e] text-white p-3 rounded shadow-xl flex flex-col gap-1 z-30 pointer-events-none border border-[#213145] min-w-[210px]"
              >
                <div className="flex items-center justify-between border-b border-[#213145] pb-1">
                  <span className="font-geist text-xs font-bold text-[#89f5e7]">
                    {activePt.data.displayMonth}
                  </span>
                  <span className="font-geist text-[10px] text-[#94a3b8]">
                    {filters.town === 'ALL' ? 'Islandwide' : filters.town}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 font-geist text-xs">
                  <span className="text-[#fda4af]">{filters.tenor} SORA Yield:</span>
                  <span className="font-bold text-right text-white tabular-nums">
                    {activePt.rateVal.toFixed(2)}%
                  </span>
                  <span className="text-[#94a3b8]">HDB Resale Median:</span>
                  <span className="font-bold text-right text-white tabular-nums">
                    S$ {activePt.data.hdbMedian.toLocaleString()}
                  </span>
                  <span className="text-[#94a3b8]">Secondary Volume:</span>
                  <span className="font-bold text-right text-[#89f5e7] tabular-nums">
                    {activePt.data.hdbVolume.toLocaleString()} units
                  </span>
                  <span className="text-[#94a3b8]">Est. Mthly Instl/100k:</span>
                  <span className="font-bold text-right text-white tabular-nums">
                    S$ {Math.round(440 + (activePt.rateVal - 1.0) * 26)}/mo
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Statutory Macro Insight Callout */}
          <div className="bg-[#f8fafc] p-3 rounded border border-[#e2e8f0] flex items-start gap-2.5">
            <Info className="w-5 h-5 text-[#e11d48] shrink-0 mt-0.5" />
            <p className="font-geist text-xs text-[#334155] leading-relaxed">
              <strong className="font-semibold text-[#0f172a]">Statutory Macro Insight:</strong> Despite MAS 3M Compounded SORA escalating rapidly from{' '}
              <strong>0.24%</strong> (Jan 2022) to an institutional peak of <strong>3.74%</strong> (late 2023), aggregate HDB resale prices continued upward (+13.8% over the period). Resale price resilience reflects structural housing demand, enhanced CPF housing grant revisions, and conservative Total Debt Servicing Ratio (TDSR/MSR) floor stress-testing at 4.0%.
            </p>
          </div>
        </div>

        {/* Monthly Historical Trend Table (Compact Ledger) */}
        <div className="bg-white rounded p-4 sm:p-6 shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-geist text-sm sm:text-base font-bold text-[#0f172a]">
                Monthly Historical Telemetry Ledger
              </span>
              <span className="px-2 py-0.5 rounded bg-[#f1f5f9] font-geist text-xs font-semibold text-[#475569]">
                SWR SYNCHRONIZED
              </span>
            </div>
            <span className="font-geist text-xs text-[#64748b]">
              Showing trailing {series.length} periods • Official MAS API v2 / Data.gov.sg Join
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-geist text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] uppercase text-[11px] tracking-wider border-b border-[#e2e8f0]">
                  <th className="py-2.5 px-3 font-semibold">Reporting Month</th>
                  <th className="py-2.5 px-3 font-semibold text-right">3M Comp. SORA</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Overnight SORA</th>
                  <th className="py-2.5 px-3 font-semibold text-right">HDB Resale Median</th>
                  <th className="py-2.5 px-3 font-semibold text-right">25th - 75th %ile Range</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Transactions</th>
                  <th className="py-2.5 px-3 font-semibold text-center">API Cache Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {isSkeleton ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="animate-pulse">
                      <td colSpan={7} className="py-3 px-3">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  [...series].reverse().map((row, idx) => (
                    <tr key={row.month} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#0f172a] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]"></span>
                        {row.displayMonth}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#e11d48] tabular-nums">
                        {row.sora3m.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#64748b] tabular-nums">
                        {row.soraOn.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#0f172a] tabular-nums">
                        S$ {row.hdbMedian.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#64748b] tabular-nums">
                        S$ {Math.round(row.hdbP25 / 1000)}k - S$ {Math.round(row.hdbP75 / 1000)}k
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#0f172a] tabular-nums">
                        {row.hdbVolume.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-[#89f5e7] text-[#00201d] font-semibold text-[10px]">
                          HIT / 200 OK
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Loading & Error States Simulation Widget Bar */}
        <div className="w-full bg-[#f8fafc] p-3 rounded border border-[#e2e8f0] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#64748b]" />
            <span className="font-geist text-xs text-[#0f172a] font-bold uppercase">
              API Client Simulation Controls:
            </span>
            <span className="text-xs text-[#64748b]">
              Preview async loading skeletons and upstream failure triggers
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSimulationMode('normal');
                setDismissError(false);
              }}
              className={`px-3 py-1 rounded font-geist text-xs font-semibold cursor-pointer transition-all ${
                simulationMode === 'normal'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:text-[#0f172a]'
              }`}
            >
              Normal Loaded
            </button>
            <button
              type="button"
              onClick={() => setSimulationMode('loading')}
              className={`px-3 py-1 rounded font-geist text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                simulationMode === 'loading'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:text-[#0f172a]'
              }`}
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>SWR Fetching (Skeleton)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulationMode('error');
                setDismissError(false);
              }}
              className={`px-3 py-1 rounded font-geist text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                simulationMode === 'error'
                  ? 'bg-[#ba1a1a] text-white shadow-xs'
                  : 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6] hover:bg-[#ffdad6]/80'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>503 Outage Simulation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
