/**
 * Indian RTO License Plate Format Validator.
 * Handles standard state prefixes, district numbers, and alphanumeric series.
 */

// Matches formats like: DL 01 AB 1234, DL01AB1234, HR-26-DK-9723, UP16BT4097
const INDIAN_PLATE_REGEX = /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,3}[ -]?[0-9]{4}$/i;

export interface PlateValidationResult {
  isValid: boolean;
  normalizedPlate: string;
  stateCode?: string;
  errorMessage?: string;
}

export function validateIndianPlate(input: string): PlateValidationResult {
  const clean = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!clean) {
    return { isValid: false, normalizedPlate: '', errorMessage: 'License plate cannot be empty' };
  }

  if (clean.length < 7 || clean.length > 10) {
    return { isValid: false, normalizedPlate: clean, errorMessage: 'Invalid plate length (7-10 chars expected)' };
  }

  if (!INDIAN_PLATE_REGEX.test(input)) {
    return { isValid: false, normalizedPlate: clean, errorMessage: 'Does not match standard Indian RTO format' };
  }

  const stateCode = clean.substring(0, 2);
  return {
    isValid: true,
    normalizedPlate: clean,
    stateCode,
  };
}
