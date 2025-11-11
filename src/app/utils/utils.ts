export const getTokenFromUrl = (url : string): string | null => {
    const match = new RegExp(/#token=(.+)/).exec(url);
    if (match) 
      return match[1];
    else 
      return null
};