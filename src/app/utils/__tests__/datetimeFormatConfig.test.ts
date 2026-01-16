import { dateTimeLocale, utcDateTimeFormatOptions, dateTimeFormatOptions, extendedMonthDateFormatOptions } from "../datetimeFormatConfig";


describe("dateTimeFormatConfig", () => {
    it("should have the correct locale", () => {
        expect(dateTimeLocale).toBe("it-IT");
    });

    it("should have correct UTC date time format options", () => {
        expect(utcDateTimeFormatOptions.timeZone).toBe("UTC");
        expect(utcDateTimeFormatOptions.year).toBe("numeric");
        expect(utcDateTimeFormatOptions.month).toBe("2-digit");
        expect(utcDateTimeFormatOptions.day).toBe("2-digit");
        expect(utcDateTimeFormatOptions.hour).toBe("2-digit");
        expect(utcDateTimeFormatOptions.minute).toBe("2-digit");
        expect(utcDateTimeFormatOptions.second).toBe("2-digit");
    });

    it("should have correct date time format options", () => {
        expect(dateTimeFormatOptions.year).toBe("numeric");
        expect(dateTimeFormatOptions.month).toBe("2-digit");
        expect(dateTimeFormatOptions.day).toBe("2-digit");
        expect(dateTimeFormatOptions.hour).toBe("2-digit");
        expect(dateTimeFormatOptions.minute).toBe("2-digit");
    });

    it("should have correct extended month date format options", () => {
        expect(extendedMonthDateFormatOptions.year).toBe("numeric");
        expect(extendedMonthDateFormatOptions.month).toBe("long");
        expect(extendedMonthDateFormatOptions.day).toBe("2-digit");
    });
});
