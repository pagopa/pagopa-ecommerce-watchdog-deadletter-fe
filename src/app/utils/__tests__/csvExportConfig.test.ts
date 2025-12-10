import { exportConfigs, ExportType } from '../csvExportConfig';
import { Transaction } from '../../types/DeadletterResponse';

describe('csvExportConfig', () => {

  describe('exportConfigs structure', () => {
    it('should have all three export types defined', () => {
      expect(exportConfigs).toHaveProperty('mybank_intesa');
      expect(exportConfigs).toHaveProperty('mybank_unicredit');
      expect(exportConfigs).toHaveProperty('bancomat_pay');
    });

    it('should have correct labels for each export type', () => {
      expect(exportConfigs.mybank_intesa.label).toBe('MyBank Intesa');
      expect(exportConfigs.mybank_unicredit.label).toBe('MyBank Unicredit');
      expect(exportConfigs.bancomat_pay.label).toBe('BancomatPay');
    });

    it('should have descriptions for each export type', () => {
      expect(exportConfigs.mybank_intesa.description).toContain('Storni MyBank Intesa');
      expect(exportConfigs.mybank_unicredit.description).toContain('Storni MyBank Unicredit');
      expect(exportConfigs.bancomat_pay.description).toContain('BancomatPay');
    });

    it('should have correct file name prefixes', () => {
      expect(exportConfigs.mybank_intesa.fileNamePrefix).toBe('StorniMyBank_Intesa');
      expect(exportConfigs.mybank_unicredit.fileNamePrefix).toBe('StorniMyBank_Unicredit');
      expect(exportConfigs.bancomat_pay.fileNamePrefix).toBe('BancomatPay_Pending');
    });

    it('should have columns defined for each export type', () => {
      expect(exportConfigs.mybank_intesa.columns).toHaveLength(4);
      expect(exportConfigs.mybank_unicredit.columns).toHaveLength(4);
      expect(exportConfigs.bancomat_pay.columns).toHaveLength(4);
    });
  });

  describe('mybank_intesa filter', () => {
    it('should accept transactions with correct criteria', () => {
      const validTransaction: Transaction = {
        paymentMethodName: 'MYBANK',
        eCommerceStatus: 'REFUND_ERROR',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'BCITITMM',
      } as Transaction;

      expect(exportConfigs.mybank_intesa.filter(validTransaction)).toBe(true);
    });

    it('should reject transactions with wrong payment method', () => {
      const invalidTransaction: Transaction = {
        paymentMethodName: 'CARD',
        eCommerceStatus: 'REFUND_ERROR',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'BCITITMM',
      } as Transaction;

      expect(exportConfigs.mybank_intesa.filter(invalidTransaction)).toBe(false);
    });

    it('should reject transactions with wrong eCommerce status', () => {
      const invalidTransaction: Transaction = {
        paymentMethodName: 'MYBANK',
        eCommerceStatus: 'COMPLETED',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'BCITITMM',
      } as Transaction;

      expect(exportConfigs.mybank_intesa.filter(invalidTransaction)).toBe(false);
    });

    it('should reject transactions with wrong PSP ID', () => {
      const invalidTransaction: Transaction = {
        paymentMethodName: 'MYBANK',
        eCommerceStatus: 'REFUND_ERROR',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'UNCRITMM',
      } as Transaction;

      expect(exportConfigs.mybank_intesa.filter(invalidTransaction)).toBe(false);
    });
  });

  describe('mybank_unicredit filter', () => {
    it('should accept transactions with correct criteria', () => {
      const validTransaction: Transaction = {
        paymentMethodName: 'MYBANK',
        eCommerceStatus: 'REFUND_ERROR',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'UNCRITMM',
      } as Transaction;

      expect(exportConfigs.mybank_unicredit.filter(validTransaction)).toBe(true);
    });

    it('should reject transactions with wrong PSP ID', () => {
      const invalidTransaction: Transaction = {
        paymentMethodName: 'MYBANK',
        eCommerceStatus: 'REFUND_ERROR',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'BCITITMM',
      } as Transaction;

      expect(exportConfigs.mybank_unicredit.filter(invalidTransaction)).toBe(false);
    });
  });

  describe('bancomat_pay filter', () => {
    it('should accept transactions with correct criteria', () => {
      const validTransaction: Transaction = {
        gatewayAuthorizationStatus: 'PENDING',
        paymentMethodName: 'BANCOMATPAY',
      } as Transaction;

      expect(exportConfigs.bancomat_pay.filter(validTransaction)).toBe(true);
    });

    it('should reject transactions with wrong gateway status', () => {
      const invalidTransaction: Transaction = {
        gatewayAuthorizationStatus: 'EXECUTED',
        paymentMethodName: 'BANCOMATPAY',
      } as Transaction;

      expect(exportConfigs.bancomat_pay.filter(invalidTransaction)).toBe(false);
    });

    it('should reject transactions with wrong payment method', () => {
      const invalidTransaction: Transaction = {
        gatewayAuthorizationStatus: 'PENDING',
        paymentMethodName: 'MYBANK',
      } as Transaction;

      expect(exportConfigs.bancomat_pay.filter(invalidTransaction)).toBe(false);
    });
  });

  describe('getColumnValue function', () => {
    const mockTransaction: Transaction = {
      transactionId: 'tx-123',
      insertionDate: '2024-12-06T15:30:00Z',
      paymentToken: 'token-abc',
      paymentEndToEndId: 'e2e-xyz',
      gatewayAuthorizationStatus: 'PENDING',
    } as Transaction;

    describe('for mybank_intesa', () => {
      it('should format insertionDate to YYYY-MM-DD', () => {
        const result = exportConfigs.mybank_intesa.getColumnValue(mockTransaction, 'insertionDate');
        expect(result).toBe('2024-12-06');
      });

      it('should return empty string for missing insertionDate', () => {
        const transactionNoDate: Transaction = {
          transactionId: 'tx-123',
        } as Transaction;
        const result = exportConfigs.mybank_intesa.getColumnValue(transactionNoDate, 'insertionDate');
        expect(result).toBe('');
      });

      it('should return transactionId correctly', () => {
        const result = exportConfigs.mybank_intesa.getColumnValue(mockTransaction, 'transactionId');
        expect(result).toBe('tx-123');
      });

      it('should return paymentToken correctly', () => {
        const result = exportConfigs.mybank_intesa.getColumnValue(mockTransaction, 'paymentToken');
        expect(result).toBe('token-abc');
      });

      it('should return paymentEndToEndId correctly', () => {
        const result = exportConfigs.mybank_intesa.getColumnValue(mockTransaction, 'paymentEndToEndId');
        expect(result).toBe('e2e-xyz');
      });

      it('should return empty string for missing column', () => {
        const result = exportConfigs.mybank_intesa.getColumnValue({} as Transaction, 'nonExistentColumn');
        expect(result).toBe('');
      });
    });

    describe('for mybank_unicredit', () => {
      it('should format insertionDate to YYYY-MM-DD', () => {
        const result = exportConfigs.mybank_unicredit.getColumnValue(mockTransaction, 'insertionDate');
        expect(result).toBe('2024-12-06');
      });

      it('should return other columns correctly', () => {
        expect(exportConfigs.mybank_unicredit.getColumnValue(mockTransaction, 'transactionId')).toBe('tx-123');
        expect(exportConfigs.mybank_unicredit.getColumnValue(mockTransaction, 'paymentToken')).toBe('token-abc');
      });
    });

    describe('for bancomat_pay', () => {
      it('should format insertionDate to YYYY-MM-DD', () => {
        const result = exportConfigs.bancomat_pay.getColumnValue(mockTransaction, 'insertionDate');
        expect(result).toBe('2024-12-06');
      });

      it('should return gatewayAuthorizationStatus correctly', () => {
        const result = exportConfigs.bancomat_pay.getColumnValue(mockTransaction, 'gatewayAuthorizationStatus');
        expect(result).toBe('PENDING');
      });
    });
  });

  describe('columns configuration', () => {
    it('should have correct columns for mybank_intesa', () => {
      expect(exportConfigs.mybank_intesa.columns).toEqual([
        'insertionDate',
        'transactionId',
        'paymentToken',
        'paymentEndToEndId'
      ]);
    });

    it('should have correct columns for mybank_unicredit', () => {
      expect(exportConfigs.mybank_unicredit.columns).toEqual([
        'insertionDate',
        'transactionId',
        'paymentToken',
        'paymentEndToEndId'
      ]);
    });

    it('should have correct columns for bancomat_pay', () => {
      expect(exportConfigs.bancomat_pay.columns).toEqual([
        'insertionDate',
        'transactionId',
        'paymentToken',
        'gatewayAuthorizationStatus'
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle transactions with all fields undefined', () => {
      const emptyTransaction = {} as Transaction;
      
      expect(exportConfigs.mybank_intesa.filter(emptyTransaction)).toBe(false);
      expect(exportConfigs.mybank_unicredit.filter(emptyTransaction)).toBe(false);
      expect(exportConfigs.bancomat_pay.filter(emptyTransaction)).toBe(false);
    });

    it('should handle transactions with null values', () => {
      const nullTransaction: Transaction = {
        paymentMethodName: null as unknown as string,
        eCommerceStatus: null as unknown as string,
        gatewayAuthorizationStatus: null as unknown as string,
        pspId: null as unknown as string,
      } as Transaction;

      expect(exportConfigs.mybank_intesa.filter(nullTransaction)).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should have all ExportType keys in exportConfigs', () => {
      const exportTypes: ExportType[] = ['mybank_intesa', 'mybank_unicredit', 'bancomat_pay'];
      
      exportTypes.forEach(type => {
        expect(exportConfigs).toHaveProperty(type);
        expect(exportConfigs[type]).toBeDefined();
        expect(exportConfigs[type].filter).toBeInstanceOf(Function);
        expect(exportConfigs[type].getColumnValue).toBeInstanceOf(Function);
      });
    });
  });

  describe('filter consistency', () => {
    it('should have mutually exclusive filters', () => {
      const intesaTransaction: Transaction = {
        paymentMethodName: 'MYBANK',
        eCommerceStatus: 'REFUND_ERROR',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'BCITITMM',
      } as Transaction;

      expect(exportConfigs.mybank_intesa.filter(intesaTransaction)).toBe(true);
      expect(exportConfigs.mybank_unicredit.filter(intesaTransaction)).toBe(false);
      expect(exportConfigs.bancomat_pay.filter(intesaTransaction)).toBe(false);
    });

    it('should filter correctly for each type independently', () => {
      const unicreditTransaction: Transaction = {
        paymentMethodName: 'MYBANK',
        eCommerceStatus: 'REFUND_ERROR',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'UNCRITMM',
      } as Transaction;

      expect(exportConfigs.mybank_intesa.filter(unicreditTransaction)).toBe(false);
      expect(exportConfigs.mybank_unicredit.filter(unicreditTransaction)).toBe(true);
      expect(exportConfigs.bancomat_pay.filter(unicreditTransaction)).toBe(false);

      const bancomatTransaction: Transaction = {
        gatewayAuthorizationStatus: 'PENDING',
        paymentMethodName: 'BANCOMATPAY',
      } as Transaction;

      expect(exportConfigs.mybank_intesa.filter(bancomatTransaction)).toBe(false);
      expect(exportConfigs.mybank_unicredit.filter(bancomatTransaction)).toBe(false);
      expect(exportConfigs.bancomat_pay.filter(bancomatTransaction)).toBe(true);
    });
  });
});