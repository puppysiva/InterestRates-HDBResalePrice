import React from 'react';
import { RefreshCw, User, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'diagnostics' | 'setup';
  onTabChange: (tab: 'dashboard' | 'diagnostics' | 'setup') => void;
  lastRefreshed: string;
  isPurging: boolean;
  onPurgeCache: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  lastRefreshed,
  isPurging,
  onPurgeCache,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#131b2e] shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
      <div className="w-full px-4 sm:px-8 flex flex-col justify-between pt-2 pb-0">
        {/* Top bar row */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img
              src="/app-icon.svg"
              alt="SG MacroProp Logo"
              className="h-8 w-8 object-contain rounded"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-geist font-bold text-sm sm:text-base text-white uppercase tracking-tight">
                  SG MacroProp
                </span>
                <span className="text-[#7c839b] text-xs">|</span>
                <span className="font-geist text-xs sm:text-sm text-[#dae2fd] font-semibold">
                  Rates & Housing Monitor
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-geist text-[10px] sm:text-[11px] text-[#7c839b] uppercase tracking-wider">
                  MAS SORA // HDB PROPERTY INTELLIGENCE
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Indicator */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#213145]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#89f5e7] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0c9488]"></span>
              </span>
              <span className="font-geist text-xs text-[#eaf1ff]">
                Live API: MAS & data.gov.sg Connected
              </span>
            </div>

            {/* Last Sync */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#213145]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#89f5e7]" />
              <span className="font-geist text-xs text-[#eaf1ff]">
                Last Sync: {lastRefreshed || 'Just now'}
              </span>
            </div>

            {/* Purge Cache Button */}
            <button
              onClick={onPurgeCache}
              disabled={isPurging}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#213145] hover:bg-[#324560] text-[#eaf1ff] transition-colors cursor-pointer disabled:opacity-50"
              title="Force server cache revalidation against MAS and data.gov.sg"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#89f5e7] ${isPurging ? 'animate-spin' : ''}`} />
              <span className="font-geist text-xs font-semibold">
                {isPurging ? 'Syncing...' : 'Purge Cache'}
              </span>
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#0b1c30] border border-[#3f465c] flex items-center justify-center text-white">
              <User className="w-4 h-4 text-[#dae2fd]" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="flex items-center justify-between border-t border-[#213145]/60 h-10 overflow-x-auto">
          <nav className="flex items-center gap-1 h-full">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`h-full px-3.5 flex items-center font-geist text-xs font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-[#e21e49] text-white bg-[#213145]'
                  : 'border-transparent text-[#7c839b] hover:text-white'
              }`}
            >
              Dashboard & Visualizer
            </button>
            <button
              onClick={() => onTabChange('diagnostics')}
              className={`h-full px-3.5 flex items-center font-geist text-xs font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'diagnostics'
                  ? 'border-[#e21e49] text-white bg-[#213145]'
                  : 'border-transparent text-[#7c839b] hover:text-white'
              }`}
            >
              API Diagnostics & Pagination
            </button>
            <button
              onClick={() => onTabChange('setup')}
              className={`h-full px-3.5 flex items-center font-geist text-xs font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'setup'
                  ? 'border-[#e21e49] text-white bg-[#213145]'
                  : 'border-transparent text-[#7c839b] hover:text-white'
              }`}
            >
              Next.js Setup Guide & Keys
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-2 text-[#7c839b] font-geist text-xs">
            <span>ENV: PRODUCTION-SG</span>
            <span>•</span>
            <span>QUOTA: 842/1000 REQ</span>
          </div>
        </div>
      </div>
    </header>
  );
};
