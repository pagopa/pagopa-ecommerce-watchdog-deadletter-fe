import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { TransactionsTable } from "../TransactionsTable";
import userEvent from "@testing-library/user-event";
import { ActionType, DeadletterAction } from "../../types/DeadletterAction";
import { Transaction } from "../../types/DeadletterResponse";

jest.mock("@/app/utils/types/DeadletterActionUtils", () => ({
  getDeadletterActionAsString: jest.fn(
    (action: DeadletterAction) => action.action.value
  ),
}));

const mockHandleOpenDialog = jest.fn();
const mockHandleAddActionToTransaction = jest.fn();

const finalAction: ActionType = {
  value: "Stornata",
  type: "FINAL",
};

const notFinalAction: ActionType = {
  value: "Da stornare",
  type: "NOT_FINAL",
};

const mockActionTypes: ActionType[] = [finalAction, notFinalAction];

const mockAction1: DeadletterAction = {
  id: "e7cbf442-4f3f-4d91-bb6e-3c1fabc3a42e",
  deadletterTransactionId: "505db4c0c7be4f4582868fd0780359f4",
  userId: "luigi.verdi",
  action: finalAction,
  timestamp: "2025-08-10T08:20:00Z",
};

const mockAction2: DeadletterAction = {
  id: "e7cbf442-4f3f-4d91-bb6e-3c1fabc3a42f",
  deadletterTransactionId: "505db4c0c7be4f4582868fd0780359f4",
  userId: "luigi.verdi",
  action: notFinalAction,
  timestamp: "2025-08-10T08:20:00Z",
};

const mockActionsMap = new Map([
  [
    "505db4c0c7be4f4582868fd0780359f4",
    new Map([
      ["Stornata", mockAction1],
      ["Da stornare", mockAction2],
    ]),
  ],
  ["429a7b69689c4e6197f4d4fd412ae355", new Map()],
]);

