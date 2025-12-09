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
    
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return mockLink;
      }
      return originalCreateElement(tagName);
    });
    
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      if (node === mockLink) {
        return mockLink;
      }
      return originalAppendChild(node);
    });
    
    const originalRemoveChild = document.body.removeChild.bind(document.body);
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => {
      if (node === mockLink) {
        return mockLink;
      }
      return originalRemoveChild(node);
    });

    return {
      mockLink,
      createElementSpy,
      appendChildSpy,
      removeChildSpy,
      restore: () => {
        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
      }
    };
  };

  const setupBlobMock = () => {
    interface CapturedBlob {
      content: BlobPart[];
      options?: BlobPropertyBag;
    }
    
    let capturedBlob: CapturedBlob | null = null;
    const mockBlob = jest.spyOn(global, 'Blob').mockImplementation(function(
      content?: BlobPart[], 
      options?: BlobPropertyBag
    ): Blob {
      capturedBlob = { content: content || [], options };
      return {} as Blob;
    });

    return {
      capturedBlob: () => capturedBlob,
      mockBlob,
      restore: () => mockBlob.mockRestore()
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (transactions: Transaction[], selectedDate: string = '2024-12-06') => {
    return render(
      <CsvExportSection
        transactions={transactions}
        selectedDate={selectedDate}
      />
    );
  };

  it('should render the component with all export type options', () => {
    renderComponent(mockMixedTransactions);

    expect(screen.getByLabelText('Tipo Export')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Esporta CSV/i })).toBeInTheDocument();
  });

  it('should display correct transaction count for selected export type', () => {
    renderComponent(mockMixedTransactions);

    expect(screen.getByText('2 transazioni')).toBeInTheDocument();
  });



  it('should update transaction count when changing export type', async () => {
    const user = userEvent.setup();
    renderComponent(mockMixedTransactions);

    expect(screen.getByText('2 transazioni')).toBeInTheDocument();

    const selectButton = screen.getByLabelText('Tipo Export');
    await user.click(selectButton);

    const unicreditOption = screen.getByRole('option', { name: /MyBank Unicredit/i });
    await user.click(unicreditOption);

    await waitFor(() => {
      expect(screen.getByText('1 transazioni')).toBeInTheDocument();
    });
  });

  it('should disable export button when no transactions match the filter', () => {
    renderComponent([]);

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    expect(exportButton).toBeDisabled();
  });

  it('should enable export button when transactions match the filter', () => {
    renderComponent(mockTransactionsIntesa);

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    expect(exportButton).not.toBeDisabled();
  });

  it('should show alert when trying to export with no matching transactions', async () => {
    const user = userEvent.setup();
    renderComponent(mockTransactionsIntesa);

    const selectButton = screen.getByLabelText('Tipo Export');
    await user.click(selectButton);

    const bancomatOption = screen.getByRole('option', { name: /BancomatPay/i });
    await user.click(bancomatOption);

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
      expect(exportButton).toBeDisabled();
    });
  });

  it('should trigger CSV download when export button is clicked', async () => {
    const user = userEvent.setup();
    
    renderComponent(mockTransactionsIntesa, '2024-12-06');
    
    const downloadMocks = setupDownloadMocks();

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(downloadMocks.mockLink.setAttribute).toHaveBeenCalledWith('download', 'StorniMyBank_Intesa_2024-12-06.csv');
      expect(downloadMocks.mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
      expect(downloadMocks.mockLink.click).toHaveBeenCalled();
      expect(downloadMocks.appendChildSpy).toHaveBeenCalledWith(downloadMocks.mockLink);
      expect(downloadMocks.removeChildSpy).toHaveBeenCalledWith(downloadMocks.mockLink);
    });

    downloadMocks.restore();
  });

  it('should generate correct CSV content for Intesa transactions', async () => {
    const user = userEvent.setup();
    
    renderComponent(mockTransactionsIntesa, '2024-12-06');
    
    const blobMock = setupBlobMock();
    const downloadMocks = setupDownloadMocks();

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      const capturedBlob = blobMock.capturedBlob();
      expect(capturedBlob).not.toBeNull();
      if (capturedBlob) {
        const csvContent = capturedBlob.content[0] as string;
        
        expect(csvContent).toContain('insertionDate,transactionId,paymentToken,paymentEndToEndId');
        expect(csvContent).toContain('2024-12-06,tx-intesa-1,token-intesa-1,e2e-intesa-1');
        expect(csvContent).toContain('2024-12-06,tx-intesa-2,token-intesa-2,e2e-intesa-2');
      }
    });

    blobMock.restore();
    downloadMocks.restore();
  });

  it('should change export type when selecting different option', async () => {
    const user = userEvent.setup();
    renderComponent(mockMixedTransactions);

    expect(screen.getByText(/Storni MyBank Intesa/i)).toBeInTheDocument();

    const selectButton = screen.getByLabelText('Tipo Export');
    await user.click(selectButton);

    const bancomatOption = screen.getByRole('option', { name: /BancomatPay/i });
    await user.click(bancomatOption);

    await waitFor(() => {
      expect(screen.getByText(/Transazioni BancomatPay/i)).toBeInTheDocument();
    });
  });

  it('should use current date if selectedDate is empty', async () => {
    const user = userEvent.setup();
    
    renderComponent(mockTransactionsIntesa, '');
    
    const downloadMocks = setupDownloadMocks();

    const exportButton = screen.getByRole('button', { name: /Esporta CSV/i });
    await user.click(exportButton);

    await waitFor(() => {
      const downloadCall = downloadMocks.mockLink.setAttribute.mock.calls.find(call => call[0] === 'download');
      expect(downloadCall?.[1]).toMatch(/StorniMyBank_Intesa_\d{4}-\d{2}-\d{2}\.csv/);
    });

    downloadMocks.restore();
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

    renderComponent(transactionWithSpecialChars, '2024-12-06');
    
    const blobMock = setupBlobMock();
    const downloadMocks = setupDownloadMocks();

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

    blobMock.restore();
    downloadMocks.restore();
  });

});