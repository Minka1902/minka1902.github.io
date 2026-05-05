import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format, startOfDay, endOfDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toMs    = (date: Date) => date.getTime();
export const fromMs  = (ms: number) => new Date(ms);
export const dayStart = (ms: number) => startOfDay(fromMs(ms)).getTime();
export const dayEnd   = (ms: number) => endOfDay(fromMs(ms)).getTime();
export const timeAgo  = (ms: number) => formatDistanceToNow(fromMs(ms), { addSuffix: true });
export const fmtDate  = (ms: number) => format(fromMs(ms), 'MMM d, yyyy');
export const fmtTime  = (ms: number) => format(fromMs(ms), 'h:mm a');
