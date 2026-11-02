import {
  formatAmount,
  isValidTransactionId,
  normalizeTransactionId,
  parseEventDate,
  statusTone
} from "../transactionCheckUtils";

describe("transactionCheckUtils", () => {
  it("normalizes and validates transaction ids", () => {
    expect(normalizeTransactionId(" 6460dc3e61ba4ed6 bfea2c4468b2862c\n")).toBe("6460dc3e61ba4ed6bfea2c4468b2862c");
    expect(isValidTransactionId("6460dc3e61ba4ed6bfea2c4468b2862c")).toBe(true);
    expect(isValidTransactionId("6460DC3E61BA4ED6BFEA2C4468B2862C")).toBe(true);
    expect(isValidTransactionId("6460dc3e")).toBe(false);
    expect(isValidTransactionId("zz60dc3e61ba4ed6bfea2c4468b2862c")).toBe(false);
  });

  it("parses eCommerce dates with zone suffix", () => {
    expect(parseEventDate("2025-07-02T16:52:27.305Z[Etc/UTC]")?.toISOString()).toBe("2025-07-02T16:52:27.305Z");
    expect(parseEventDate("not a date")).toBeNull();
  });

  it("formats amounts in euro cents", () => {
    expect(formatAmount(12100)).toMatch(/121,00\s€/);
    expect(formatAmount(null)).toBe("n/d");
  });

  it.each([
    ["REFUNDED", "success"],
    ["NOTIFIED_OK", "success"],
    ["EXECUTED", "success"],
    ["REFUND_ERROR", "error"],
    ["NOTIFIED_KO", "error"],
    ["DECLINED", "error"],
    ["UNAUTHORIZED", "error"],
    ["REFUND_REQUESTED", "warning"],
    ["PENDING", "warning"],
    ["ACTIVATED", "neutral"],
    [null, "neutral"],
  ])("maps %s to %s tone", (status, tone) => {
    expect(statusTone(status)).toBe(tone);
  });
});
