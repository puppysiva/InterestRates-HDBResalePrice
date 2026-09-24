/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ApiDiagnostics } from './components/ApiDiagnostics';
import { NextjsSetupGuide } from './components/NextjsSetupGuide';
import { Footer } from './components/Footer';
import { ApiResponseData, FilterState } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'diagnostics' | 'setup'>('dashboard');

  const [filters, setFilters] = useState<FilterState>({
    timeHorizon: '3Y',
    town: 'ALL',
    flatType: 'ALL',
    tenor: '3M',
  });

  const [data, setData] = useState<ApiResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const fetchData = useCallback(
    async (force = false) => {
      if (force) {
        setIsPurging(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          timeHorizon: filters.timeHorizon,
          town: filters.town,
          flatType: filters.flatType,
          tenor: filters.tenor,
          forceRefresh: force ? 'true' : 'false',
        });

        const res = await fetch(`/api/data?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const json: ApiResponseData = await res.json();
        setData(json);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to communicate with Singapore API upstream gateway');
      } finally {
        setLoading(false);
        setIsPurging(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      timeHorizon: '3Y',
      town: 'ALL',
      flatType: 'ALL',
      tenor: '3M',
    });
  };

  const handlePurgeCache = async () => {
    setIsPurging(true);
    try {
      await fetch('/api/cache/refresh', { method: 'POST' });
      await fetchData(true);
    } catch (e) {
      console.error('Purge error:', e);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      {/* Top Fixed Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lastRefreshed={data?.lastRefreshed || ''}
        isPurging={isPurging}
        onPurgeCache={handlePurgeCache}
      />

      {/* Main Content Area (padded for fixed header) */}
      <main className="flex-1 pt-24">
        {activeTab === 'dashboard' && (
          <Dashboard
            data={data}
            loading={loading}
            error={error}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onForceRefresh={handlePurgeCache}
            isPurging={isPurging}
          />
        )}

        {activeTab === 'diagnostics' && <ApiDiagnostics />}

        {activeTab === 'setup' && <NextjsSetupGuide />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