const mockTransactions: Transaction[] = [
  {
    transactionId: "505db4c0c7be4f4582868fd0780359f4",
    insertionDate: "2025-07-02T16:53:08.537435644Z",
    paymentToken: "6a9f3de24ede4f2f8a0177b49b74ca3d",
    paymentMethodName: "CARDS",
    pspId: "UNCRITMM",
    eCommerceStatus: "NOTIFIED_OK",
    gatewayAuthorizationStatus: "EXECUTED",
    paymentEndToEndId: "113147082357551839",
    operationId: "123147082357551839",
    deadletterTransactionDetails: {
      queueName: "pagopa-u-weu-ecommerce-transactions-dead-letter-queue",
      data: '{"event":{"_class":"it.pagopa.ecommerce.commons.documents.v2.TransactionActivatedEvent","id":"5e1628cb-d053-4254-9b85-56a84c14cd18","transactionId":"505db4c0c7be4f4582868fd0780359f4","creationDate":"2025-07-02T15:47:25.391751245Z[Etc/UTC]","data":{"email":{"data":"dd42eedf-3981-43b8-8e36-cfe2154b8edb"},"paymentNotices":[{"paymentToken":"6a9f3de24ede4f2f8a0177b49b74ca3d","rptId":"77777777777302011111111111490","description":"TARI/TEFA 2021","amount":12000,"paymentContextCode":null,"transferList":[{"paFiscalCode":"77777777777","digitalStamp":false,"transferAmount":10000,"transferCategory":"0101101IM"},{"paFiscalCode":"77777777777","digitalStamp":false,"transferAmount":2000,"transferCategory":"0201102IM"}],"companyName":"company PA","creditorReferenceId":"02011111111111490","allCCP":false}],"faultCode":null,"faultCodeString":null,"clientId":"CHECKOUT","idCart":null,"paymentTokenValiditySeconds":900,"transactionGatewayActivationData":{"type":"NPG","orderId":"E1751471219206bfxL","correlationId":"d6adc54d-e979-4979-bddf-2ad1d384d57e"},"userId":null},"eventCode":"TRANSACTION_ACTIVATED_EVENT"},"tracingInfo":{"traceparent":"00-d54ca1a36c5f421146eca78394e66553-bf6a4fb1bd6d2427-01","tracestate":null,"baggage":null}}',
      timestamp: "2025-07-02T16:53:08.537435644Z",
      transactionInfo: {
        transactionId: "505db4c0c7be4f4582868fd0780359f4",
        authorizationRequestId: "E1751471219206bfxL",
        eCommerceStatus: "EXPIRED",
        paymentGateway: "NPG",
        paymentTokens: ["6a9f3de24ede4f2f8a0177b49b74ca3d"],
        pspId: "UNCRITMM",
        paymentMethodName: "CARDS",
        grandTotal: 12120,
        rrn: "251839055936",
        details: {
          type: "NPG",
          operationResult: "EXECUTED",
          operationId: "123147082357551839",
          correlationId: "d6adc54d-e979-4979-bddf-2ad1d384d57e",
          paymentEndToEndId: "113147082357551839",
          outcome: null,
        },
      },
    },
    eCommerceDetails: {
      userInfo: {
        userFiscalCode: null,
        notificationEmail: "test@test.it",
        surname: null,
        name: null,
        username: null,
        authenticationType: "GUEST",
      },
      transactionInfo: {
        creationDate: "2025-07-02T15:47:25.391751245Z",
        status: "Confermato",
        statusDetails: null,
        eventStatus: "NOTIFIED_OK",
        amount: 12000,
        fee: 120,
        grandTotal: 12120,
        rrn: "251839055936",
        authorizationCode: "944565",
        authorizationOperationId: "113147082357551839",
        refundOperationId: null,
        paymentMethodName: "CARDS",
        brand: "VISA",
        authorizationRequestId: "E1751471219206bfxL",
        paymentGateway: "NPG",
        correlationId: "d6adc54d-e979-4979-bddf-2ad1d384d57e",
        gatewayAuthorizationStatus: "EXECUTED",
        gatewayErrorCode: "000",
      },
      paymentInfo: {
        origin: "CHECKOUT",
        idTransaction: "505db4c0c7be4f4582868fd0780359f4",
        details: [
          {
            subject: "TARI/TEFA 2021",
            iuv: null,
            rptId: "77777777777302011111111111490",
            amount: 12000,
            paymentToken: "6a9f3de24ede4f2f8a0177b49b74ca3d",
            creditorInstitution: "company PA",
            paFiscalCode: "77777777777",
          },
        ],
      },
      pspInfo: {
        pspId: "UNCRITMM",
        businessName: "UN spa",
        idChannel: "00348170101_01",
      },
      product: "ECOMMERCE",
    },
    nodoDetails: {
      dateFrom: "2025-07-02",
      dateTo: "2025-07-02",
      data: [],
    },
    npgDetails: {
      operations: [
        {
          additionalData: {
            authorizationCode: "944565",
            rrn: "251839055936",
          },
          operationAmount: "12120",
          operationCurrency: "EUR",
          operationId: "113147082357551839",
          operationResult: "EXECUTED",
          operationTime: "2025-07-02 17:48:05.513",
          operationType: "AUTHORIZATION",
          orderId: "E1751471219206bfxL",
          paymentCircuit: "VISA",
          paymentEndToEndId: "113147082357551839",
          paymentMethod: "CARD",
        },
      ],
    },
  },
  {
    transactionId: "429a7b69689c4e6197f4d4fd412ae355",
    insertionDate: "",
    paymentToken: "2330a6e6748b441887bff9cc5579661b",
    paymentMethodName: "GOOGLEPAY",
    pspId: "CIPBITMM",
    eCommerceStatus: "EXPIRED",
    gatewayAuthorizationStatus: "DECLINED",
    paymentEndToEndId: null,
    operationId: "533935788069251839",
    deadletterTransactionDetails: {
      queueName: "pagopa-u-weu-ecommerce-transactions-dead-letter-queue",
      data: '{"event":{"_class":"it.pagopa.ecommerce.commons.documents.v2.TransactionClosureRetriedEvent","id":"125f0f7f-36c8-498d-83f0-5a42c8789578","transactionId":"429a7b69689c4e6197f4d4fd412ae355","creationDate":"2025-07-02T16:15:47.001255386Z[Etc/UTC]","data":{"retryCount":3,"closureErrorData":{"httpErrorCode":null,"errorDescription":null,"errorType":"COMMUNICATION_ERROR"}},"eventCode":"TRANSACTION_CLOSURE_RETRIED_EVENT"},"tracingInfo":{"traceparent":"00-0000000000000000239720c5e018c23b-c035bf48c9c67f7a-01","tracestate":"in=239720c5e018c23b;aef72f672a4213b1","baggage":null}}',
      timestamp: "2025-07-02T16:17:17.897798317Z",
      transactionInfo: {
        transactionId: "429a7b69689c4e6197f4d4fd412ae355",
        authorizationRequestId: "E1751472776298hZFO",
        eCommerceStatus: "CLOSURE_ERROR",
        paymentGateway: "NPG",
        paymentTokens: ["2330a6e6748b441887bff9cc5579661b"],
        pspId: "CIPBITMM",
        paymentMethodName: "GOOGLEPAY",
        grandTotal: 12100,
        rrn: "518311895334",
        details: {
          type: "NPG",
          operationResult: "DECLINED",
          operationId: "533935788069251839",
          correlationId: "e8695c15-d5b6-458f-ad0d-ecd9ff62ae9d",
          paymentEndToEndId: null,
          outcome: null,
        },
      },
    },
    eCommerceDetails: null,
    nodoDetails: null,
    npgDetails: null,
  },
];

const defaultProps = {
  transactions: mockTransactions,
  actionsMap: mockActionsMap,
  actions: mockActionTypes,
  handleOpenDialog: mockHandleOpenDialog,
  handleAddActionToTransaction: mockHandleAddActionToTransaction,
};

const renderComponent = (props = {}) => {
  return render(<TransactionsTable {...defaultProps} {...props} />);
};

