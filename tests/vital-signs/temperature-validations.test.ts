import { describe, it, expect } from 'vitest';
import {
  validateTemperatureInput,
  isElevatedTemperature,
  isLowTemperature,
  getTemperatureStatus,
  parseTemperatureValue,
  getTemperatureLimits,
  TEMPERATURE_LIMITS,
} from '../../components/vital-signs/validations/temperature-validations';

describe('validateTemperatureInput', () => {
  it('returns true for empty/falsy value (allows clearing)', () => {
    expect(validateTemperatureInput('')).toBe(true);
    expect(validateTemperatureInput(0)).toBe(true);
  });

  it('returns true for normal Fahrenheit (98.6)', () => {
    expect(validateTemperatureInput('98.6', true)).toBe(true);
  });

  it('returns true for normal Celsius (37)', () => {
    expect(validateTemperatureInput('37', false)).toBe(true);
  });

  it('returns true at Fahrenheit boundaries (95-107)', () => {
    expect(validateTemperatureInput('95', true)).toBe(true);
    expect(validateTemperatureInput('107', true)).toBe(true);
  });

  it('returns true at Celsius boundaries (35-42)', () => {
    expect(validateTemperatureInput('35', false)).toBe(true);
    expect(validateTemperatureInput('42', false)).toBe(true);
  });

  it('returns false for Fahrenheit below MIN', () => {
    expect(validateTemperatureInput('94', true)).toBe(false);
  });

  it('returns false for Fahrenheit above MAX', () => {
    expect(validateTemperatureInput('108', true)).toBe(false);
  });

  it('returns false for Celsius below MIN', () => {
    expect(validateTemperatureInput('34', false)).toBe(false);
  });

  it('returns false for Celsius above MAX', () => {
    expect(validateTemperatureInput('43', false)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(validateTemperatureInput('abc', true)).toBe(false);
  });
});

describe('isElevatedTemperature', () => {
  it('returns true for fever in Fahrenheit (101)', () => {
    expect(isElevatedTemperature('101', true)).toBe(true);
  });

  it('returns true at exact Fahrenheit fever threshold (100.4)', () => {
    expect(isElevatedTemperature('100.4', true)).toBe(true);
  });

  it('returns false just below Fahrenheit fever threshold (100.3)', () => {
    expect(isElevatedTemperature('100.3', true)).toBe(false);
  });

  it('returns true for fever in Celsius (38.5)', () => {
    expect(isElevatedTemperature('38.5', false)).toBe(true);
  });

  it('returns true at exact Celsius fever threshold (38.0)', () => {
    expect(isElevatedTemperature('38', false)).toBe(true);
  });

  it('returns false just below Celsius fever threshold (37.9)', () => {
    expect(isElevatedTemperature('37.9', false)).toBe(false);
  });

  it('returns false for falsy value', () => {
    expect(isElevatedTemperature('', true)).toBe(false);
    expect(isElevatedTemperature(0, true)).toBe(false);
  });
});

describe('isLowTemperature', () => {
  it('returns true for hypothermia in Fahrenheit (94)', () => {
    expect(isLowTemperature('94', true)).toBe(true);
  });

  it('returns false at exact Fahrenheit low threshold (95)', () => {
    expect(isLowTemperature('95', true)).toBe(false);
  });

  it('returns true just below Fahrenheit low threshold (94.9)', () => {
    expect(isLowTemperature('94.9', true)).toBe(true);
  });

  it('returns true for hypothermia in Celsius (34.5)', () => {
    expect(isLowTemperature('34.5', false)).toBe(true);
  });

  it('returns false at exact Celsius low threshold (35)', () => {
    expect(isLowTemperature('35', false)).toBe(false);
  });

  it('returns false for falsy value', () => {
    expect(isLowTemperature('', true)).toBe(false);
  });
});

describe('getTemperatureStatus', () => {
  it('returns fever status for elevated temperature', () => {
    const result = getTemperatureStatus('101', true);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('fever');
    expect(result!.label).toBe('Fever');
  });

  it('returns hypothermia status for low temperature', () => {
    const result = getTemperatureStatus('94', true);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('hypothermia');
    expect(result!.label).toBe('Low');
  });

  it('returns null for normal temperature', () => {
    expect(getTemperatureStatus('98.6', true)).toBeNull();
    expect(getTemperatureStatus('37', false)).toBeNull();
  });

  it('works with Celsius values', () => {
    const fever = getTemperatureStatus('39', false);
    expect(fever!.type).toBe('fever');

    const hypo = getTemperatureStatus('34', false);
    expect(hypo!.type).toBe('hypothermia');
  });
});

describe('parseTemperatureValue', () => {
  it('parses valid float string', () => {
    expect(parseTemperatureValue('98.6')).toBe(98.6);
  });

  it('parses number input', () => {
    expect(parseTemperatureValue(37)).toBe(37);
  });

  it('returns null for falsy value', () => {
    expect(parseTemperatureValue('')).toBeNull();
    expect(parseTemperatureValue(0)).toBeNull();
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseTemperatureValue('abc')).toBe(0);
  });
});

describe('getTemperatureLimits', () => {
  it('returns Fahrenheit limits by default', () => {
    const limits = getTemperatureLimits();
    expect(limits).toEqual(TEMPERATURE_LIMITS.FAHRENHEIT);
    expect(limits.FEVER).toBe(100.4);
  });

  it('returns Fahrenheit limits when true', () => {
    const limits = getTemperatureLimits(true);
    expect(limits.MIN).toBe(95);
    expect(limits.MAX).toBe(107);
  });

  it('returns Celsius limits when false', () => {
    const limits = getTemperatureLimits(false);
    expect(limits).toEqual(TEMPERATURE_LIMITS.CELSIUS);
    expect(limits.FEVER).toBe(38.0);
    expect(limits.MIN).toBe(35);
    expect(limits.MAX).toBe(42);
  });
});
