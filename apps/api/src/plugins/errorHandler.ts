import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import type { ApiErrorEnvelope } from '@marketplace/shared-types';

export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    const isClientError = statusCode >= 400 && statusCode < 500;

    const errorPayload: ApiErrorEnvelope = {
      success: false,
      error: {
        type: `https://errors.marketplace.global/${isClientError ? 'client-error' : 'internal-error'}`,
        title: error.name || 'Application Error',
        status: statusCode,
        detail: error.message || 'An unexpected error occurred.',
        instance: request.url,
        invalidParams: error.validation
          ? error.validation.map((v) => ({
              name: v.instancePath || v.params?.missingProperty?.toString() || 'unknown',
              reason: v.message || 'Validation failed',
            }))
          : undefined,
      },
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    };

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Internal Server Error');
    }

    reply.status(statusCode).send(errorPayload);
  });
}
