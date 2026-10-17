import { act, renderHook } from "@testing-library/react";
import {
  REFUND_POLLING_INTERVAL_MS,
  REFUND_POLLING_TIMEOUT_MS,
  useRefundStatusPolling
} from "../useRefundStatusPolling";
import { fetchRefundStatus } from "../../utils/api/client";

jest.mock("../../utils/api/client", () => ({
  fetchRefundStatus: jest.fn(),
}));

const mockedFetchRefundStatus = fetchRefundStatus as jest.Mock;

const flushPromises = async () => {
  await act(async () => { await Promise.resolve(); });
};

const advance = async (ms: number) => {
  await act(async () => { await jest.advanceTimersByTimeAsync(ms); });
};

describe("useRefundStatusPolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should stay idle and not poll when disabled", () => {
    const { result } = renderHook(() => useRefundStatusPolling("token", "t1", false));

    expect(result.current.outcome).toBe("idle");
    expect(mockedFetchRefundStatus).not.toHaveBeenCalled();
  });

  it("should poll immediately and every interval until DONE", async () => {
    mockedFetchRefundStatus
      .mockResolvedValueOnce("REQUESTED")
      .mockResolvedValueOnce("REQUESTED")
      .mockResolvedValueOnce("DONE");

    const { result } = renderHook(() => useRefundStatusPolling("token", "t1", true));
    await flushPromises();

    expect(mockedFetchRefundStatus).toHaveBeenCalledTimes(1);
    expect(result.current.outcome).toBe("polling");
    expect(result.current.lastStatus).toBe("REQUESTED");

    await advance(REFUND_POLLING_INTERVAL_MS);
    expect(mockedFetchRefundStatus).toHaveBeenCalledTimes(2);

    await advance(REFUND_POLLING_INTERVAL_MS);
    expect(mockedFetchRefundStatus).toHaveBeenCalledTimes(3);
    expect(result.current.outcome).toBe("success");
    expect(result.current.lastStatus).toBe("DONE");

    await advance(REFUND_POLLING_INTERVAL_MS * 3);
    expect(mockedFetchRefundStatus).toHaveBeenCalledTimes(3);
  });

  it("should stop with error on ERROR", async () => {
    mockedFetchRefundStatus.mockResolvedValueOnce("ERROR");

    const { result } = renderHook(() => useRefundStatusPolling("token", "t1", true));
    await flushPromises();

    expect(result.current.outcome).toBe("error");
    expect(result.current.lastStatus).toBe("ERROR");
  });

  it("should keep polling on failed calls and keep the last known status", async () => {
    mockedFetchRefundStatus
      .mockResolvedValueOnce("REQUESTED")
      .mockResolvedValueOnce(null);

    const { result } = renderHook(() => useRefundStatusPolling("token", "t1", true));
    await flushPromises();
    await advance(REFUND_POLLING_INTERVAL_MS);

    expect(result.current.outcome).toBe("polling");
    expect(result.current.lastStatus).toBe("REQUESTED");
  });

  it("should time out after the polling timeout", async () => {
    mockedFetchRefundStatus.mockResolvedValue("REQUESTED");

    const { result } = renderHook(() => useRefundStatusPolling("token", "t1", true));
    await flushPromises();
    await advance(REFUND_POLLING_TIMEOUT_MS);

    expect(result.current.outcome).toBe("timeout");
    const callsAtTimeout = mockedFetchRefundStatus.mock.calls.length;
    expect(callsAtTimeout).toBe(REFUND_POLLING_TIMEOUT_MS / REFUND_POLLING_INTERVAL_MS + 1);

    await advance(REFUND_POLLING_INTERVAL_MS * 3);
    expect(mockedFetchRefundStatus).toHaveBeenCalledTimes(callsAtTimeout);
  });

  it("should stop polling on unmount", async () => {
    mockedFetchRefundStatus.mockResolvedValue("REQUESTED");

    const { unmount } = renderHook(() => useRefundStatusPolling("token", "t1", true));
    await flushPromises();
    unmount();
    await advance(REFUND_POLLING_INTERVAL_MS * 3);

    expect(mockedFetchRefundStatus).toHaveBeenCalledTimes(1);
  });
});
