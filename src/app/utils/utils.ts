export const useTokenFromHash = (): string | null => {
  if (typeof window !== "undefined") {
    const hash = window.location.hash;  
    const match = hash.match(/#token=(.+)/);
    if (match) 
      return match[1];
  }
  return null;
};
