import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#131b2e] text-[#dae2fd] border-t border-[#213145] mt-12 py-8 px-4 sm:px-8 font-geist">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#89f5e7]" />
            <span className="font-bold text-sm text-white uppercase tracking-wider">
              Statutory Open Data Provenance &amp; Disclosures
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
            SORA domestic interest rates sourced directly from the Monetary Authority of Singapore (MAS API). HDB resale transaction records aggregated directly from the Housing &amp; Development Board via the Singapore Open Data Portal (data.gov.sg). All benchmark calculations conform to IOSCO Principles for Financial Benchmarks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-[#94a3b8]">
          <a
            href="https://eservices.mas.gov.sg"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>MAS API Gateway</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="hidden sm:inline text-[#3f465c]">•</span>
          <a
            href="https://data.gov.sg"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Data.gov.sg Datastore</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="hidden sm:inline text-[#3f465c]">•</span>
          <span>Next.js SWR Architecture</span>
        </div>
      </div>
    </footer>
  );
};
