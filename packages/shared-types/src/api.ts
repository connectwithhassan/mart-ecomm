export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiPaginatedEnvelope<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{
    name: string;
    reason: string;
  }>;
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorDetail;
  meta: ApiMeta;
}
