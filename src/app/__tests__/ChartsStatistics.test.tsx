import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import ChartsStatistics from "../ChartsStatistics";
import { DeadletterAction } from "../types/DeadletterAction";
import { Transaction } from "../types/DeadletterResponse";

jest.mock("recharts", () => {
  const OriginalRecharts = jest.requireActual("recharts");
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: ({ data }: { data: { name: string; value: number }[] }) => (
      <div data-testid="mock-pie" data-data={JSON.stringify(data)} />
    ),
    Cell: () => <div data-testid="mock-cell" />,
    Tooltip: () => <div data-testid="mock-tooltip" />,
    Legend: () => <div data-testid="mock-legend" />,
  };
});

const mockTransactions: Transaction[] = [
  {
    transactionId: "t1",
    eCommerceStatus: "AUTHORIZED",
    gatewayAuthorizationStatus: "EXECUTED",
    paymentMethodName: "GOOGLEPAY",
  } as Transaction,
  {
    transactionId: "t2",
    eCommerceStatus: "AUTHORIZED",
    gatewayAuthorizationStatus: "EXECUTED",
    paymentMethodName: "CARDS",
  } as Transaction,
  {
    transactionId: "t3",
    eCommerceStatus: "REFUND_ERROR",
    gatewayAuthorizationStatus: "DECLINED",
    paymentMethodName: "GOOGLEPAY",
  } as Transaction,
  {
    transactionId: "t4",
    eCommerceStatus: "AUTHORIZED",
    gatewayAuthorizationStatus: "DECLINED",
    paymentMethodName: "CARDS",
  } as Transaction,
];

const mockActionsMap: Map<string, Map<string, DeadletterAction>> = new Map([
  ["t1", new Map([["a1", { action: { type: "FINAL" } } as DeadletterAction]])],
  [
    "t2",
    new Map([["a2", { action: { type: "NOT_FINAL" } } as DeadletterAction]]),
  ],
  [
    "t3",
    new Map([
      ["a3", { action: { type: "FINAL" } } as DeadletterAction],
      ["a4", { action: { type: "NOT_FINAL" } } as DeadletterAction],
    ]),
  ],
  ["t4", new Map()],
]);

// Helper to find a chart by its title and return its mock <Pie>
function getChartPieByTitle(title: string) {
  const titleElement = screen.getByText(title);
  const chartContainer = titleElement.closest("div.MuiPaper-root");
  expect(chartContainer).toBeInTheDocument();

  const mockPie = within(chartContainer as HTMLElement).getByTestId("mock-pie");
  expect(mockPie).toBeInTheDocument();
  return mockPie;
}

function getChartData(pieElement: HTMLElement) {
  const dataString = pieElement.dataset.data;
  return JSON.parse(dataString || "[]");
}

describe("ChartsStatistics", () => {
  beforeEach(() => {
    render(
      <ChartsStatistics
        transactions={mockTransactions}
        actionsMap={mockActionsMap}
      />
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders chart titles correctly", () => {
    expect(screen.getByText("Stato Ecommerce")).toBeInTheDocument();
    expect(screen.getByText("Stato NPG")).toBeInTheDocument();
    expect(
      screen.getByText("Metodi di pagamento")
    ).toBeInTheDocument();
    expect(screen.getByText("Stato azioni")).toBeInTheDocument();
  });

  it("aggregates and pass data to eCommerce chart correctly", () => {
    const pie = getChartPieByTitle("Stato Ecommerce");
    const data = getChartData(pie);


    expect(data).toEqual(
      expect.arrayContaining([
        { name: "AUTHORIZED", value: 3 },
        { name: "REFUND_ERROR", value: 1 },
      ])
    );
    expect(data.length).toBe(2);
  });

  it("aggregates and pass data to NPG chart correctly", () => {
    const pie = getChartPieByTitle("Stato NPG");
    const data = getChartData(pie);

    expect(data).toEqual(
      expect.arrayContaining([
        { name: "EXECUTED", value: 2 },
        { name: "DECLINED", value: 2 },
      ])
    );
    expect(data.length).toBe(2);
  });

  it("aggregates and pass data to payment method chart correctly", () => {
    const pie = getChartPieByTitle("Metodi di pagamento");
    const data = getChartData(pie);

    expect(data).toEqual(
      expect.arrayContaining([
        { name: "GOOGLEPAY", value: 2 },
        { name: "CARDS", value: 2 },
      ])
    );
    expect(data.length).toBe(2);
  });

  it("correctly group and pass data to action types chart", () => {
    const pie = getChartPieByTitle("Stato azioni");
    const data = getChartData(pie);

    expect(data).toEqual(
      expect.arrayContaining([
        { name: "FINALE", value: 2 },
        { name: "NON FINALE", value: 2 },
        { name: "NON ANALIZZATO", value: 1 },
      ])
    );
    expect(data.length).toBe(3);
  });
});
