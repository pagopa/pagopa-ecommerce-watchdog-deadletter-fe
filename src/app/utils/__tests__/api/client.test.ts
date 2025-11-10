import { ActionType, DeadletterAction } from "@/app/types/DeadletterAction";
import {
  fetchActions,
  fetchActionsByTransactionId,
  fetchAddActionToDeadletterTransaction,
  fetchAuthentication,
  fetchDeadletterTransactions,
} from "../../api/client";
import { DeadletterResponse } from "@/app/types/DeadletterResponse";

const mockAuthOkResponse = {
  urlRedirect: "https://mock.com/token=abc123",
};

const mockAuthenticationCredential = {
  username: "testuser",
  password: "testpassword",
};

const mockToken = "abc123";
const mockTransactionId = "test-id";
const mockDate = "2023-10-01";

const mockActionType: ActionType = {
  value: "test",
  type: "FINAL",
};

const mockDeadletterAction: DeadletterAction = {
  id: "test-id-1",
  deadletterTransactionId: mockTransactionId,
  action: mockActionType,
} as DeadletterAction;

const mockDeadletterActionArray: DeadletterAction[] = [mockDeadletterAction];

const mockDeadletterResponse: DeadletterResponse = {
  deadletterTransactions: [],
  page: {
    current: 0,
    results: 0,
    total: 0,
  },
} as DeadletterResponse;

const mockActionTypeArray: ActionType[] = [mockActionType];

afterEach(() => {
  jest.resetAllMocks();
});

const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST: "https://api.mock.com",
    NEXT_PUBLIC_ECOMMERCE_WATCHDOG_AUTH_API_HOST: "https://api.auth.mock.com",
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe("fetchAuthentication", () => {
  it("should return AuthenticationOk on a successful fetch (200)", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockAuthOkResponse),
    } as unknown as Response);

    const result = await fetchAuthentication(mockAuthenticationCredential);

    expect(result).toEqual(mockAuthOkResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.auth.mock.com/authenticate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockAuthenticationCredential),
      }
    );
  });

  it("should throw an Error on a 400 status", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
    } as unknown as Response);

    await expect(
      fetchAuthentication(mockAuthenticationCredential)
    ).rejects.toThrow("Malformed request");
  });

  it("should throw  an Error on a 401 status", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
    } as unknown as Response);

    await expect(
      fetchAuthentication(mockAuthenticationCredential)
    ).rejects.toThrow("Unauthorized. The credential are invalid");
  });

  it("should throw  an Error on other non-ok statuses", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(
      fetchAuthentication(mockAuthenticationCredential)
    ).rejects.toThrow("Failed to fetch user");
  });
});

describe("fetchActionsByTransactionId", () => {
  it("should return DeadletterAction array on a successful fetch (200)", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockDeadletterActionArray),
    } as unknown as Response);

    const result = await fetchActionsByTransactionId(
      mockToken,
      mockTransactionId
    );

    expect(result).toEqual(mockDeadletterActionArray);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `https://api.mock.com/deadletter-transactions/${mockTransactionId}/actions`,
      {
        headers: { Authorization: `Bearer ${mockToken}` },
      }
    );
  });

  it("should return an empty array on a non-ok status", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);
    const error = new Error(`Failed to fetch actions for ${mockTransactionId}`);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await fetchActionsByTransactionId(
      mockToken,
      mockTransactionId
    );

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  });
});

describe("fetchDeadletterTransactions", () => {
  it("should return DeadletterResponse array on a successful fetch (200)", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockDeadletterResponse),
    } as unknown as Response);

    const result = await fetchDeadletterTransactions(mockToken, mockDate);

    expect(result).toEqual(mockDeadletterResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `https://api.mock.com/deadletter-transactions?date=${mockDate}&pageNumber=0&pageSize=500`,
      {
        headers: { Authorization: `Bearer ${mockToken}` },
      }
    );
  });

  it("should return null on a non-ok status", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);
    const error = new Error("Failed to fetch deadletter transactions");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await fetchDeadletterTransactions(mockToken, mockDate);

    expect(result).toEqual(null);
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  });
});

describe("fetchAddActionToDeadletterTransaction", () => {
  it("should return Response on a successful fetch (200)", async () => {
    const mockResponse = {
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response;
    jest.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const result = await fetchAddActionToDeadletterTransaction(
      mockToken,
      mockDeadletterAction
    );

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `https://api.mock.com/deadletter-transactions/${mockDeadletterAction.deadletterTransactionId}/actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ value: mockDeadletterAction.action.value }),
      }
    );
  });

  it("should return null on a non-ok status", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);
    const error = new Error(
      `Failed to add action to deadletter transaction with id: ${mockDeadletterAction.deadletterTransactionId}`
    );
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await fetchAddActionToDeadletterTransaction(
      mockToken,
      mockDeadletterAction
    );

    expect(result).toEqual(null);
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  });
});

describe("fetchActions", () => {
  it("should return ActionType array on a successful fetch (200)", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockActionTypeArray),
    } as unknown as Response);

    const result = await fetchActions(mockToken);

    expect(result).toEqual(mockActionTypeArray);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `https://api.mock.com/actions`,
      {
        headers: { Authorization: `Bearer ${mockToken}` },
      }
    );
  });

  it("should return an empty array on a non-ok status", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);
    const error = new Error("Failed to fetch actions");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await fetchActions(mockToken);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  });
});
