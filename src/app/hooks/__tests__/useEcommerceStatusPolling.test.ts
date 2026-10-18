import { act, renderHook } from "@testing-library/react";
import {
  REFUND_POLLING_INTERVAL_MS,
  REFUND_POLLING_MAX_CHECKS,
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

  it("checks 13 times over 2 minutes", () => {
    expect(REFUND_POLLING_INTERVAL_MS).toBe(10_000);
    expect(REFUND_POLLING_MAX_CHECKS).toBe(13);
  });

  it("does nothing when disabled", () => {
    const onSettled = jest.fn();
    const { result } = renderHook(() => useEcommerceStatusPolling("token", "t1", false, onSettled));

    expect(result.current).toEqual({ checks: 0, lastStatus: null });
    expect(mockedFetchStatus).not.toHaveBeenCalled();
  });

  it("checks immediately and settles on REFUNDED", async () => {
    mockedFetchStatus.mockResolvedValueOnce("REFUND_REQUESTED").mockResolvedValueOnce("REFUNDED");
    const onSettled = jest.fn();

    const { result } = renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));
    await flushPromises();

    expect(result.current).toEqual({ checks: 1, lastStatus: "REFUND_REQUESTED" });
    expect(onSettled).not.toHaveBeenCalled();

    await advance(REFUND_POLLING_INTERVAL_MS);

    expect(onSettled).toHaveBeenCalledWith("refunded", "REFUNDED");
    await advance(REFUND_POLLING_INTERVAL_MS * 3);
    expect(mockedFetchStatus).toHaveBeenCalledTimes(2);
  });

  it("stops early on REFUND_ERROR", async () => {
    mockedFetchStatus.mockResolvedValueOnce("REFUND_ERROR");
    const onSettled = jest.fn();

    renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));
    await flushPromises();

    expect(onSettled).toHaveBeenCalledWith("refundError", "REFUND_ERROR");
  });

  it("times out after the last check, keeping the last known status on failed calls", async () => {
    mockedFetchStatus.mockResolvedValueOnce("REFUND_REQUESTED").mockResolvedValue(null);
    const onSettled = jest.fn();

    renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));
    await flushPromises();
    await advance(REFUND_POLLING_INTERVAL_MS * (REFUND_POLLING_MAX_CHECKS - 1));

    expect(mockedFetchStatus).toHaveBeenCalledTimes(REFUND_POLLING_MAX_CHECKS);
    expect(onSettled).toHaveBeenCalledWith("timeout", "REFUND_REQUESTED");
  });

  it("stops on unmount", async () => {
    mockedFetchStatus.mockResolvedValue("REFUND_REQUESTED");
    const onSettled = jest.fn();

    const { unmount } = renderHook(() => useEcommerceStatusPolling("token", "t1", true, onSettled));
    await flushPromises();
    unmount();
    await advance(REFUND_POLLING_INTERVAL_MS * 3);

    expect(mockedFetchStatus).toHaveBeenCalledTimes(1);
    expect(onSettled).not.toHaveBeenCalled();
  });
});
