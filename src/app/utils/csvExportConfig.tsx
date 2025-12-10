import { Transaction } from "../types/DeadletterResponse";

export type ExportType = 'mybank_intesa' | 'mybank_unicredit' | 'bancomat_pay';

export interface ExportConfig {
  label: string;
  description: string;
  filter: (transaction: Transaction) => boolean;
  columns: string[];
  getColumnValue: (transaction: Transaction, column: string) => string;
  fileNamePrefix: string;
}

export const exportConfigs: Record<ExportType, ExportConfig> = {
  mybank_intesa: {
    label: "MyBank Intesa",
    description: "Storni MyBank Intesa (REFUND_ERROR, BCITITMM)",
    filter: (t) => {
      return t.paymentMethodName === 'MYBANK' &&
             t.eCommerceStatus === 'REFUND_ERROR' &&
             t.pspId === 'BCITITMM';
    },
    columns: ['insertionDate', 'transactionId', 'paymentToken', 'paymentEndToEndId'],
    getColumnValue: (transaction: Transaction, column: string) => {
      if (column === 'insertionDate') {
        const date = transaction.insertionDate;
        if (!date) return '';
        const dateObj = new Date(date);
        return dateObj.toISOString().split('T')[0];
      }
      return transaction[column as keyof Transaction] as string || '';
    },
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
    columns: ['insertionDate', 'transactionId', 'paymentToken', 'paymentEndToEndId'],
    getColumnValue: (transaction, column) => {
      if (column === 'insertionDate') {
        const date = transaction.insertionDate;
        if (!date) return '';
        const dateObj = new Date(date);
        return dateObj.toISOString().split('T')[0];
      }
      return transaction[column as keyof Transaction] as string || '';
    },
    fileNamePrefix: 'StorniMyBank_Unicredit'
  },
  bancomat_pay: {
    label: "BancomatPay",
    description: "Transazioni BancomatPay con gatewayAuthorizationStatus = PENDING",
    filter: (t) => {
      return t.gatewayAuthorizationStatus === 'PENDING' && 
             t.paymentMethodName === 'BANCOMATPAY';
    },
    columns: ['insertionDate', 'transactionId', 'paymentToken', 'gatewayAuthorizationStatus'],
    getColumnValue: (transaction, column) => {
      if (column === 'insertionDate') {
        const date = transaction.insertionDate;
        if (!date) return '';
        const dateObj = new Date(date);
        return dateObj.toISOString().split('T')[0];
      }
      return transaction[column as keyof Transaction] as string || '';
    },
    fileNamePrefix: 'BancomatPay_Pending'
  }
};