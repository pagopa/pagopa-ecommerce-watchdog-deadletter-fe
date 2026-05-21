import rules from "./suggestedActionConfig.json";

export type SuggestedActionSeverity = "info" | "warning" | "error";

export type SuggestedActionResult = {
    suggestedAction: string;
    severity: SuggestedActionSeverity;
};

type Rule = {
    nodoStatus: string | null;
    eCommerceStatus: string | null;
    gatewayAuthorizationStatus: string | null;
    paymentMethodName: string | null;
    suggestedAction: string;
    severity: SuggestedActionSeverity;
};

function normalize(value: string | null | undefined): string {
    if (value === null || value === undefined) return "";
    return value.trim().toUpperCase();
}

function matches(ruleValue: string | null, inputValue: string | null | undefined): boolean {
    if (ruleValue === null || ruleValue === "") {
        return normalize(inputValue) === "";
    }
    return normalize(ruleValue) === normalize(inputValue);
}

export function getSuggestedAction(
    nodoStatus: string | null | undefined,
    eCommerceStatus: string | null | undefined,
    gatewayAuthorizationStatus: string | null | undefined,
    paymentMethodName: string | null | undefined
): SuggestedActionResult | null {
    const typedRules = rules as Rule[];

    const matchedRule = typedRules.find((rule) =>
        matches(rule.nodoStatus, nodoStatus) &&
        matches(rule.eCommerceStatus, eCommerceStatus) &&
        matches(rule.gatewayAuthorizationStatus, gatewayAuthorizationStatus) &&
        matches(rule.paymentMethodName, paymentMethodName)
    );

    if (!matchedRule) return null;

    return {
        suggestedAction: matchedRule.suggestedAction,
        severity: matchedRule.severity,
    };
}