/**
 * Time and Timezone Formatting Utilities for TraceX Platform.
 * 
 * Requirement:
 * - Format camera clock and telemetry explicitly in Asia/Kolkata (IST).
 * - Keep stored timestamps in UTC (ISO-8601).
 * - Show applicable timezone (IST / UTC+5:30) wherever camera events and vehicle sightings are compared.
 */

export const TIMEZONE_IST = 'Asia/Kolkata';

export const formatClockIST = (date: Date = new Date()): { timeStr: string; ms: string; tzLabel: string } => {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE_IST,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);

  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return {
    timeStr: `${parts}.${ms}`,
    ms,
    tzLabel: 'IST (UTC+5:30)',
  };
};

export const formatTimeIST = (
  timestamp: Date | string | number | null | undefined,
  includeSeconds: boolean = true
): string => {
  if (!timestamp) return '—';
  let d: Date;
  if (typeof timestamp === 'number') {
    // Check if epoch seconds vs epoch ms
    d = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
  } else {
    d = new Date(timestamp);
  }

  if (isNaN(d.getTime())) return String(timestamp);

  const options: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_IST,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  };

  return `${new Intl.DateTimeFormat('en-IN', options).format(d)} IST`;
};

export const formatDateTimeIST = (
  timestamp: Date | string | number | null | undefined
): string => {
  if (!timestamp) return '—';
  let d: Date;
  if (typeof timestamp === 'number') {
    d = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
  } else {
    d = new Date(timestamp);
  }

  if (isNaN(d.getTime())) return String(timestamp);

  const options: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_IST,
    hour12: false,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  return `${new Intl.DateTimeFormat('en-IN', options).format(d)} IST`;
};
