import { getSuggestedAction } from "../SuggestedActionsRules";

describe("SuggestedActionsRules", () => {
    it("should return correct suggested action for a known rule (warning)", () => {
        const result = getSuggestedAction(
            "CANCELLED",
            "REFUND_ERROR",
            "CANCELED",
            "APPLEPAY"
        );
        expect(result).toEqual({
            suggestedAction: "Se presente paymentEndToEndId aprire request al PSP per verificare se rilevano addebito. Se addebitato -> Da stornare eComm, altrimenti -> No Azioni",
            severity: "warning",
        });
    });

    it("should return correct suggested action for a known rule (error)", () => {
        const result = getSuggestedAction(
            "CANCELLED",
            "REFUND_ERROR",
            "EXECUTED",
            "APPLEPAY"
        );
        expect(result).toEqual({
            suggestedAction: "Da stornare eComm",
            severity: "error",
        });
    });

    it("should return correct suggested action for a known rule (info)", () => {
        const result = getSuggestedAction(
            "CANCELLED",
            "REFUND_ERROR",
            "CANCELED",
            "BANCOMATPAY"
        );
        expect(result).toEqual({
            suggestedAction: "No Azioni",
            severity: "info",
        });
    });

    it("should return null when no rule matches", () => {
        const result = getSuggestedAction(
            "UNKNOWN_STATUS",
            "UNKNOWN_ECOMM_STATUS",
            "UNKNOWN_GATEWAY_STATUS",
            "UNKNOWN_METHOD"
        );
        expect(result).toBeNull();
    });

    it("should match rules with empty gatewayAuthorizationStatus correctly", () => {
        const result = getSuggestedAction(
            "CANCELLED",
            "REFUND_ERROR",
            null,
            "BANCOMATPAY"
        );
        expect(result).toEqual({
            suggestedAction: "Verificare stato con PPI. Se CANCELLED/REFUNDED -> No Azioni. Se EXECUTED -> Da stornare",
            severity: "warning",
        });

        const resultEmpty = getSuggestedAction(
            "CANCELLED",
            "REFUND_ERROR",
            "",
            "BANCOMATPAY"
        );
        expect(resultEmpty).toEqual(result);
    });

    it("should match rules with empty gatewayAuthorizationStatus in config correctly", () => {
        const result = getSuggestedAction(
            "CANCELLED",
            "REFUND_ERROR",
            null,
            "BANCOMATPAY"
        );
        expect(result).not.toBeNull();
    });

    it("should handle mixed case and whitespace in inputs", () => {
        const result = getSuggestedAction(
            " cancelled ",
            " refund_error ",
            " executed ",
            " cards "
        );
        expect(result).toEqual({
            suggestedAction: "Da stornare eComm",
            severity: "error",
        });
    });

    it("should handle undefined inputs as equivalent to null/empty", () => {
        const result = getSuggestedAction(
            "CANCELLED",
            "REFUND_ERROR",
            undefined,
            "BANCOMATPAY"
        );
        expect(result).not.toBeNull();
        expect(result?.severity).toBe("warning");
    });
});