describe("TransactionsTable", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders table correctly", () => {
    renderComponent();

    // Check column headers
    expect(screen.getByText("transactionId")).toBeInTheDocument();
    expect(screen.getByText("insertionDate (UTC)")).toBeInTheDocument();
    expect(screen.getByText("paymentToken")).toBeInTheDocument();
    expect(screen.getByText("paymentEndToEndId")).toBeInTheDocument();
    expect(screen.getByText("authorizationRequestId")).toBeInTheDocument();
    expect(screen.getByText("methodName")).toBeInTheDocument();
    expect(screen.getByText("pspId")).toBeInTheDocument();
    expect(screen.getByText("statoEcommerce")).toBeInTheDocument();
    expect(screen.getByText("gatewayStatus")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Azioni")).toBeInTheDocument();

    //Check transaction row
    expect(
      screen.getByText(mockTransactions[0].transactionId)
    ).toBeInTheDocument();
    expect(
      screen.getByText(mockTransactions[0].paymentToken)
    ).toBeInTheDocument();
    expect(
      screen.getByText(mockTransactions[0].paymentEndToEndId!)
    ).toBeInTheDocument();
    expect(
      screen.getByText(mockTransactions[0].paymentMethodName)
    ).toBeInTheDocument();
    expect(screen.getByText(mockTransactions[0].pspId)).toBeInTheDocument();
    expect(
      screen.getByText(mockTransactions[0].eCommerceStatus)
    ).toBeInTheDocument();
    expect(
      screen.getByText(mockTransactions[0].gatewayAuthorizationStatus!)
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "View" })).toHaveLength(1); // nodoDetails, npgDetails, eCommerceDetails
    expect(screen.getByText(mockAction1.action.value)).toBeInTheDocument();
    expect(screen.getByText(mockAction2.action.value)).toBeInTheDocument();
  });

  it('renders "N/A" for Detail cell with no data', () => {
    renderComponent();

    const row2 = screen
      .getByText(mockTransactions[1].transactionId)
      .closest('div[role="row"]');

    expect(row2).toBeInTheDocument();
    expect(within(row2 as HTMLElement).getAllByText("N/A")).toHaveLength(2);
  });

  it('renders "View" button for Detail cell with data and calls handleOpenDialog on click', async () => {
    const combinedDetails = {
      nodoDetails: mockTransactions[0].nodoDetails,
      npgDetails: mockTransactions[0].npgDetails,
      eCommerceDetails: mockTransactions[0].eCommerceDetails,
    };

    const user = userEvent.setup();
    renderComponent();

    const row1 = screen
      .getByText(mockTransactions[0].transactionId)
      .closest('div[role="row"]');
    expect(row1).toBeInTheDocument();

    const detailsViewButton = within(row1 as HTMLElement).getAllByRole(
      "button",
      { name: "View" }
    );
    expect(detailsViewButton).toHaveLength(1);

    //Click on Details "View" button
    await user.click(detailsViewButton[0]);
    expect(mockHandleOpenDialog).toHaveBeenCalledWith(combinedDetails);

    expect(mockHandleOpenDialog).toHaveBeenCalledTimes(1);
  });

  it("renders existing action chips for a transaction", () => {
    renderComponent();

    const row1 = screen
      .getByText(mockTransactions[0].transactionId)
      .closest('div[role="row"]');
    expect(row1).toBeInTheDocument();

    const action1Div = within(row1 as HTMLElement)
      .getByText(mockAction1.action.value)
      .closest("div");
    const action2Div = within(row1 as HTMLElement)
      .getByText(mockAction2.action.value)
      .closest("div");
    expect(action1Div).toBeInTheDocument();
    expect(action2Div).toBeInTheDocument();

    // Check chip colors
    expect(action1Div).toHaveClass("MuiChip-colorSuccess");
    expect(action2Div).toHaveClass("MuiChip-colorPrimary");
  });

  it("does not render action chips when none exist", () => {
    renderComponent();

    const row2 = screen
      .getByText(mockTransactions[1].transactionId)
      .closest('div[role="row"]');
    expect(row2).toBeInTheDocument();

    expect(
      within(row2 as HTMLElement).queryByText(finalAction.value)
    ).not.toBeInTheDocument();
    expect(
      within(row2 as HTMLElement).queryByText(notFinalAction.value)
    ).not.toBeInTheDocument();

    expect(
      within(row2 as HTMLElement).getByText("➕ Aggiungi azione")
    ).toBeInTheDocument();
  });

  it("calls handleAddActionToTransaction when a new action is selected", async () => {
    const user = userEvent.setup();
    renderComponent();

    const row1 = screen
      .getByText(mockTransactions[0].transactionId)
      .closest('div[role="row"]');
    expect(row1).toBeInTheDocument();

    const addActionButton = within(row1 as HTMLElement).getByText(
      "➕ Aggiungi azione"
    );
    await user.click(addActionButton);

    const actionMenuItem = screen.getByRole("option", {
      name: finalAction.value,
    });
    await user.click(actionMenuItem);

    expect(mockHandleAddActionToTransaction).toHaveBeenCalledTimes(1);
    expect(mockHandleAddActionToTransaction).toHaveBeenCalledWith(
      finalAction.value,
      mockTransactions[0].transactionId
    );
  });
});
