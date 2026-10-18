import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckTransactionsPage from "../page";
import { fetchTransactionCheck } from "../../utils/api/client";
import { navigateTo } from "../../utils/utils";
import { transactionCheckMock } from "../../components/check-transactions/__tests__/mock/transactionCheckMock";

const mockPush = jest.fn();
let mockSearch = "";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/check-transactions",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

jest.mock("../../utils/api/client", () => ({
  fetchTransactionCheck: jest.fn(),
  requestTransactionRefund: jest.fn(),
  fetchTransactionEcommerceStatus: jest.fn(),
}));

jest.mock("../../utils/utils", () => ({
  ...jest.requireActual("../../utils/utils"),
  navigateTo: jest.fn(),
}));

const mockedFetchTransactionCheck = fetchTransactionCheck as jest.Mock;
const VALID_ID = transactionCheckMock.transactionId;

const login = () => {
  sessionStorage.setItem("authToken", "token");
  sessionStorage.setItem("jwtUser", JSON.stringify({ id: "u1", name: "Mario", surname: "Rossi", email: "m@r.it" }));
};

describe("CheckTransactionsPage", () => {
  beforeEach(() => {
    mockSearch = "";
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("asks to login when there is no token", async () => {
    render(<CheckTransactionsPage />);

    expect(await screen.findByText("Effettua prima il login")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Vai alla home" }));
    expect(navigateTo).toHaveBeenCalled();
  });

  it("shows the empty state and pushes the searched id to the url", async () => {
    login();
    render(<CheckTransactionsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Verifica transazione" })).toBeInTheDocument();
    expect(screen.getByText("Nessuna transazione selezionata")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Transaction ID"), `${VALID_ID}{Enter}`);

    expect(mockPush).toHaveBeenCalledWith(`/check-transactions?transactionId=${VALID_ID}`);
    expect(mockedFetchTransactionCheck).not.toHaveBeenCalled();
  });

  it("loads the transaction from the url and renders all sections", async () => {
    login();
    mockSearch = `transactionId=${VALID_ID}`;
    mockedFetchTransactionCheck.mockResolvedValue({ outcome: "found", transaction: transactionCheckMock });

    render(<CheckTransactionsPage />);

    expect(await screen.findByRole("heading", { name: "Transazione" })).toBeInTheDocument();
    expect(mockedFetchTransactionCheck).toHaveBeenCalledWith("token", VALID_ID);
    expect(screen.getByRole("heading", { name: "Eventi" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Azioni compensative" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tutti i dettagli" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "eCommerce Details" })).toHaveAttribute("aria-expanded", "false");
  });

  it("reloads when searching the same id again", async () => {
    login();
    mockSearch = `transactionId=${VALID_ID}`;
    mockedFetchTransactionCheck.mockResolvedValue({ outcome: "found", transaction: transactionCheckMock });

    render(<CheckTransactionsPage />);
    await screen.findByRole("heading", { name: "Transazione" });
    await userEvent.click(screen.getByRole("button", { name: "Cerca" }));

    await waitFor(() => expect(mockedFetchTransactionCheck).toHaveBeenCalledTimes(2));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it.each([
    [{ outcome: "notFound" }, /Nessuna transazione trovata/],
    [{ outcome: "unauthorized" }, /Sessione scaduta/],
    [{ outcome: "error" }, /Errore nel recupero della transazione/],
  ])("renders %o", async (result, text) => {
    login();
    mockSearch = `transactionId=${VALID_ID}`;
    mockedFetchTransactionCheck.mockResolvedValue(result);

    render(<CheckTransactionsPage />);

    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it("warns about an invalid id in the url", () => {
    login();
    mockSearch = "transactionId=abc";

    render(<CheckTransactionsPage />);

    expect(screen.getByText(/non è valido/)).toBeInTheDocument();
    expect(mockedFetchTransactionCheck).not.toHaveBeenCalled();
  });
});
