export const getTokenFromUrl = (url : string): string | null => {
    const match = RegExp(/#token=(.+)/).exec(url);
    if (match) 
      return match[1];
    else 
      return null
};