import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RefundExecution from "../RefundExecution";
import { fetchRefundTransaction, startRefund } from "@/app/utils/api/client";
import { useRefundStatusPolling } from "@/app/hooks/useRefundStatusPolling";
import { deadletterResponse } from "@/app/__tests__/mock/DataMocks";

jest.mock("@/app/utils/api/client", () => ({
  fetchRefundTransaction: jest.fn(),
  startRefund: jest.fn(),
}));

jest.mock("@/app/hooks/useRefundStatusPolling", () => ({
  useRefundStatusPolling: jest.fn(),
}));

const mockedFetchRefundTransaction = fetchRefundTransaction as jest.Mock;
const mockedStartRefund = startRefund as jest.Mock;
const mockedPolling = useRefundStatusPolling as jest.Mock;

const source = deadletterResponse.deadletterTransactions[0];
const detail = {
  transactionId: source.transactionId,
  eCommerceDetails: source.eCommerceDetails,
  npgDetails: source.npgDetails,
  nodoDetails: source.nodoDetails,
};

import { RefundCandidate } from "@/app/types/Refund";

const candidate: RefundCandidate = { transactionId: "t1", refundReason: "Doppio addebito\nSegnalato dal cittadino", status: "REQUESTED" };

const renderExecution = (overrides = {}) => {
  const props = {
    open: true,
    token: "token",
    candidate,
    onClose: jest.fn(),
    onExited: jest.fn(),
    ...overrides,
  };
  render(<RefundExecution {...props} />);
  return props;
};

describe("RefundExecution", () => {
  beforeEach(() => {
    mockedPolling.mockReturnValue({ outcome: "idle", lastStatus: null });
  });

  it("should render a dialog with reason and expanded details", async () => {
    mockedFetchRefundTransaction.mockResolvedValue(detail);

    renderExecution();

    expect(screen.getByRole("dialog", { name: /Storno transazione/ })).toBeInTheDocument();
    expect(screen.getByText("Motivo storno")).toBeInTheDocument();
    expect(screen.getByText(/Segnalato dal cittadino/)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "eCommerce Details" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "NPG Details" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Esegui storno" })).toBeInTheDocument();
    expect(mockedFetchRefundTransaction).toHaveBeenCalledWith("token", "t1");
    expect(mockedPolling).toHaveBeenLastCalledWith("token", "t1", false);
  });

  it("should show an error and hide the refund button when detail fails", async () => {
    mockedFetchRefundTransaction.mockResolvedValue(null);

    renderExecution();

    expect(await screen.findByText("Errore nel caricamento del dettaglio")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Esegui storno" })).not.toBeInTheDocument();
  });

  it("should call onClose with false before the refund starts", async () => {
    mockedFetchRefundTransaction.mockResolvedValue(detail);

    const props = renderExecution();
    await userEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    await userEvent.click(screen.getByRole("button", { name: "Annulla" }));

    expect(props.onClose).toHaveBeenCalledTimes(2);
    expect(props.onClose).toHaveBeenCalledWith(false);
  });

  it("should start the refund with the otp, enable polling and close with true", async () => {
    mockedFetchRefundTransaction.mockResolvedValue(detail);
    mockedStartRefund.mockResolvedValue("started");

    const props = renderExecution();
    await userEvent.click(await screen.findByRole("button", { name: "Esegui storno" }));
    expect(screen.getByText(/121,00/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Codice Authenticator"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Conferma" }));

    expect(mockedStartRefund).toHaveBeenCalledWith("token", "t1", "123456");
    expect(mockedPolling).toHaveBeenLastCalledWith("token", "t1", true);
    expect(screen.queryByRole("button", { name: "Esegui storno" })).not.toBeInTheDocument();

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Conferma storno" })).not.toBeInTheDocument());
    const closeButtons = screen.getAllByRole("button", { name: "Chiudi" });
    await userEvent.click(closeButtons[closeButtons.length - 1]);
    expect(props.onClose).toHaveBeenCalledWith(true);
  });

  it.each([
    ["polling", "Storno avviato, verifica dello stato in corso. Puoi chiudere: lo storno prosegue comunque."],
    ["success", "Storno completato con successo"],
    ["error", "Lo storno non è andato a buon fine"],
    ["timeout", "Esito non ancora disponibile, verificare più tardi"],
  ])("should render the %s outcome with the last status", async (outcome, message) => {
    mockedFetchRefundTransaction.mockResolvedValue(detail);
    mockedPolling.mockReturnValue({ outcome, lastStatus: "ERROR" });

    renderExecution();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByText(/Stato richiesta/)).toBeInTheDocument();
    expect(screen.getAllByText("Errore")).toHaveLength(2);
  });

  it("should offer a retry for requests in error", async () => {
    mockedFetchRefundTransaction.mockResolvedValue(detail);

    renderExecution({ candidate: { ...candidate, status: "ERROR" } });

    expect(await screen.findByRole("button", { name: "Riprova storno" })).toBeInTheDocument();
  });

  it("should not allow a refund for done requests", async () => {
    mockedFetchRefundTransaction.mockResolvedValue(detail);

    renderExecution({ candidate: { ...candidate, status: "DONE" } });

    await screen.findByRole("button", { name: "eCommerce Details" });
    expect(screen.queryByRole("button", { name: /storno$/ })).not.toBeInTheDocument();
  });
});
