import { ECommerceDetails, NodoDetails, NpgDetails } from "./DeadletterResponse";

export type RefundRequestStatus = 'REQUESTED' | 'ERROR' | 'DONE';

export const ACTIONABLE_REFUND_STATUSES: RefundRequestStatus[] = ['REQUESTED', 'ERROR'];

export interface RefundCandidate {
  transactionId: string;
  refundReason: string;
  status: RefundRequestStatus;
}

export interface RefundCandidatesResponse {
  transactions: RefundCandidate[];
}

export interface RefundTransactionDetail {
  transactionId: string;
  eCommerceDetails: ECommerceDetails | null;
  npgDetails: NpgDetails | null;
  nodoDetails: NodoDetails | null;
}

export interface RefundStatusResponse {
  status: RefundRequestStatus;
}

export type RefundStartResult = 'started' | 'invalidOtp' | 'conflict' | 'unauthorized' | 'error';

export type RefundOutcome = 'idle' | 'polling' | 'success' | 'error' | 'timeout';
