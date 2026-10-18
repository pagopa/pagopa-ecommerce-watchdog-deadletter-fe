import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompensatingActions from "../CompensatingActions";
import { fetchTransactionEcommerceStatus, requestTransactionRefund } from "@/app/utils/api/client";
import { REFUND_POLLING_INTERVAL_MS, REFUND_POLLING_MAX_CHECKS } from "@/app/hooks/useEcommerceStatusPolling";
import { transactionCheckMock } from "./mock/transactionCheckMock";

jest.mock("@/app/utils/api/client", () => ({
  requestTransactionRefund: jest.fn(),
  fetchTransactionEcommerceStatus: jest.fn(),
}));

const mockedRequestRefund = requestTransactionRefund as jest.Mock;
const mockedFetchStatus = fetchTransactionEcommerceStatus as jest.Mock;

const advance = async (ms: number) => {
  await act(async () => { await jest.advanceTimersByTimeAsync(ms); });
};

const setup = () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const onActionCompleted = jest.fn();
  render(<CompensatingActions token="token" transaction={transactionCheckMock} onActionCompleted={onActionCompleted} />);
  return { user, onActionCompleted };
};

const submitOtp = async (user: ReturnType<typeof userEvent.setup>, buttonName: string) => {
  await user.type(screen.getByLabelText("Codice Authenticator"), "123456");
  await user.click(screen.getByRole("button", { name: buttonName }));
};

describe("CompensatingActions - refund", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("lists the refund action", () => {
    setup();

    expect(screen.getByRole("heading", { name: "Azioni compensative" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Storno" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avvia storno" })).toBeInTheDocument();
  });

  it("shows the transaction summary and validates the otp in the dialog", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Avvia storno" }));

    const dialog = screen.getByRole("dialog", { name: "Conferma storno" });
    expect(dialog).toHaveTextContent(transactionCheckMock.transactionId);
    expect(dialog).toHaveTextContent(/121,00/);
    expect(dialog).toHaveTextContent("NOTIFIED_OK");

    const confirm = screen.getByRole("button", { name: "Avvia storno" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("Codice Authenticator"), "12a345");
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("Codice Authenticator"), "6");
    expect(confirm).toBeEnabled();
  });

  it("keeps the dialog open with an error on invalid otp", async () => {
    mockedRequestRefund.mockResolvedValue({ outcome: "invalidOtp" });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Avvia storno" }));
    await submitOtp(user, "Avvia storno");

    expect(await screen.findByText(/Codice non valido o scaduto/)).toBeInTheDocument();
    expect(screen.getByLabelText("Codice Authenticator")).toHaveValue("");
  });

  it("shows the not refundable message from the backend", async () => {
    mockedRequestRefund.mockResolvedValue({ outcome: "notRefundable", message: "Transaction not in a refundable state" });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Avvia storno" }));
    await submitOtp(user, "Avvia storno");

    expect(await screen.findByText("Transaction not in a refundable state")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Conferma storno" })).toBeInTheDocument();
  });

  it("polls after 201 and completes on REFUNDED", async () => {
    mockedRequestRefund.mockResolvedValue({ outcome: "accepted" });
    mockedFetchStatus.mockResolvedValueOnce("REFUND_REQUESTED").mockResolvedValueOnce("REFUNDED");
    const { user, onActionCompleted } = setup();

    await user.click(screen.getByRole("button", { name: "Avvia storno" }));
    await submitOtp(user, "Avvia storno");

    expect(mockedRequestRefund).toHaveBeenCalledWith("token", transactionCheckMock.transactionId, "123456", false);
    expect(await screen.findByText("Storno preso in carico")).toBeInTheDocument();
    expect(screen.getByText("Verifica dello stato eCommerce in corso.")).toBeInTheDocument();
    expect(screen.getByText("REFUND_REQUESTED")).toBeInTheDocument();

    await advance(REFUND_POLLING_INTERVAL_MS);

    expect(await screen.findByText("Storno completato")).toBeInTheDocument();
    expect(onActionCompleted).toHaveBeenCalledTimes(1);
  });

  it("opens the force dialog on REFUND_ERROR and completes with force", async () => {
    mockedRequestRefund
      .mockResolvedValueOnce({ outcome: "accepted" })
      .mockResolvedValueOnce({ outcome: "completed" });
    mockedFetchStatus.mockResolvedValueOnce("REFUND_ERROR");
    const { user, onActionCompleted } = setup();

    await user.click(screen.getByRole("button", { name: "Avvia storno" }));
    await submitOtp(user, "Avvia storno");

    const forceDialog = await screen.findByRole("dialog", { name: "Forza storno" });
    expect(forceDialog).toHaveTextContent("REFUND_ERROR");
    await submitOtp(user, "Forza storno");

    expect(mockedRequestRefund).toHaveBeenLastCalledWith("token", transactionCheckMock.transactionId, "123456", true);
    expect(await screen.findByText("Storno forzato completato")).toBeInTheDocument();
    expect(onActionCompleted).toHaveBeenCalledTimes(1);
  });

  it("asks to force after the polling timeout and shows the gateway error", async () => {
    mockedRequestRefund
      .mockResolvedValueOnce({ outcome: "accepted" })
      .mockResolvedValueOnce({ outcome: "gatewayError", message: "PSP refused" });
    mockedFetchStatus.mockResolvedValue("REFUND_REQUESTED");
    const { user, onActionCompleted } = setup();

    await user.click(screen.getByRole("button", { name: "Avvia storno" }));
    await submitOtp(user, "Avvia storno");
    await advance(REFUND_POLLING_INTERVAL_MS * (REFUND_POLLING_MAX_CHECKS - 1));

    expect(mockedFetchStatus).toHaveBeenCalledTimes(REFUND_POLLING_MAX_CHECKS);
    await screen.findByRole("dialog", { name: "Forza storno" });
    await submitOtp(user, "Forza storno");

    expect(await screen.findByText("Il gateway ha rifiutato lo storno")).toBeInTheDocument();
    expect(screen.getByText("PSP refused")).toBeInTheDocument();
    expect(onActionCompleted).not.toHaveBeenCalled();
  });

  it("lets the operator force later after closing the force dialog", async () => {
    mockedRequestRefund.mockResolvedValueOnce({ outcome: "accepted" });
    mockedFetchStatus.mockResolvedValueOnce("REFUND_ERROR");
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Avvia storno" }));
    await submitOtp(user, "Avvia storno");
    await screen.findByRole("dialog", { name: "Forza storno" });
    await user.click(screen.getByRole("button", { name: "Annulla" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Storno non confermato")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Forza storno" }));
    expect(await screen.findByRole("dialog", { name: "Forza storno" })).toBeInTheDocument();
  });
});
