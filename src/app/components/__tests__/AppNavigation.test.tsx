import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import AppNavigation from "../AppNavigation";
import ThemeProviderComponent from "../../theme";

describe("AppNavigation", () => {
  const originalBasePath = process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH;
  });

  afterEach(() => {
    if (originalBasePath === undefined) {
      delete process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH;
    } else {
      process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH = originalBasePath;
    }
  });

  it.each(["/", "/check-transactions"] as const)("links both pages and marks only %s as current", (activePage) => {
    render(
      <ThemeProviderComponent>
        <AppNavigation activePage={activePage} />
      </ThemeProviderComponent>
    );

    const navigation = within(screen.getByRole("navigation", { name: "Navigazione principale" }));
    const home = navigation.getByRole("link", { name: "Analisi Deadletter" });
    const checkTransactions = navigation.getByRole("link", { name: "Verifica transazione" });

    expect(home).toHaveAttribute("href", "/");
    expect(checkTransactions).toHaveAttribute("href", "/check-transactions");
    expect(activePage === "/" ? home : checkTransactions).toHaveAttribute("aria-current", "page");
    expect(activePage === "/" ? checkTransactions : home).not.toHaveAttribute("aria-current");
  });

  it.each([
    "",
    "/",
    "/pagopa-ecommerce-watchdog-deadletter-fe",
    "/pagopa-ecommerce-watchdog-deadletter-fe/",
  ])("preserves the configured public prefix %s in both links", (basePath) => {
    process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH = basePath;
    render(<AppNavigation activePage="/check-transactions" />);

    const prefix = basePath.replace(/\/+$/, "");
    expect(screen.getByRole("link", { name: "Analisi Deadletter" })).toHaveAttribute("href", `${prefix}/`);
    expect(screen.getByRole("link", { name: "Verifica transazione" })).toHaveAttribute("href", `${prefix}/check-transactions`);
  });
});
