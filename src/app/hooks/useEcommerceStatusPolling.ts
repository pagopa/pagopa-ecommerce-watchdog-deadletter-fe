import { useEffect, useRef, useState } from "react";
import { fetchTransactionEcommerceStatus } from "../utils/api/client";

export const REFUND_POLLING_INITIAL_INTERVAL_MS = 2_000;
export const REFUND_POLLING_TIMEOUT_MS = 30_000;
export const REFUND_POLLING_MAX_CHECKS = 24;

export type RefundPollingResult = 'refunded' | 'refundError' | 'timeout';

export interface RefundPollingProgress {
  checks: number;
  lastStatus: string | null;
}

export function useEcommerceStatusPolling(
  token: string,
  transactionId: string,
  enabled: boolean,
  onSettled: (result: RefundPollingResult, lastStatus: string | null) => void
): RefundPollingProgress {
  const [progress, setProgress] = useState<RefundPollingProgress>({ checks: 0, lastStatus: null });
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    let checks = 0;
    let lastStatus: string | null = null;
    let nextInterval = REFUND_POLLING_INITIAL_INTERVAL_MS;

    const settle = (result: RefundPollingResult) => {
      if (settled || cancelled) return;
      settled = true;
      clearTimeout(pollTimer);
      onSettledRef.current(result, lastStatus);
    };

    // Independent wall-clock deadline — fires regardless of in-flight requests.
    const deadlineTimer = setTimeout(() => settle('timeout'), REFUND_POLLING_TIMEOUT_MS);

    const poll = async () => {
      const status = await fetchTransactionEcommerceStatus(token, transactionId);
      if (cancelled || settled) return;

      checks += 1;
      lastStatus = status ?? lastStatus;
      setProgress({ checks, lastStatus });

      if (status === "REFUNDED") {
        settle('refunded');
      } else if (status === "REFUND_ERROR") {
        settle('refundError');
      } else {
        // Exponential backoff: 2s → 4s → 8s → 16s → ...
        pollTimer = setTimeout(poll, nextInterval);
        nextInterval *= 2;
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      clearTimeout(deadlineTimer);
      setProgress({ checks: 0, lastStatus: null });
    };
  }, [token, transactionId, enabled]);

  return progress;
}
