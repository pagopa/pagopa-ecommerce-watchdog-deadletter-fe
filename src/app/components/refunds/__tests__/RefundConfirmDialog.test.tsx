import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RefundConfirmDialog, { formatAmount } from "../RefundConfirmDialog";
import { RefundStartResult } from "@/app/types/Refund";

const renderDialog = (onConfirm: (otp: string) => Promise<RefundStartResult>, overrides = {}) => {
  const props = {
    open: true,
    transactionId: "tx-1",
    amountCents: 12100,
    onConfirm,
    onStarted: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  render(<RefundConfirmDialog {...props} />);
  return props;
};

const otpInput = () => screen.getByLabelText("Codice Authenticator");
const confirmButton = () => screen.getByRole("button", { name: "Conferma" });

describe("formatAmount", () => {
  it("should format euro cents", () => {
    expect(formatAmount(12100)).toMatch(/121,00\s€/);
  });

  it("should return n/d when amount is missing", () => {
    expect(formatAmount(null)).toBe("n/d");
  });
});

describe("RefundConfirmDialog", () => {
  it("should show transaction id and formatted amount", () => {
    renderDialog(jest.fn());

    expect(screen.getByText("tx-1")).toBeInTheDocument();
    expect(screen.getByText(/121,00/)).toBeInTheDocument();
  });

  it("should show n/d when amount is null", () => {
    renderDialog(jest.fn(), { amountCents: null });

    expect(screen.getByText("n/d")).toBeInTheDocument();
  });

  it("should enable confirm only with exactly 6 digits", async () => {
    renderDialog(jest.fn());

    expect(confirmButton()).toBeDisabled();
    await userEvent.type(otpInput(), "12a34");
    expect(otpInput()).toHaveValue("1234");
    expect(confirmButton()).toBeDisabled();
    await userEvent.type(otpInput(), "5678");
    expect(otpInput()).toHaveValue("123456");
    expect(confirmButton()).toBeEnabled();
  });

  it("should call onStarted when the refund is started", async () => {
    const onConfirm = jest.fn().mockResolvedValue("started");
    const props = renderDialog(onConfirm);

    await userEvent.type(otpInput(), "123456");
    await userEvent.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledWith("123456");
    await waitFor(() => expect(props.onStarted).toHaveBeenCalled());
  });

  it.each([
    ["invalidOtp", "Codice non valido"],
    ["conflict", "Storno già in corso o già eseguito"],
    ["unauthorized", "Sessione scaduta, effettua di nuovo il login"],
    ["error", "Errore durante l'avvio dello storno"],
  ])("should show the message for %s", async (result, message) => {
    const props = renderDialog(jest.fn().mockResolvedValue(result));

    await userEvent.type(otpInput(), "123456");
    await userEvent.click(confirmButton());

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(props.onStarted).not.toHaveBeenCalled();
  });

  it("should clear the code on invalid otp", async () => {
    renderDialog(jest.fn().mockResolvedValue("invalidOtp"));

    await userEvent.type(otpInput(), "123456");
    await userEvent.click(confirmButton());

    await waitFor(() => expect(otpInput()).toHaveValue(""));
  });

  it("should not submit twice while a request is in flight", async () => {
    let resolve: (value: RefundStartResult) => void = () => {};
    const onConfirm = jest.fn().mockImplementation(() => new Promise<RefundStartResult>((r) => { resolve = r; }));
    renderDialog(onConfirm);

    await userEvent.type(otpInput(), "123456{Enter}");
    await userEvent.type(otpInput(), "{Enter}");
    resolve("started");

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });
});
