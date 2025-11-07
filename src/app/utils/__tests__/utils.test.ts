import { getTokenFromUrl } from "../utils";

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