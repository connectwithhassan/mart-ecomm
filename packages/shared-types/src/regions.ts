export interface Region {
  id: string;
  code: string; // e.g. 'US', 'EU', 'UK', 'GCC', 'PK'
  name: string;
  defaultCurrency: string; // 'USD', 'EUR', 'GBP', 'AED', 'PKR'
  taxEngine: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ExchangeRate {
  id: string;
  baseCurrency: string; // 'USD'
  targetCurrency: string; // 'EUR', 'GBP', etc.
  marketRate: number;
  bufferPercentage: number; // default 1.5%
  effectiveRate: number; // marketRate * (1 + bufferPercentage/100)
  updatedAt: Date;
}
