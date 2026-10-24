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
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-slate-900"
            style={{ backgroundColor: portalTokens.colors.accent }}
          >
            S
          </div>
          <span className="font-mono font-bold tracking-tight text-lg">Seller Center Console</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>Density: 8/10</span>
          <span>Tenant Mode: Strict</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto my-12 text-center space-y-6">
        <h1 className="text-3xl font-mono font-bold text-emerald-400">
          Vendor Logistics & Split Fulfillment Console
        </h1>
        <p className="text-slate-300 max-w-xl mx-auto">
          Manage physical warehouses across global origin points, fulfill assigned child sub-orders, generate 1-click Airway Bills (AWB) and Commercial Invoices, and monitor real-time escrow maturity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-6">
          <div className="p-4 rounded border bg-slate-900/60" style={{ borderColor: portalTokens.colors.border }}>
            <div className="text-xs text-slate-400 font-mono">WAREHOUSES</div>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-100">3 Active</div>
            <div className="text-xs text-emerald-400 mt-2">USA, Japan, Germany</div>
          </div>
          <div className="p-4 rounded border bg-slate-900/60" style={{ borderColor: portalTokens.colors.border }}>
            <div className="text-xs text-slate-400 font-mono">ESCROW MATURING</div>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-100">$14,890.50</div>
            <div className="text-xs text-amber-400 mt-2">14-day post-delivery inspection</div>
          </div>
          <div className="p-4 rounded border bg-slate-900/60" style={{ borderColor: portalTokens.colors.border }}>
            <div className="text-xs text-slate-400 font-mono">ROLLING RESERVE (10%)</div>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-100">$2,450.00</div>
            <div className="text-xs text-slate-400 mt-2">Held 60 days against disputes</div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs font-mono text-slate-500 border-t pt-4" style={{ borderColor: portalTokens.colors.border }}>
        Enterprise Multi-Vendor Marketplace Platform — Seller Center
      </footer>
    </div>
  );
}
