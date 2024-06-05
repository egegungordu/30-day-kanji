import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function relativeTime(date: Date) {
  const diff = (date.getTime() - new Date().getTime()) / 1000
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow", localeMatcher: "best fit" })
  if (diff < 3600) {
    return fmt.format(Math.round(diff / 60), "minute")
  } else if (diff < 86400) {
    return fmt.format(Math.round(diff / 3600), "hour")
  } else if (diff < 2592000) {
    return fmt.format(Math.round(diff / 86400), "day")
  } else if (diff < 31536000) {
    return fmt.format(Math.round(diff / 2592000), "month")
  } else {
    return fmt.format(Math.round(diff / 31536000), "year")
  }
}

