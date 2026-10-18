import { useEffect, useRef, useState } from "react";
import { fetchTransactionEcommerceStatus } from "../utils/api/client";

export const REFUND_POLLING_INTERVAL_MS = 10_000;
export const REFUND_POLLING_TIMEOUT_MS = 2 * 60_000;
// First check is immediate, then one every interval until the timeout.
export const REFUND_POLLING_MAX_CHECKS = REFUND_POLLING_TIMEOUT_MS / REFUND_POLLING_INTERVAL_MS + 1;

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
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;
    let lastStatus: string | null = null;

    const poll = async () => {
      const status = await fetchTransactionEcommerceStatus(token, transactionId);
      if (cancelled) return;

      checks += 1;
      lastStatus = status ?? lastStatus;
      setProgress({ checks, lastStatus });

      if (status === "REFUNDED") {
        onSettledRef.current('refunded', lastStatus);
      } else if (status === "REFUND_ERROR") {
        onSettledRef.current('refundError', lastStatus);
      } else if (checks >= REFUND_POLLING_MAX_CHECKS) {
        onSettledRef.current('timeout', lastStatus);
      } else {
        timer = setTimeout(poll, REFUND_POLLING_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setProgress({ checks: 0, lastStatus: null });
    };
  }, [token, transactionId, enabled]);

  return progress;
}
