import React from 'react';
import { portalTokens } from '@marketplace/design-tokens';

export default function App() {
  return (
    <div
      className="min-h-screen p-8 text-slate-100 flex flex-col justify-between"
      style={{ backgroundColor: portalTokens.colors.background }}
    >
      <header className="flex justify-between items-center border-b pb-4" style={{ borderColor: portalTokens.colors.border }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-slate-900 bg-red-400"
          >
            A
          </div>
          <span className="font-mono font-bold tracking-tight text-lg">Super Admin Platform</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>Role: Super Admin</span>
          <span>Ledger Audit: Balanced (0.0000 Diff)</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto my-12 text-center space-y-6">
        <h1 className="text-3xl font-mono font-bold text-red-400">
          Global Marketplace Governance & Ledger Audit Console
        </h1>
        <p className="text-slate-300 max-w-xl mx-auto">
          Review vendor KYC submissions, audit double-entry general ledger journal entries, manage regional tax engines & foreign exchange risk buffers, and mediate cross-border disputes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-6">
          <div className="p-4 rounded border bg-slate-900/60" style={{ borderColor: portalTokens.colors.border }}>
            <div className="text-xs text-slate-400 font-mono">KYC PENDING</div>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-100">4 Vendors</div>
            <div className="text-xs text-amber-400 mt-2">Requires corporate verification</div>
          </div>
          <div className="p-4 rounded border bg-slate-900/60" style={{ borderColor: portalTokens.colors.border }}>
            <div className="text-xs text-slate-400 font-mono">TOTAL ESCROW HELD</div>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-100">$218,450.00</div>
            <div className="text-xs text-emerald-400 mt-2">Zero-balance invariant verified</div>
          </div>
          <div className="p-4 rounded border bg-slate-900/60" style={{ borderColor: portalTokens.colors.border }}>
            <div className="text-xs text-slate-400 font-mono">MARKETPLACE REVENUE (10%)</div>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-100">$24,272.20</div>
            <div className="text-xs text-slate-400 mt-2">Account 4010 posted</div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs font-mono text-slate-500 border-t pt-4" style={{ borderColor: portalTokens.colors.border }}>
        Enterprise Multi-Vendor Marketplace Platform — Super Admin Console
      </footer>
    </div>
  );
}
