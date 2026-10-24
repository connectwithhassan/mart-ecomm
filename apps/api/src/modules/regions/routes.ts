import { FastifyPluginAsync } from 'fastify';

export const regionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      description: 'List supported international marketplace regions',
      tags: ['Regions'],
    },
  }, async (request, reply) => {
    // In-memory baseline regions (backed by DB in Phase 2)
    const regions = [
      { code: 'US', name: 'United States', defaultCurrency: 'USD', taxEngine: 'stripe_tax', isActive: true },
      { code: 'EU', name: 'European Union', defaultCurrency: 'EUR', taxEngine: 'stripe_tax', isActive: true },
      { code: 'UK', name: 'United Kingdom', defaultCurrency: 'GBP', taxEngine: 'stripe_tax', isActive: true },
      { code: 'GCC', name: 'Gulf Cooperation Council', defaultCurrency: 'AED', taxEngine: 'stripe_tax', isActive: true },
      { code: 'PK', name: 'Pakistan', defaultCurrency: 'PKR', taxEngine: 'stripe_tax', isActive: true },
    ];

    return reply.status(200).send({
      success: true,
      data: regions,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  });

  fastify.get('/exchange-rates', {
    schema: {
      description: 'Get active FX exchange rates with applied 1.5% slippage buffer',
      tags: ['Regions'],
    },
  }, async (request, reply) => {
    const exchangeRates = {
      baseCurrency: 'USD',
      bufferPercentage: 1.5,
      rates: {
        EUR: { marketRate: 0.920000, effectiveRate: 0.933800 },
        GBP: { marketRate: 0.790000, effectiveRate: 0.801850 },
        AED: { marketRate: 3.672500, effectiveRate: 3.727588 },
        PKR: { marketRate: 278.500000, effectiveRate: 282.677500 },
      },
      updatedAt: new Date().toISOString(),
    };

    return reply.status(200).send({
      success: true,
      data: exchangeRates,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  });
};
