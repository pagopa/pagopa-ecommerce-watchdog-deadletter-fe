import { getTokenFromUrl, debounce, formatDate } from "../utils";

describe('getTokenFromUrl', () => {
  it('should return the token when a valid #token= fragment exists', () => {
    const url = 'https://mock.com/app#token=abc123';
    expect(getTokenFromUrl(url)).toBe('abc123');
  });

  it('should return null if the #token= fragment is not present', () => {
    const url = 'https://mock.com/app#something=else';
    expect(getTokenFromUrl(url)).toBeNull();
  });

  it('should return null when given an empty string', () => {
    const url = '';
    expect(getTokenFromUrl(url)).toBeNull();
  });

  it('should return null if #token= fragment exists but has no value', () => {
    const url = 'https://mock.com/app#token=';
    expect(getTokenFromUrl(url)).toBeNull();
  });
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('delayed', () => {
  const testFn = jest.fn();
  afterEach(() => jest.clearAllMocks());

  it('should call function if delay has passed', async () => {
    const debouncedTestFn = debounce(testFn, 1000);
    debouncedTestFn();
    await sleep(1500);
    expect(testFn).toHaveBeenCalledTimes(1);
  });

  it('should NOT call function if delay has NOT passed and it should reset the timer', async () => {
    const debouncedTestFn = debounce(testFn, 1000);
    debouncedTestFn();
    await sleep(100);
    debouncedTestFn();
    await sleep(1500);
    expect(testFn).toHaveBeenCalledTimes(1);
  });
});

describe('formatDate', () => {
  it('should return the formatted date with - separator', () => {
    const date = new Date(2026, 7, 10);
    expect(formatDate(date)).toBe('2026-08-10');
  });

  it('should return the formatted date with custom separator', () => {
    const date = new Date(2026, 0, 1);
    const sep = '@';
    expect(formatDate(date, sep)).toBe('2026@01@01');
  });
});