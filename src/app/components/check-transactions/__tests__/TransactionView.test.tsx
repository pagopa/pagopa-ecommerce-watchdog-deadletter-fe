import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionSearch from "../TransactionSearch";
import TransactionOverview from "../TransactionOverview";
import TransactionEventsTimeline from "../TransactionEventsTimeline";
import { transactionCheckMock } from "./mock/transactionCheckMock";

const VALID_ID = "6460dc3e61ba4ed6bfea2c4468b2862c";

describe("TransactionSearch", () => {
  it("submits a normalized valid id", async () => {
    const onSearch = jest.fn();
    render(<TransactionSearch initialValue="" loading={false} onSearch={onSearch} />);

    await userEvent.type(screen.getByLabelText("Transaction ID"), ` ${VALID_ID.slice(0, 10)} ${VALID_ID.slice(10)}{Enter}`);

    expect(onSearch).toHaveBeenCalledWith(VALID_ID);
  });

  it("shows validation errors and does not submit", async () => {
    const onSearch = jest.fn();
    render(<TransactionSearch initialValue="" loading={false} onSearch={onSearch} />);

    await userEvent.click(screen.getByRole("button", { name: "Cerca" }));
    expect(screen.getByText("Inserisci un transaction ID")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Transaction ID"), "abc");
    await userEvent.click(screen.getByRole("button", { name: "Cerca" }));
    expect(screen.getByText(/32 caratteri esadecimali$/)).toBeInTheDocument();
    expect(screen.getByLabelText("Transaction ID")).toHaveAttribute("aria-invalid", "true");
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("is exposed as a search landmark", () => {
    render(<TransactionSearch initialValue={VALID_ID} loading={false} onSearch={jest.fn()} />);

    expect(screen.getByRole("search", { name: "Cerca transazione" })).toBeInTheDocument();
    expect(screen.getByLabelText("Transaction ID")).toHaveValue(VALID_ID);
  });
});

describe("TransactionOverview", () => {
  it("shows key facts and the three statuses", () => {
    render(<TransactionOverview transaction={transactionCheckMock} />);

    expect(screen.getByRole("heading", { name: "Transazione" })).toBeInTheDocument();
    expect(screen.getByText(transactionCheckMock.transactionId)).toBeInTheDocument();
    expect(screen.getByText(/121,00/)).toBeInTheDocument();
    expect(screen.getByText("NX PAYMENTS S.P.A.")).toBeInTheDocument();
    expect(screen.getByText("eCommerce")).toBeInTheDocument();
    expect(screen.getByText("NOTIFIED_OK")).toBeInTheDocument();
    expect(screen.getByText("Nodo")).toBeInTheDocument();
    expect(screen.getByText("NOTIFIED")).toBeInTheDocument();
    expect(screen.getByText("Gateway")).toBeInTheDocument();
    expect(screen.getByText("Non disponibile")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copia transaction ID" })).toBeInTheDocument();
  });
});

describe("TransactionEventsTimeline", () => {
  it("lists events oldest first with their original codes", () => {
    render(<TransactionEventsTimeline events={transactionCheckMock.events} />);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("TRANSACTION_ACTIVATED_EVENT")).toBeInTheDocument();
    expect(within(items[1]).getByText("TRANSACTION_AUTHORIZATION_REQUESTED_EVENT")).toBeInTheDocument();
    expect(within(items[0]).getByText(/2025/)).toHaveAttribute("datetime", "2025-07-02T16:07:24.467Z");
  });

  it("shows an empty state", () => {
    render(<TransactionEventsTimeline events={[]} />);

    expect(screen.getByText("Nessun evento disponibile.")).toBeInTheDocument();
  });
});
