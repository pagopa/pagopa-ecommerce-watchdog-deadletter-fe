import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import AppNavigation from "../AppNavigation";
import ThemeProviderComponent from "../../theme";

describe("AppNavigation", () => {
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
});
