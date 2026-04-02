import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the correct application URL for auth redirects
 * Checks VITE_APP_URL env first, falls back to window.location.origin
 */
export function getAppUrl(): string {
  const env = import.meta.env.VITE_APP_URL?.trim();
  if (env) {
    return env.replace(/\/+$/, ''); // Remove trailing slashes
  }
  return window.location.origin;
}
