import { describe, it, expect } from 'vitest';
import {
  validateRespiratoryRateInput,
  isValidRespiratoryRateInput,
  getRespiratoryRateCategory,
  parseRespiratoryRateValue,
  RESPIRATORY_RATE_LIMITS,
} from '../../components/vital-signs/validations/respiratory-rate-validations';

describe('validateRespiratoryRateInput', () => {
  it('returns null for normal rate (16)', () => {
    expect(validateRespiratoryRateInput('16')).toBeNull();
    expect(validateRespiratoryRateInput(16)).toBeNull();
  });

  it('returns null at lower boundary (8)', () => {
    expect(validateRespiratoryRateInput('8')).toBeNull();
  });

  it('returns null at upper boundary (40)', () => {
    expect(validateRespiratoryRateInput('40')).toBeNull();
  });

  it('returns error for value below MIN (7)', () => {
    expect(validateRespiratoryRateInput('7')).toContain('8-40');
  });

  it('returns error for value above MAX (41)', () => {
    expect(validateRespiratoryRateInput('41')).toContain('8-40');
  });

  it('returns error for non-numeric input', () => {
    expect(validateRespiratoryRateInput('abc')).not.toBeNull();
  });
});

describe('isValidRespiratoryRateInput', () => {
  it('returns true for empty string (allows clearing)', () => {
    expect(isValidRespiratoryRateInput('')).toBe(true);
  });

  it('returns true for valid numeric string', () => {
    expect(isValidRespiratoryRateInput('16')).toBe(true);
  });

  it('returns false for non-numeric string', () => {
    expect(isValidRespiratoryRateInput('abc')).toBe(false);
  });

  it('returns false for decimal input', () => {
    expect(isValidRespiratoryRateInput('16.5')).toBe(false);
  });

  it('returns true at MAX boundary (40)', () => {
    expect(isValidRespiratoryRateInput('40')).toBe(true);
  });

  it('returns false above MAX (41)', () => {
    expect(isValidRespiratoryRateInput('41')).toBe(false);
  });
});

describe('getRespiratoryRateCategory', () => {
  it('returns null for zero (falsy)', () => {
    expect(getRespiratoryRateCategory(0)).toBeNull();
  });

  it('returns null for null', () => {
    expect(getRespiratoryRateCategory(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getRespiratoryRateCategory('')).toBeNull();
  });

  it('returns Elevated for rate > 18 (tachypnea)', () => {
    expect(getRespiratoryRateCategory(22)).toEqual({ category: 'Elevated' });
    expect(getRespiratoryRateCategory('25')).toEqual({ category: 'Elevated' });
  });

  it('returns Low for rate < 12 (bradypnea)', () => {
    expect(getRespiratoryRateCategory(10)).toEqual({ category: 'Low' });
    expect(getRespiratoryRateCategory('8')).toEqual({ category: 'Low' });
  });

  it('returns Normal for rate 12-18', () => {
    expect(getRespiratoryRateCategory(16)).toEqual({ category: 'Normal' });
    expect(getRespiratoryRateCategory('14')).toEqual({ category: 'Normal' });
  });

  it('boundary: exactly 18 is Normal (not > 18)', () => {
    expect(getRespiratoryRateCategory(18)).toEqual({ category: 'Normal' });
  });

  it('boundary: exactly 12 is Normal (not < 12)', () => {
    expect(getRespiratoryRateCategory(12)).toEqual({ category: 'Normal' });
  });
});

describe('parseRespiratoryRateValue', () => {
  it('parses valid string', () => {
    expect(parseRespiratoryRateValue('16')).toBe(16);
  });

  it('parses number input', () => {
    expect(parseRespiratoryRateValue(16)).toBe(16);
  });

  it('returns null for non-numeric', () => {
    expect(parseRespiratoryRateValue('abc')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseRespiratoryRateValue('')).toBeNull();
  });
});
