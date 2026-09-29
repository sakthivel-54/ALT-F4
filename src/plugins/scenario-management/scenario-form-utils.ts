import { getEl } from '@app/engine/utils/get-el';
import { ScenarioData } from './scenario-management';

const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)?(?:Z)?$/u;

/**
 * Parses a flexible date string (YYYY-MM-DD with optional time and fractional seconds) into a UTC Date.
 */
export function parseDateString(rawStr: string): Date | null {
  if (!rawStr || !rawStr.trim()) {
    return null;
  }
  const str = rawStr.trim();
  const dateMatch = str.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?)?(?:Z)?$/iu);

  if (!dateMatch) {
    return null;
  }

  const ymd = dateMatch[1];
  const hm = dateMatch[2] || '00:00';
  const s = dateMatch[3] || '00';
  const ms = (dateMatch[4] || '000').padEnd(3, '0').slice(0, 3);
  const d = new Date(`${ymd}T${hm}:${s}.${ms}Z`);

  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date object into the canonical YYYY-MM-DD HH:MM:SS.sss UTC format.
 */
export function formatDateForInput(d: Date): string {
  return d.toISOString().replace('T', ' ').replace('Z', '');
}

/**
 * Validates a date input field against standard YYYY-MM-DD format (with optional time).
 * Toggles valid/invalid CSS classes on the input element.
 */
export function validateDateInput(input: HTMLInputElement): boolean {
  const dateStr = input.value.trim();

  if (!dateStr) {
    input.classList.remove('invalid');
    input.classList.remove('valid');

    return true;
  }

  const isValid = DATE_FORMAT_REGEX.test(dateStr) && parseDateString(dateStr) !== null;

  if (!isValid) {
    input.classList.remove('valid');
    input.classList.add('invalid');
  } else {
    input.classList.remove('invalid');
    input.classList.add('valid');
  }

  return isValid;
}

/**
 * Syncs side-menu form fields with the current scenario data.
 * Tolerates missing DOM elements (menu may not be open).
 */
export function syncFormFields(formPrefix: string, scenario: ScenarioData): void {
  const nameEl = getEl(`${formPrefix}-name`, true) as HTMLInputElement | null;

  if (nameEl) {
    nameEl.value = scenario.name;
  }

  const descEl = getEl(`${formPrefix}-description`, true) as HTMLInputElement | null;

  if (descEl) {
    descEl.value = scenario.description;
  }

  const startEl = getEl(`${formPrefix}-start-date`, true) as HTMLInputElement | null;

  if (startEl) {
    startEl.value = scenario.startTime ? formatDateForInput(scenario.startTime) : '';
  }

  const endEl = getEl(`${formPrefix}-end-date`, true) as HTMLInputElement | null;

  if (endEl) {
    endEl.value = scenario.endTime ? formatDateForInput(scenario.endTime) : '';
  }
}
