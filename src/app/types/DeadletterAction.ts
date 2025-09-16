export interface DeadletterAction {
  id: string;
  deadletterTransactionId: string;
  userId: string;
  value: string;
  timestamp: string;
}