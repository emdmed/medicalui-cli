import { describe, it, expect } from 'vitest';
import {
  validateHeartRateInput,
  getHeartRateCategory,
  parseHeartRateValue,
  HEART_RATE_LIMITS,
} from '../../components/vital-signs/validations/heart-rate-validations';

describe('validateHeartRateInput', () => {
  it('returns true for normal heart rate (72)', () => {
    expect(validateHeartRateInput('72')).toBe(true);
  });

  it('returns true for tachycardia range (110)', () => {
    expect(validateHeartRateInput('110')).toBe(true);
  });

  it('returns true for bradycardia range (50)', () => {
    expect(validateHeartRateInput('50')).toBe(true);
  });

  it('returns true at lower boundary (30)', () => {
    expect(validateHeartRateInput('30')).toBe(true);
  });

  it('returns true at upper boundary (220)', () => {
    expect(validateHeartRateInput('220')).toBe(true);
  });

  it('returns false below minimum (29)', () => {
    expect(validateHeartRateInput('29')).toBe(false);
  });

  it('returns false above maximum (221)', () => {
    expect(validateHeartRateInput('221')).toBe(false);
  });

  it('returns false for non-numeric input', () => {
    expect(validateHeartRateInput('abc')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateHeartRateInput('')).toBe(false);
  });

  it('returns false for negative values', () => {
    expect(validateHeartRateInput('-50')).toBe(false);
  });

  it('returns false for extremely large values', () => {
    expect(validateHeartRateInput('500')).toBe(false);
    expect(validateHeartRateInput('99999')).toBe(false);
  });

});

describe('getHeartRateCategory', () => {
  it('returns null for null', () => {
    expect(getHeartRateCategory(null)).toBeNull();
  });

  it('returns null for zero (falsy)', () => {
    expect(getHeartRateCategory(0)).toBeNull();
  });

  it('returns Elevated for heart rate > 100', () => {
    expect(getHeartRateCategory(110)).toEqual({ category: 'Elevated' });
    expect(getHeartRateCategory(101)).toEqual({ category: 'Elevated' });
  });

  it('returns Low for heart rate < 60', () => {
    expect(getHeartRateCategory(50)).toEqual({ category: 'Low' });
    expect(getHeartRateCategory(59)).toEqual({ category: 'Low' });
  });

  it('returns Normal for heart rate 60-100', () => {
    expect(getHeartRateCategory(72)).toEqual({ category: 'Normal' });
    expect(getHeartRateCategory(60)).toEqual({ category: 'Normal' });
    expect(getHeartRateCategory(100)).toEqual({ category: 'Normal' });
  });

  it('boundary: exactly 100 is Normal (not > 100)', () => {
    expect(getHeartRateCategory(100)).toEqual({ category: 'Normal' });
  });

  it('boundary: exactly 60 is Normal (not < 60)', () => {
    expect(getHeartRateCategory(60)).toEqual({ category: 'Normal' });
  });
});

describe('parseHeartRateValue', () => {
  it('parses valid integer string', () => {
    expect(parseHeartRateValue('72')).toBe(72);
  });

  it('returns null for non-numeric string', () => {
    expect(parseHeartRateValue('abc')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseHeartRateValue('')).toBeNull();
  });

  it('truncates decimal values (parseInt behavior)', () => {
    expect(parseHeartRateValue('72.9')).toBe(72);
  });
});
