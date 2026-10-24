import { storefrontTokens } from '@marketplace/design-tokens';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-900">
      <header className="max-w-4xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800">
          Global Cross-Border E-Commerce
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900">
          Delivered Duty Paid. <span style={{ color: storefrontTokens.colors.primary }}>Zero Surprises.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Shop directly from verified international makers across the US, Europe, Japan, and the Middle East with transparent customs tariffs, import VAT, and multi-currency pricing calculated at checkout.
        </p>
      </header>

      <div className="mt-8 flex gap-4">
        <a
          href="/catalog"
          className="px-6 py-3 rounded-lg font-semibold text-white shadow-sm transition hover:opacity-95"
          style={{ backgroundColor: storefrontTokens.colors.accent }}
        >
          Explore Catalog
        </a>
        <a
          href="http://localhost:4000/docs"
          className="px-6 py-3 rounded-lg font-semibold bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50"
        >
          API Specification
        </a>
      </div>
    </main>
  );
}
