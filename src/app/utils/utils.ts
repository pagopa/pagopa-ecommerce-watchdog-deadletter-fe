export const getTokenFromHash = (): string | null => {
  if (typeof window !== "undefined") {
    const hash = window.location.hash;  
    const match = RegExp(/#token=(.+)/).exec(hash);
    if (match) 
      return match[1];
  }
  return null;
};

export const getTokenFromUrl = (url : string): string | null => {
    const match = RegExp(/#token=(.+)/).exec(url);
    if (match) 
      return match[1];
    else 
      return null
};