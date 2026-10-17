import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RefundsPage from "../page";
import { fetchRefundCandidates } from "../../utils/api/client";
import { navigateTo } from "../../utils/utils";

jest.mock("../../utils/api/client", () => ({
  fetchRefundCandidates: jest.fn(),
}));

jest.mock("../../utils/utils", () => ({
  ...jest.requireActual("../../utils/utils"),
  navigateTo: jest.fn(),
}));

jest.mock("../../components/refunds/RefundExecution", () => ({
  __esModule: true,
  default: ({ open, candidate, onClose, onExited }: {
    open: boolean;
    candidate: { transactionId: string };
    onClose: (refundStarted: boolean) => void;
    onExited: () => void;
  }) => (
    <div>
      <span>execution-{candidate.transactionId}-{open ? "open" : "closed"}</span>
      <button onClick={() => onClose(true)}>mock-close-started</button>
      <button onClick={() => onClose(false)}>mock-close</button>
      <button onClick={onExited}>mock-exited</button>
    </div>
  ),
}));

const mockedFetchRefundCandidates = fetchRefundCandidates as jest.Mock;

const login = () => {
  sessionStorage.setItem("authToken", "token");
  sessionStorage.setItem("jwtUser", JSON.stringify({ id: "u1", name: "Mario", surname: "Rossi", email: "m@r.it" }));
};

describe("RefundsPage", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("should ask to login when there is no token", async () => {
    render(<RefundsPage />);

    expect(await screen.findByText("Effettua prima il login")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Vai alla home" }));
    expect(navigateTo).toHaveBeenCalled();
    expect(mockedFetchRefundCandidates).not.toHaveBeenCalled();
  });

  it("should show the candidates list", async () => {
    login();
    mockedFetchRefundCandidates.mockResolvedValue([{ transactionId: "tx-1", refundReason: "Doppio addebito" }]);

    render(<RefundsPage />);

    expect(await screen.findByText("tx-1")).toBeInTheDocument();
    expect(mockedFetchRefundCandidates).toHaveBeenCalledWith("token", ["REQUESTED", "ERROR"]);
  });

  it("should reload with the selected status filter", async () => {
    login();
    mockedFetchRefundCandidates.mockResolvedValue([{ transactionId: "tx-1", refundReason: "Doppio addebito", status: "REQUESTED" }]);

    render(<RefundsPage />);
    await screen.findByText("tx-1");

    const filter = screen.getByRole("group", { name: "Filtra per stato" });
    expect(within(filter).getByRole("button", { name: "Richiesto" })).toHaveAttribute("aria-pressed", "true");
    expect(within(filter).getByRole("button", { name: "Fatto" })).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(within(filter).getByRole("button", { name: "Fatto" }));

    await waitFor(() =>
      expect(mockedFetchRefundCandidates).toHaveBeenLastCalledWith("token", ["REQUESTED", "ERROR", "DONE"])
    );
  });

  it("should not allow deselecting every status", async () => {
    login();
    mockedFetchRefundCandidates.mockResolvedValue([]);

    render(<RefundsPage />);
    await screen.findByText("Nessuna richiesta di storno");
    const filter = screen.getByRole("group", { name: "Filtra per stato" });

    await userEvent.click(within(filter).getByRole("button", { name: "Richiesto" }));
    await userEvent.click(within(filter).getByRole("button", { name: "Errore" }));

    expect(within(filter).getByRole("button", { name: "Errore" })).toHaveAttribute("aria-pressed", "true");
  });

  it("should show the empty message", async () => {
    login();
    mockedFetchRefundCandidates.mockResolvedValue([]);

    render(<RefundsPage />);

    expect(await screen.findByText("Nessuna richiesta di storno")).toBeInTheDocument();
  });

  it("should show an error and retry", async () => {
    login();
    mockedFetchRefundCandidates
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([{ transactionId: "tx-1", refundReason: "Doppio addebito" }]);

    render(<RefundsPage />);

    expect(await screen.findByText("Errore nel caricamento della lista storni")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Riprova" }));
    expect(await screen.findByText("tx-1")).toBeInTheDocument();
  });

  it("should open the refund dialog over the list", async () => {
    login();
    mockedFetchRefundCandidates.mockResolvedValue([{ transactionId: "tx-1", refundReason: "Doppio addebito" }]);

    render(<RefundsPage />);
    await userEvent.click(await screen.findByRole("button", { name: /Avvia storno/ }));

    expect(screen.getByText("execution-tx-1-open")).toBeInTheDocument();
    expect(screen.getByText("Doppio addebito")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "mock-close" }));
    expect(screen.getByText("execution-tx-1-closed")).toBeInTheDocument();
    expect(mockedFetchRefundCandidates).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "mock-exited" }));
    expect(screen.queryByText(/execution-tx-1/)).not.toBeInTheDocument();
  });

  it("should reload the list after a started refund", async () => {
    login();
    mockedFetchRefundCandidates.mockResolvedValue([{ transactionId: "tx-1", refundReason: "Doppio addebito" }]);

    render(<RefundsPage />);
    await userEvent.click(await screen.findByRole("button", { name: /Avvia storno/ }));
    await userEvent.click(screen.getByRole("button", { name: "mock-close-started" }));

    await waitFor(() => expect(mockedFetchRefundCandidates).toHaveBeenCalledTimes(2));
    expect(screen.getByText("tx-1")).toBeInTheDocument();
  });

  it("should reload the list on Aggiorna", async () => {
    login();
    mockedFetchRefundCandidates.mockResolvedValue([{ transactionId: "tx-1", refundReason: "Doppio addebito" }]);

    render(<RefundsPage />);
    await screen.findByText("tx-1");
    await userEvent.click(screen.getByRole("button", { name: "Aggiorna" }));

    expect(await screen.findByText("tx-1")).toBeInTheDocument();
    expect(mockedFetchRefundCandidates).toHaveBeenCalledTimes(2);
  });
});
