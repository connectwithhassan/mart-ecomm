export interface Shipment {
  id: string;
  subOrderId: string;
  carrier: string; // 'DHL', 'FedEx', 'UPS', 'Aramex'
  trackingNumber: string;
  labelFormat: string;
  labelUrl: string;
  commercialInvoiceUrl: string;
  weightKg: number;
  customsDeclaration: Record<string, unknown>;
  currentStatus: string;
  shippedAt?: Date | null;
  estimatedDelivery?: Date | null;
  actualDelivery?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookStatus = 'pending' | 'processed' | 'ignored' | 'failed';

export interface WebhookEvent {
  id: string;
  source: 'stripe' | 'easypost' | 'wise';
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: WebhookStatus;
  errorMessage?: string | null;
  receivedAt: Date;
  processedAt?: Date | null;
}
