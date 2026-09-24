export interface MonthlyDataPoint {
  month: string;          // YYYY-MM
  displayMonth: string;   // e.g. "Mar 2025"
  sora3m: number;
  sora1m: number;
  soraOn: number;
  hdbMedian: number;
  hdbP25: number;
  hdbP75: number;
  hdbVolume: number;
  avgPsf: number;
  apiStatus: string;
}

export interface KpiMetrics {
  latestSora3m: number;
  soraMoM: number;
  latestSora1m: number;
  latestSoraOn: number;
  latestMedianPrice: number;
  medianPriceMoM: number;
  medianPriceYoY: number;
  avgPsf: number;
  latestVolume: number;
  volumeMoM: number;
  baselineRunRate: number;
  correlationR: number;
  rSquared: number;
  pVal: number;
  mortgageSensitivity: number; // SGD/mo per +50bps on median
  totalTransactions: number;
  lastReportingMonth: string;
}

export interface FilterState {
  timeHorizon: '1Y' | '3Y' | '5Y' | 'ALL';
  town: string;
  flatType: string;
  tenor: '3M' | '1M' | 'ON';
}

export interface ApiResponseData {
  series: MonthlyDataPoint[];
  kpi: KpiMetrics;
  lastRefreshed: string;
  ttlSeconds: number;
  sources: {
    mas: {
      url: string;
      resourceId: string;
      status: string;
      mode: string;
    };
    dataGov: {
      url: string;
      resourceId: string;
      status: string;
      totalRecords: number;
    };
  };
  isFallback?: boolean;
}

export interface ApiProbeResult {
  mas: {
    status: number;
    statusText: string;
    latencyMs: number;
    url: string;
    resourceId: string;
    total: number;
    sampleRecord?: any;
    error?: string;
  };
  dataGov: {
    status: number;
    statusText: string;
    latencyMs: number;
    url: string;
    resourceId: string;
    total: number;
    sampleRecord?: any;
    error?: string;
  };
  serverTime: string;
}

export interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  server: {
    status: string;
    port: number | string;
    memory: {
      rssMB: string;
      heapUsedMB: string;
      heapTotalMB: string;
    };
    cachedRecords: {
      hdbRecords: number;
      soraMonths: number;
      cacheAgeSeconds: number;
      ttlSeconds: number;
    };
  };
  services: {
    datagov: {
      name: string;
      status: string;
      httpStatus: number;
      latencyMs: number;
      resourceId: string;
    };
    mas: {
      name: string;
      status: string;
      httpStatus: number;
      latencyMs: number;
      resourceId: string;
      fallbackActive: boolean;
    };
    dualLayerClientFailover: {
      name: string;
      status: string;
      corsEnabled: boolean;
    };
  };
  totalHealthCheckLatencyMs: number;
}

