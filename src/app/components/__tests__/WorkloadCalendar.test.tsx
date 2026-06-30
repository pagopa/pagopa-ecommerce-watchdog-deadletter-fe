import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkloadCalendar from "../WorkloadCalendar";
import { CalendarStats } from "@/app/types/CalendarStatsResponse";

jest.mock('../../utils/utils', () => ({
  debounce: jest.fn(),
}));

const mockSetRange = jest.fn();
const mockSetDate = jest.fn();

const mockDayStats: CalendarStats[] = [
  {"date": "2026/08/01", finalized: 0, notFinalized: 0, notAnalyzed: 2},
  {"date": "2026/08/02", finalized: 0, notFinalized: 3, notAnalyzed: 2},
  {"date": "2026/08/03", finalized: 0, notFinalized: 2, notAnalyzed: 0},
  {"date": "2026/08/04", finalized: 1, notFinalized: 1, notAnalyzed: 0},
  {"date": "2026/08/05", finalized: 4, notFinalized: 0, notAnalyzed: 0}
]

const defaultProps = {
  range: undefined,
  setRange: mockSetRange,
  date: new Date(),
  setDate: mockSetDate,
  stats: mockDayStats,
};

const currentMonth = new Date().toLocaleString("it-IT", {month: "long"});
const currentYear = new Date().toLocaleString("it-IT", {year: "numeric"});

const renderComponent = (props = {}) => {
  return render(<WorkloadCalendar {...defaultProps} {...props} />);
};

describe("WorkloadCalendar", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders calendar correctly", () => {
    renderComponent();

    // Check elements
    expect(screen.getByText(`${currentMonth} ${currentYear}`)).toBeInTheDocument();
    expect(screen.getByText("Resetta selezione")).toBeInTheDocument();
    expect(screen.getByText("Vai a oggi")).toBeInTheDocument();
    expect(screen.getByLabelText("Vai al mese precedente")).toBeInTheDocument();
    expect(screen.getByLabelText("Vai al mese successivo")).toBeInTheDocument();

  });

  it('range can be selected', async () => {
    const user = userEvent.setup();
    renderComponent();

    const day1Cell = screen.getByRole("button", { name: new RegExp(` 1 ${currentMonth}`) });
    expect(day1Cell).toBeInTheDocument();

    //Click on day 1 cell
    await user.click(day1Cell);
    expect(mockSetRange).toHaveBeenCalledTimes(1);

    const day2Cell = screen.getByRole("button", { name: new RegExp(` 2 ${currentMonth}`) });
    expect(day2Cell).toBeInTheDocument();

    //Click on day 2 cell
    await user.click(day2Cell);
    expect(mockSetRange).toHaveBeenCalledTimes(2);
  });

  it('month can be changed', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nextMonth = screen.getByRole("button", { name: "Vai al mese successivo"});
    expect(nextMonth).toBeInTheDocument();

    //Click on next month
    await user.click(nextMonth);
    expect(mockSetDate).toHaveBeenCalledTimes(1);

    const previousMonth = screen.getByRole("button", { name: "Vai al mese precedente"});
    expect(previousMonth).toBeInTheDocument();

    //Click on previous month
    await user.click(previousMonth);
    expect(mockSetDate).toHaveBeenCalledTimes(2);
  });

  it('Reset selection calls setRange', async () => {
    const user = userEvent.setup();
    renderComponent();

    const resetSelection = screen.getByText("Resetta selezione");
    expect(resetSelection).toBeInTheDocument();
    expect(screen.getByText("Vai a oggi")).toBeInTheDocument();

    //Click button
    await user.click(resetSelection);
    expect(mockSetRange).toHaveBeenCalledTimes(1);
  });

  it('Go to today calls setDate', async () => {
    const user = userEvent.setup();
    renderComponent();

    const todaySelection = screen.getByText("Vai a oggi");
    expect(todaySelection).toBeInTheDocument();

    //Click button
    await user.click(todaySelection);
    expect(mockSetDate).toHaveBeenCalledTimes(1);
  });
});
