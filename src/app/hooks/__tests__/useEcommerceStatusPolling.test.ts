import { act, renderHook } from "@testing-library/react";
import {
  REFUND_POLLING_INITIAL_INTERVAL_MS,
  REFUND_POLLING_TIMEOUT_MS,
  useEcommerceStatusPolling
} from "../useEcommerceStatusPolling";
import { fetchTransactionEcommerceStatus } from "../../utils/api/client";

jest.mock("../../utils/api/client", () => ({
  fetchTransactionEcommerceStatus: jest.fn(),
}));

const mockedFetchStatus = fetchTransactionEcommerceStatus as jest.Mock;

const flushPromises = async () => {
  await act(async () => { await Promise.resolve(); });
};

const advance = async (ms: number) => {
  await act(async () => { await jest.advanceTimersByTimeAsync(ms); });
};

describe("useEcommerceStatusPolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does nothing when disabled", () => {
    const onSettled = jest.fn();
    const { result } = renderHook(() => useEcommerceStatusPolling("token", "t1", false, onSettled));

    expect(result.current).toEqual({ checks: 0, lastStatus: null });
    expect(mockedFetchStatus).not.toHaveBeenCalled();
  });

  it("checks immediately then uses exponential backoff (2s → 4s → 8s → …)", async () => {
    // All responses pending — we just want to verify the schedule, not the outcome.
    mockedFetchStatus.mockResolvedValue("REFUND_REQUESTED");
    const onSettled = jest.fn();

    renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));

    // Check 1: immediate
    await flushPromises();
    expect(mockedFetchStatus).toHaveBeenCalledTimes(1);

    // Check 2: after REFUND_POLLING_INITIAL_INTERVAL_MS (2s)
    await advance(REFUND_POLLING_INITIAL_INTERVAL_MS);
    expect(mockedFetchStatus).toHaveBeenCalledTimes(2);

    // Check 3: after 4s (2× the initial interval)
    await advance(REFUND_POLLING_INITIAL_INTERVAL_MS * 2);
    expect(mockedFetchStatus).toHaveBeenCalledTimes(3);

    // Check 4: after 8s (4× the initial interval)
    await advance(REFUND_POLLING_INITIAL_INTERVAL_MS * 4);
    expect(mockedFetchStatus).toHaveBeenCalledTimes(4);
  });

  it("settles on REFUNDED", async () => {
    mockedFetchStatus
      .mockResolvedValueOnce("REFUND_REQUESTED")
      .mockResolvedValueOnce("REFUNDED");
    const onSettled = jest.fn();

    renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));
    await flushPromises();
    expect(onSettled).not.toHaveBeenCalled();

    await advance(REFUND_POLLING_INITIAL_INTERVAL_MS);
    expect(onSettled).toHaveBeenCalledWith("refunded", "REFUNDED");

    // No further calls after settlement.
    await advance(REFUND_POLLING_INITIAL_INTERVAL_MS * 10);
    expect(mockedFetchStatus).toHaveBeenCalledTimes(2);
  });

  it("stops early on REFUND_ERROR", async () => {
    mockedFetchStatus.mockResolvedValueOnce("REFUND_ERROR");
    const onSettled = jest.fn();

    renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));
    await flushPromises();

    expect(onSettled).toHaveBeenCalledWith("refundError", "REFUND_ERROR");
  });

  it("times out after the 30s wall-clock deadline, keeping the last known status", async () => {
    mockedFetchStatus.mockResolvedValueOnce("REFUND_REQUESTED").mockResolvedValue(null);
    const onSettled = jest.fn();

    renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));
    await flushPromises();

    // Just before the deadline — must not have settled yet.
    await advance(REFUND_POLLING_TIMEOUT_MS - 1);
    expect(onSettled).not.toHaveBeenCalled();

    // Cross the deadline.
    await advance(2);
    expect(onSettled).toHaveBeenCalledWith("timeout", "REFUND_REQUESTED");
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("times out on the deadline even when a fetch is stalled (never resolves)", async () => {
    mockedFetchStatus.mockReturnValue(new Promise(() => {}));
    const onSettled = jest.fn();

    renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));

    await advance(REFUND_POLLING_TIMEOUT_MS);
    expect(onSettled).toHaveBeenCalledWith("timeout", null);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("calls onSettled only once even if a late response arrives after the deadline", async () => {
    let resolveFirst!: (v: string) => void;
    const slowPromise = new Promise<string>((res) => { resolveFirst = res; });
    mockedFetchStatus.mockReturnValueOnce(slowPromise).mockResolvedValue(null);
    const onSettled = jest.fn();

    renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));

    // Cross the deadline while the first fetch is still in flight.
    await advance(REFUND_POLLING_TIMEOUT_MS);
    expect(onSettled).toHaveBeenCalledWith("timeout", null);

    // Late response resolves — onSettled must not be called again.
    await act(async () => { resolveFirst("REFUNDED"); await Promise.resolve(); });
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("stops on unmount", async () => {
    mockedFetchStatus.mockResolvedValue("REFUND_REQUESTED");
    const onSettled = jest.fn();

    const { unmount } = renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));
    await flushPromises();
    unmount();
    await advance(REFUND_POLLING_INITIAL_INTERVAL_MS * 10);

    expect(mockedFetchStatus).toHaveBeenCalledTimes(1);
    expect(onSettled).not.toHaveBeenCalled();
  });
});
