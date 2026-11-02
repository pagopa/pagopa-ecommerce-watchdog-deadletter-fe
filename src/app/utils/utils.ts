import { DependencyList, useEffect } from 'react';

export const getTokenFromUrl = (url: string): string | null => {
  const match = new RegExp(/#token=(.+)/).exec(url);
  if (match)
    return match[1];
  else
    return null
};
export const navigateTo = (url: string) => {
  window.location.assign(url);
};

export const getAppPath = (path: string): string => {
  const basePath = (process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH ?? "").replace(/\/+$/, "");
  return `${basePath}${path}`;
};

export function debounce(fn: () => void, delay: number): () => void {
  let timer: ReturnType<typeof setTimeout>;

  return () => {
    clearTimeout(timer)
    timer = setTimeout( () => { fn(); }, delay);
  }
}

export function formatDate(date: Date, sep: string = "-"): string {
  const components = [
    date.getFullYear(),
    (date.getMonth()+1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0")
  ]

  return components.join(sep);
}