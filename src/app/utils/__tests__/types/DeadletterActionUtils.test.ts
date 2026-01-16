import { DeadletterAction } from "@/app/types/DeadletterAction";
import { getDeadletterActionAsString } from "../../types/DeadletterActionUtils";

describe("getDeadletterActionAsString", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-11-06T18:30:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should correctly format a deadletter action string with a valid timestamp", () => {
    const timestamp = "2025-11-06T18:30:00.000Z";

    const mockAction: DeadletterAction = {
      timestamp: timestamp,
      userId: "test-id",
      action: {
        value: "Stornata",
        type: "FINAL",
      },
      id: "",
      deadletterTransactionId: "",
    };

    const expectedString = `[test-id - 06/11/2025, 19:30] Stornata`;
    const result = getDeadletterActionAsString(mockAction);

    expect(result).toBe(expectedString);
  });

  it("should handle invalid date timestamps", () => {
    const mockAction: DeadletterAction = {
      timestamp: "this-is-not-a-valid-date",
      userId: "test-id",
      action: {
        value: "Stornata",
        type: "FINAL",
      },
      id: "",
      deadletterTransactionId: "",
    };

    const expectedString = `[test-id - ] Stornata`;
    const result = getDeadletterActionAsString(mockAction);

    expect(result).toBe(expectedString);
  });

  it("should handle empty user and action values", () => {
    const timestamp = "2025-11-06T18:30:00.000Z";

    const mockAction: DeadletterAction = {
      timestamp: timestamp,
      userId: "",
      action: {
        value: "",
        type: "FINAL",
      },
      id: "",
      deadletterTransactionId: "",
    };

    const expectedString = `[ - 06/11/2025, 19:30] `;
    const result = getDeadletterActionAsString(mockAction);

    expect(result).toBe(expectedString);
  });
});
