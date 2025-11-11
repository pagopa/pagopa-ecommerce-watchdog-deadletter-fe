export interface DeadletterResponse { 
  deadletterTransactions: Transaction[],
  page: Page
}

export interface Transaction {
  transactionId: string;
  insertionDate: string;
  paymentToken: string;
  paymentMethodName: string;
  pspId: string;
  eCommerceStatus: string;
  gatewayAuthorizationStatus: string | null;
  paymentEndToEndId: string | null;
  operationId: string;
  deadletterTransactionDetails: TransactionDetails;
  eCommerceDetails: ECommerceDetails | null;
  nodoDetails: NodoDetails | null;
  npgDetails: NpgDetails | null;
}

interface Page {
  current: number,
  results: number,
  total: number
}

interface TransactionDetails {
  queueName: string;
  data: string;
  timestamp: string;
  transactionInfo: TransactionInfo;
}

interface TransactionInfo {
  transactionId: string;
  authorizationRequestId: string;
  eCommerceStatus: string;
  paymentGateway: string;
  paymentTokens: string[];
  pspId: string;
  paymentMethodName: string;
  grandTotal: number;
  rrn: string | null;
  details: TransactionInfoDetails;
}

interface TransactionInfoDetails {
  type: string;
  operationResult: string;
  operationId: string;
  correlationId: string;
  paymentEndToEndId: string | null;
  outcome: string | null;
}

interface UserInfo {
  userFiscalCode: string | null;
  notificationEmail: string;
  surname: string | null;
  name: string | null;
  username: string | null;
  authenticationType: string;
}

interface ECommerceTransactionInfo {
  creationDate: string;
  status: string;
  statusDetails: string | null;
  eventStatus: string;
  amount: number;
  fee: number;
  grandTotal: number;
  rrn: string | null;
  authorizationCode: string | null;
  authorizationOperationId: string | null;
  refundOperationId: string | null;
  paymentMethodName: string;
  brand: string;
  authorizationRequestId: string;
  paymentGateway: string;
  correlationId: string;
  gatewayAuthorizationStatus: string | null;
  gatewayErrorCode: string | null;
}

interface PaymentDetail {
  subject: string;
  iuv: string | null;
  rptId: string;
  amount: number;
  paymentToken: string;
  creditorInstitution: string;
  paFiscalCode: string;
}

interface PaymentInfo {
  origin: string;
  idTransaction: string;
  details: PaymentDetail[];
}

interface PspInfo {
  pspId: string;
  businessName: string;
  idChannel: string;
}

interface ECommerceDetails {
  userInfo: UserInfo;
  transactionInfo: ECommerceTransactionInfo;
  paymentInfo: PaymentInfo;
  pspInfo: PspInfo;
  product: string;
}

interface NodoDetails {
  dateFrom: string;
  dateTo: string;
  data: unknown[]; //TODO: use a specific type; mock DB only has empty array as "data" value
}

interface NpgOperation {
  additionalData: NpgOperationAdditionalData;
  operationAmount: string;
  operationCurrency: string;
  operationId: string;
  operationResult: string;
  operationTime: string;
  operationType: string;
  orderId: string;
  paymentCircuit: string;
  paymentEndToEndId: string | null;
  paymentMethod: string;
}

interface NpgOperationAdditionalData {
  authorizationCode: string | null;
  rrn: string | null;
}

interface NpgDetails {
  operations: NpgOperation[];
}