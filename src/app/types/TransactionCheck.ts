import { ECommerceDetails, NodoDetails, NpgDetails } from "./DeadletterResponse";

export interface TransactionEvent {
  eventCode: string;
  creationDate: string;
}

export interface TransactionCheck {
  transactionId: string;
  eCommerceStatus: string | null;
  nodoStatus: string | null;
  gatewayStatus: string | null;
  events: TransactionEvent[];
  eCommerceDetails: ECommerceDetails | null;
  npgDetails: NpgDetails | null;
  nodoDetails: NodoDetails | null;
}

export type TransactionCheckResult =
  | { outcome: 'found'; transaction: TransactionCheck }
  | { outcome: 'notFound' | 'unauthorized' | 'error' };

export type RefundRequestResult =
  | { outcome: 'accepted' | 'completed' | 'invalidOtp' | 'unauthorized' | 'notFound' | 'error' }
  | { outcome: 'gatewayError' | 'notRefundable'; message: string };
