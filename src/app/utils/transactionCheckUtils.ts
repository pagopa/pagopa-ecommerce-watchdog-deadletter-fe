import { dateTimeFormatOptions, dateTimeLocale, utcDateTimeFormatOptions } from "./datetimeFormatConfig";

const TRANSACTION_ID_REGEX = /^[0-9a-f]{32}$/i;

export const normalizeTransactionId = (value: string): string => value.replace(/\s/g, "");

export const isValidTransactionId = (value: string): boolean => TRANSACTION_ID_REGEX.test(value);

// eCommerce dates may carry a zone suffix like "2025-07-02T16:52:27.305Z[Etc/UTC]".
export const parseEventDate = (value: string): Date | null => {
  const date = new Date(value.replace(/\[.*\]$/, ""));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatLocalDateTime = (date: Date): string =>
  date.toLocaleString(dateTimeLocale, dateTimeFormatOptions);

export const formatUtcDateTime = (date: Date): string =>
  `${date.toLocaleString(dateTimeLocale, utcDateTimeFormatOptions)} UTC`;

export const formatAmount = (amountCents: number | null | undefined): string =>
  amountCents == null
    ? "n/d"
    : new Intl.NumberFormat(dateTimeLocale, { style: "currency", currency: "EUR" }).format(amountCents / 100);

export type StatusTone = "success" | "error" | "warning" | "neutral";

export const statusTone = (status: string | null): StatusTone => {
  if (!status) return "neutral";
  const value = status.toUpperCase();
  if (/(ERROR|KO|FAIL|DECLINED|DENIED|CANCEL|EXPIRED|UNAUTHORIZED)/.test(value)) return "error";
  if (/(PENDING|REQUESTED|IN_PROGRESS|RETRIED|WAITING)/.test(value)) return "warning";
  if (/(OK|REFUNDED|EXECUTED|AUTHORIZED|NOTIFIED|CLOSED|COMPLETED|SUCCESS)/.test(value)) return "success";
  return "neutral";
};
