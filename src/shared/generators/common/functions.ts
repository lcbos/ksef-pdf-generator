import { FP as FP2 } from '../../../lib-public/types/fa2.types';
import packageInfo from '../../../../package.json';
import i18n from 'i18next';

/** Polish civil time for PDF; avoids Date#getHours() which follows process TZ (e.g. UTC in Docker). */
const DISPLAY_TZ = 'Europe/Warsaw';

function getWarsawDateOnly(date: Date): { day: string; month: string; year: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      m[p.type] = p.value;
    }
  }
  return { day: m.day ?? '', month: m.month ?? '', year: m.year ?? '' };
}

function getWarsawParts(date: Date, includeSeconds: boolean): Record<string, string> {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: DISPLAY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(includeSeconds ? { second: '2-digit' } : {}),
  };
  const parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      m[p.type] = p.value;
    }
  }
  return m;
}

export function translateMap(value: FP2 | string | undefined, map: Record<string, string>): string {
  let valueToTranslate = typeof value === 'string' ? value : value?._text;

  valueToTranslate = valueToTranslate?.trim();
  if (!valueToTranslate || !map[valueToTranslate]) {
    return '';
  }
  return i18n.t(map[valueToTranslate]);
}

export function formatDateTime(data?: string, withoutSeconds?: boolean, withoutTime?: boolean): string {
  if (!data) {
    return '';
  }
  const dateTime: Date = new Date(data);

  if (isNaN(dateTime.getTime())) {
    return data;
  }

  if (withoutTime) {
    const { day, month, year } = getWarsawDateOnly(dateTime);
    return `${day}.${month}.${year}`;
  }

  const withSec = !withoutSeconds;
  const p = getWarsawParts(dateTime, withSec);
  const { day, month, year, hour, minute, second } = p;

  if (withoutSeconds) {
    return `${day}.${month}.${year} ${hour}:${minute}`;
  }
  return `${day}.${month}.${year} ${hour}:${minute}:${second ?? '00'}`;
}

export function formatDateTimePl(value: string, withTime?: boolean, withSeconds?: boolean): string {
  const optionsForDate: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const optionsForTime: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  const optionsForSeconds: Intl.DateTimeFormatOptions = { second: '2-digit' };

  if (!value) {
    return '';
  }
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pl-PL', {
    timeZone: 'Europe/Warsaw',
    ...optionsForDate,
    ...(withTime && optionsForTime),
    ...(withSeconds && optionsForSeconds),
  })
    .format(date)
    .replace(', ', ' ');
}

export function getDateTimeWithoutSeconds(isoDate?: FP2): string {
  if (!isoDate?._text) {
    return '';
  }
  return formatDateTimePl(isoDate._text, true);
}

export function formatTime(data?: string, withoutSeconds?: boolean): string {
  if (!data) {
    return '';
  }
  const dateTime: Date = new Date(data);

  if (isNaN(dateTime.getTime())) {
    return data;
  }

  const withSec = !withoutSeconds;
  const p = getWarsawParts(dateTime, withSec);
  const hour = p.hour ?? '';
  const minute = p.minute ?? '';
  const second = p.second ?? '00';

  if (withoutSeconds) {
    return `${hour}:${minute}`;
  }
  return `${hour}:${minute}:${second}`;
}

export function createVersionLabel(application?: string): string {
  return `${application || i18n.t('invoice.footer.appName')} (ksef-pdf-generator - ${i18n.t('invoice.footer.version')} ${packageInfo.version})`;
}

export function unwrapText(value: any): any {
  if (value == null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(unwrapText);
  }

  if (typeof value === 'object') {
    if ('_text' in value) {
      return unwrapText(value._text);
    }

    const result: any = {};

    for (const key in value) {
      if (key === '_attributes' || key === '_comment') {
        continue;
      }
      result[key] = unwrapText(value[key]);
    }

    return result;
  }

  return value;
}

export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: readonly K[]): any {
  const result: any = {};

  for (const key of keys) {
    result[key] = unwrapText(obj[key]);
  }

  return result;
}

export function hasAnyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some(hasAnyValue);
  }

  if (typeof value === 'object') {
    return Object.values(value).some(hasAnyValue);
  }

  return true;
}
