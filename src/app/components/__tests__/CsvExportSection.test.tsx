import { render, screen, waitFor } from '@testing-library/react';
import CsvExportSection from "../CsvExportSection";
import { Transaction } from '../../types/DeadletterResponse';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

global.alert = jest.fn();

global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('CsvExportSection', () => {

  const mockTransactionsIntesa: Transaction[] = [
    {
      transactionId: 'tx-intesa-1',
      insertionDate: '2024-12-06T10:00:00Z',
      paymentToken: 'token-intesa-1',
      paymentEndToEndId: 'e2e-intesa-1',
      paymentMethodName: 'MYBANK',
      eCommerceStatus: 'REFUND_ERROR',
      gatewayAuthorizationStatus: 'EXECUTED',
      pspId: 'BCITITMM',
    } as Transaction,
    {
      transactionId: 'tx-intesa-2',
      insertionDate: '2024-12-06T11:00:00Z',
      paymentToken: 'token-intesa-2',
      paymentEndToEndId: 'e2e-intesa-2',
      paymentMethodName: 'MYBANK',
      eCommerceStatus: 'REFUND_ERROR',
      gatewayAuthorizationStatus: 'EXECUTED',
      pspId: 'BCITITMM',
    } as Transaction,
  ];

  const mockTransactionsUnicredit: Transaction[] = [
    {
      transactionId: 'tx-unicredit-1',
      insertionDate: '2024-12-06T12:00:00Z',
      paymentToken: 'token-unicredit-1',
      paymentEndToEndId: 'e2e-unicredit-1',
      paymentMethodName: 'MYBANK',
      eCommerceStatus: 'REFUND_ERROR',
      gatewayAuthorizationStatus: 'EXECUTED',
      pspId: 'UNCRITMM',
    } as Transaction,
  ];

  const mockTransactionsBancomatPay: Transaction[] = [
    {
      transactionId: 'tx-bancomat-1',
      insertionDate: '2024-12-06T13:00:00Z',
      paymentToken: 'token-bancomat-1',
      gatewayAuthorizationStatus: 'PENDING',
      paymentMethodName: 'BANCOMATPAY',
    } as Transaction,
  ];

  const mockMixedTransactions: Transaction[] = [
    ...mockTransactionsIntesa,
    ...mockTransactionsUnicredit,
    ...mockTransactionsBancomatPay,
  ];

  const setupDownloadMocks = () => {
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLAnchorElement & { setAttribute: jest.Mock; click: jest.Mock };

    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return mockLink;
      }
      return Document.prototype.createElement.call(document, tagName);
    });

    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      if (node === mockLink) {
        return mockLink;
      }
      return Node.prototype.appendChild.call(document.body, node);
    });

    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => {
      if (node === mockLink) {
        return mockLink;
      }
      return Node.prototype.removeChild.call(document.body, node);
    });

    return {
      mockLink,
      createElementSpy,
      appendChildSpy,
      removeChildSpy,
    };
  };

  const setupBlobMock = () => {
    interface CapturedBlob {
      content: BlobPart[];
      options?: BlobPropertyBag;
    }

    let capturedBlob: CapturedBlob | null = null;
    const mockBlob = jest.spyOn(global, 'Blob').mockImplementation(function (
      content?: BlobPart[],
      options?: BlobPropertyBag
    ): Blob {
      capturedBlob = { content: content || [], options };
      return {} as Blob;
    });

    return {
      capturedBlob: () => capturedBlob,
      mockBlob,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = (
    transactions: Transaction[],
    startDate: string = '2024-12-06',
    endDate: string = '2024-12-06',
    onFetchAllForExport?: () => Promise<Transaction[]>
  ) => {
    return render(
      <CsvExportSection
        transactions={transactions}
        startDate={startDate}
        endDate={endDate}
        onFetchAllForExport={onFetchAllForExport}
      />
    );
  };

  it('should render the component with all export type options', () => {
    renderComponent(mockMixedTransactions);

    expect(screen.getByRole('heading', { name: /Esporta CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Esporta CSV/i })).toBeInTheDocument();
  });

  it('should allow changing export type', async () => {
    const user = userEvent.setup();
    renderComponent(mockMixedTransactions);

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const unicreditOption = screen.getByRole('option', { name: /MyBank Unicredit/i });
    await user.click(unicreditOption);

    expect(screen.getByText(/Storni MyBank Unicredit/i)).toBeInTheDocument();
  });

  it('should disable export button when no transactions are provided initially', () => {
    renderComponent([]);

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    expect(exportButton).toBeDisabled();
  });

  it('should enable export button when transactions are provided initially', () => {
    renderComponent(mockTransactionsIntesa);

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    expect(exportButton).not.toBeDisabled();
  });

  it('should show alert when trying to export with no matching transactions for the filter', async () => {
    const user = userEvent.setup();
    renderComponent(mockTransactionsIntesa); // Only has Intesa

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const bancomatOption = screen.getByRole('option', { name: /BancomatPay/i });
    await user.click(bancomatOption);

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled();
    });
  });

  it('should trigger CSV download when export button is clicked', async () => {
    const user = userEvent.setup();

    renderComponent(mockTransactionsIntesa, '2024-12-06', '2024-12-06');

    const downloadMocks = setupDownloadMocks();

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(downloadMocks.mockLink.setAttribute).toHaveBeenCalledWith('download', 'StorniMyBank_Intesa_2024-12-06_2024-12-06.csv');
      expect(downloadMocks.mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
      expect(downloadMocks.mockLink.click).toHaveBeenCalled();
    });
  });

  it('should generate correct CSV content for Intesa transactions', async () => {
    const user = userEvent.setup();

    renderComponent(mockTransactionsIntesa, '2024-12-06', '2024-12-06');

    const blobMock = setupBlobMock();
    setupDownloadMocks();

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      const capturedBlob = blobMock.capturedBlob();
      expect(capturedBlob).not.toBeNull();
      if (capturedBlob) {
        const csvContent = capturedBlob.content[0] as string;

        expect(csvContent).toContain('insertionDate,transactionId,paymentToken,paymentEndToEndId');
        expect(csvContent).toContain('2024-12-06,tx-intesa-1,token-intesa-1,e2e-intesa-1');
      }
    });

    blobMock.mockBlob.mockRestore();
  });

  it('should call onFetchAllForExport if provided', async () => {
    const user = userEvent.setup();
    const mockOnFetchAll = jest.fn().mockResolvedValue(mockTransactionsIntesa);

    renderComponent(mockTransactionsIntesa, '2024-12-06', '2024-12-06', mockOnFetchAll);

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockOnFetchAll).toHaveBeenCalled();
    });
  });

  it('should show alert and stop loading if onFetchAllForExport fails', async () => {
    const user = userEvent.setup();
    const mockOnFetchAll = jest.fn().mockRejectedValue(new Error('Fetch failed'));

    renderComponent(mockTransactionsIntesa, '2024-12-06', '2024-12-06', mockOnFetchAll);

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Errore durante il recupero dei dati per l'export.");
    });
  });

  it('should escape CSV values containing special characters', async () => {
    const user = userEvent.setup();

    const transactionWithSpecialChars: Transaction[] = [
      {
        transactionId: 'tx,with,commas',
        insertionDate: '2024-12-06T10:00:00Z',
        paymentToken: 'token"with"quotes',
        paymentEndToEndId: 'e2e\nwith\nnewlines',
        paymentMethodName: 'MYBANK',
        eCommerceStatus: 'REFUND_ERROR',
        gatewayAuthorizationStatus: 'EXECUTED',
        pspId: 'BCITITMM',
      } as Transaction,
    ];

    renderComponent(transactionWithSpecialChars, '2024-12-06', '2024-12-06');

    const blobMock = setupBlobMock();
    setupDownloadMocks();

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      const capturedBlob = blobMock.capturedBlob();
      expect(capturedBlob).not.toBeNull();
      if (capturedBlob) {
        const csvContent = capturedBlob.content[0] as string;

        expect(csvContent).toContain('"tx,with,commas"');
        expect(csvContent).toContain('"token""with""quotes"');
        expect(csvContent).toContain('"e2e\nwith\nnewlines"');
      }
    });

    blobMock.mockBlob.mockRestore();
  });

});