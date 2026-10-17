import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RefundsTable from "../RefundsTable";
import { RefundCandidate } from "@/app/types/Refund";

const candidates: RefundCandidate[] = [
  { transactionId: "tx-1", refundReason: "Doppio addebito", status: "REQUESTED" },
  { transactionId: "tx-2", refundReason: "Riga uno\nRiga due", status: "ERROR" },
  { transactionId: "tx-3", refundReason: "Già stornata", status: "DONE" },
];

describe("RefundsTable", () => {
  it("should render only transactionId and refund reason", () => {
    render(<RefundsTable candidates={candidates} onStartRefund={jest.fn()} />);

    expect(screen.getByRole("table", { name: /Transazioni da stornare/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Transazione" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Motivo storno" })).toBeInTheDocument();
    expect(screen.getByText("tx-1")).toBeInTheDocument();
    expect(screen.getByText("Doppio addebito")).toBeInTheDocument();
    expect(screen.getByText("Riga uno")).toBeInTheDocument();
    expect(screen.getByText("Riga due")).toBeInTheDocument();
    expect(screen.queryByText(/eCommerceStatus/i)).not.toBeInTheDocument();
  });

  it("should call onStartRefund with the row candidate", async () => {
    const onStartRefund = jest.fn();
    render(<RefundsTable candidates={candidates} onStartRefund={onStartRefund} />);

    await userEvent.click(screen.getByRole("button", { name: "Avvia storno per la transazione tx-1" }));
    await userEvent.click(screen.getByRole("button", { name: "Riprova storno per la transazione tx-2" }));

    expect(onStartRefund).toHaveBeenNthCalledWith(1, candidates[0]);
    expect(onStartRefund).toHaveBeenNthCalledWith(2, candidates[1]);
  });

  it("should show the status and no action for done requests", () => {
    render(<RefundsTable candidates={candidates} onStartRefund={jest.fn()} />);

    expect(screen.getByRole("columnheader", { name: "Stato" })).toBeInTheDocument();
    expect(screen.getByText("Richiesto")).toBeInTheDocument();
    expect(screen.getByText("Errore")).toBeInTheDocument();
    expect(screen.getByText("Fatto")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /transazione tx-3/ })).not.toBeInTheDocument();
    expect(screen.getByText("Nessuna azione")).toBeInTheDocument();
  });

  it("should copy the transactionId", async () => {
    const user = userEvent.setup();
    render(<RefundsTable candidates={candidates} onStartRefund={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "Copia transactionId tx-1" }));

    expect(await navigator.clipboard.readText()).toBe("tx-1");
  });
});
