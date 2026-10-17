import { useEffect, useState } from "react";
import { fetchRefundStatus } from "../utils/api/client";
import { RefundOutcome, RefundRequestStatus } from "../types/Refund";

export const REFUND_POLLING_INTERVAL_MS = 10_000;
export const REFUND_POLLING_TIMEOUT_MS = 10 * 60_000;

export function useRefundStatusPolling(token: string, transactionId: string, enabled: boolean) {
  const [finalOutcome, setFinalOutcome] = useState<RefundOutcome | null>(null);
  const [lastStatus, setLastStatus] = useState<RefundRequestStatus | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + REFUND_POLLING_TIMEOUT_MS;

    const poll = async () => {
      const status = await fetchRefundStatus(token, transactionId);
      if (cancelled) return;

      if (status) setLastStatus(status);

      if (status === 'DONE') {
        setFinalOutcome('success');
      } else if (status === 'ERROR') {
        setFinalOutcome('error');
      } else if (Date.now() + REFUND_POLLING_INTERVAL_MS > deadline) {
        setFinalOutcome('timeout');
      } else {
        timer = setTimeout(poll, REFUND_POLLING_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setFinalOutcome(null);
      setLastStatus(null);
    };
  }, [token, transactionId, enabled]);

  const outcome: RefundOutcome = enabled ? finalOutcome ?? 'polling' : 'idle';
  return { outcome, lastStatus };
}
