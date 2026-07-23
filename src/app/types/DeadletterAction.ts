export interface DeadletterAction {
  id: string;
  deadletterTransactionId?: string;
  transactionId?: string;
  userId: string;
  action: ActionType;
  timestamp: string;
}

export interface ActionType {
  value: string;
  type: "FINAL" | "NOT_FINAL";
}