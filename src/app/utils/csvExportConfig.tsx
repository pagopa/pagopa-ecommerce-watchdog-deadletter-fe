import { Transaction } from "../types/DeadletterResponse";
import { TransactionNote } from "../types/TransactionNotes";
import { DeadletterAction } from "../types/DeadletterAction";
import { getDeadletterActionAsString } from "./types/DeadletterActionUtils";

export type ExportType = 'mybank_intesa' | 'mybank_unicredit' | 'bancomat_pay' | 'all_range';

export interface ExportConfig {
  label: string;
  description: string;
  filter: (transaction: Transaction) => boolean;
  columns: string[];
  getColumnValue: (transaction: ExportableTransaction, column: string) => string;
  fileNamePrefix: string;
}

export type ExportableTransaction = Transaction & {
  actions?: Map<string, DeadletterAction>;
  notes?: TransactionNote[];
};

const getExtraColumnValue = (transaction: ExportableTransaction, column: string): string | undefined => {
  if (column === 'actions') {
    return Array.from(transaction.actions?.values() ?? [])
      .sort((a, b) => new Date(b.timestamp).valueOf() - new Date(a.timestamp).valueOf())
      .map(getDeadletterActionAsString)
      .join(' | ');
  }

  if (column === 'notes') {
    return (transaction.notes ?? [])
      .map((note) => {
        const createdAt = new Date(note.createdAt);
        const formattedDate = Number.isNaN(createdAt.getTime())
          ? note.createdAt
          : createdAt.toISOString();

        return `[${note.userId} - ${formattedDate}] ${note.note}`;
      })
      .join(' | ');
  }

  return undefined;
};

const getColumnValue = (
  transaction: ExportableTransaction,
  column: string,
  formatDate: (date: Date) => string
): string => {
  const extraValue = getExtraColumnValue(transaction, column);
  if (extraValue !== undefined) return extraValue;

  if (column === 'insertionDate') {
    const date = transaction.insertionDate;
    if (!date) return '';
    return formatDate(new Date(date));
  }

  if (column === 'authorizationRequestId') {
    return transaction.eCommerceDetails?.transactionInfo?.authorizationRequestId || '';
  }

  if (column === 'amount') {
    return transaction.eCommerceDetails?.transactionInfo?.grandTotal.toString() || '';
  }

  return transaction[column as keyof Transaction] as string || '';
};

const formatShortDate = (date: Date): string => date.toISOString().split('T')[0];
const formatDateTime = (date: Date): string => date.toISOString().split('.')[0];

export const exportConfigs: Record<ExportType, ExportConfig> = {
  mybank_intesa: {
    label: "MyBank Intesa",
    description: "Storni MyBank Intesa (REFUND_ERROR, BCITITMM)",
    filter: (t) => {
      return t.paymentMethodName === 'MYBANK' &&
        t.eCommerceStatus === 'REFUND_ERROR' &&
        t.pspId === 'BCITITMM';
    },
    columns: ['insertionDate', 'transactionId', 'paymentToken', 'paymentEndToEndId', 'actions', 'notes'],
    getColumnValue: (transaction, column) => getColumnValue(transaction, column, formatShortDate),
    fileNamePrefix: 'StorniMyBank_Intesa'
  },
  mybank_unicredit: {
    label: "MyBank Unicredit",
    description: "Storni MyBank Unicredit (REFUND_ERROR, UNCRITMM)",
    filter: (t) => {
      return t.paymentMethodName === 'MYBANK' &&
        t.eCommerceStatus === 'REFUND_ERROR' &&
        t.pspId === 'UNCRITMM';
    },
    columns: ['insertionDate', 'transactionId', 'paymentToken', 'paymentEndToEndId', 'actions', 'notes'],
    getColumnValue: (transaction, column) => getColumnValue(transaction, column, formatShortDate),
    fileNamePrefix: 'StorniMyBank_Unicredit'
  },
  bancomat_pay: {
    label: "BancomatPay",
    description: "Transazioni BancomatPay con gatewayAuthorizationStatus = PENDING",
    filter: (t) => {
      return (t.gatewayAuthorizationStatus === 'PENDING' || t.gatewayAuthorizationStatus == null || t.gatewayAuthorizationStatus == 'null') &&
        t.paymentMethodName === 'BANCOMATPAY';
    },
    columns: ['insertionDate', 'transactionId', 'paymentToken', 'gatewayAuthorizationStatus', 'actions', 'notes'],
    getColumnValue: (transaction, column) => getColumnValue(transaction, column, formatShortDate),
    fileNamePrefix: 'BancomatPay_Pending'
  },
  all_range: {
    label: "Tutte le transazioni",
    description: "Tutte le transazioni nel range selezionato",
    filter: () => true,
    columns: ['insertionDate', 'transactionId', 'paymentToken', 'paymentMethodName', 'pspId', 'eCommerceStatus', 'gatewayAuthorizationStatus', 'nodoStatus', 'paymentEndToEndId', 'authorizationRequestId', "amount", 'actions', 'notes'],
    getColumnValue: (transaction, column) => getColumnValue(transaction, column, formatDateTime),
    fileNamePrefix: 'Tutte_Transazioni'
  }
};