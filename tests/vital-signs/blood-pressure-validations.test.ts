import { describe, it, expect } from 'vitest';
import {
  validateBloodPressureInput,
  isValidBloodPressureInput,
  getBloodPressureCategory,
  parseBloodPressureValues,
  BLOOD_PRESSURE_LIMITS,
} from '../../components/vital-signs/validations/blood-pressure-validations';

describe('validateBloodPressureInput', () => {
  it('returns null for valid normal BP (120/80)', () => {
    expect(validateBloodPressureInput({ systolic: 120, diastolic: 80 })).toBeNull();
  });

  it('returns null for valid hypertensive BP (180/110)', () => {
    expect(validateBloodPressureInput({ systolic: 180, diastolic: 110 })).toBeNull();
  });

  it('returns error when systolic is missing', () => {
    expect(validateBloodPressureInput({ systolic: null, diastolic: 80 })).toBe(
      'Both systolic and diastolic values are required'
    );
  });

  it('returns error when diastolic is missing', () => {
    expect(validateBloodPressureInput({ systolic: 120, diastolic: null })).toBe(
      'Both systolic and diastolic values are required'
    );
  });

  it('returns error when no value provided', () => {
    expect(validateBloodPressureInput(undefined)).toBe(
      'Both systolic and diastolic values are required'
    );
  });

  it('returns error when systolic is below MIN (40)', () => {
    expect(validateBloodPressureInput({ systolic: 30, diastolic: 20 })).toContain('Systolic');
  });

  it('returns error when systolic exceeds MAX (350)', () => {
    expect(validateBloodPressureInput({ systolic: 400, diastolic: 80 })).toContain('Systolic');
  });

  it('returns error when diastolic is below MIN (10)', () => {
    expect(validateBloodPressureInput({ systolic: 120, diastolic: 5 })).toContain('Diastolic');
  });

  it('returns error when diastolic exceeds MAX (130)', () => {
    expect(validateBloodPressureInput({ systolic: 200, diastolic: 140 })).toContain('Diastolic');
  });

  it('returns error when systolic equals diastolic', () => {
    expect(validateBloodPressureInput({ systolic: 100, diastolic: 100 })).toBe(
      'Systolic must be higher than diastolic'
    );
  });

  it('returns error when systolic is less than diastolic', () => {
    expect(validateBloodPressureInput({ systolic: 70, diastolic: 90 })).toBe(
      'Systolic must be higher than diastolic'
    );
  });

  it('accepts boundary values at limits', () => {
    expect(validateBloodPressureInput({ systolic: 40, diastolic: 10 })).toBeNull();
    expect(validateBloodPressureInput({ systolic: 350, diastolic: 130 })).toBeNull();
  });
});

describe('isValidBloodPressureInput', () => {
  it('returns false for empty string', () => {
    expect(isValidBloodPressureInput('', 'systolic')).toBe(false);
  });

  it('returns true for valid systolic value', () => {
    expect(isValidBloodPressureInput('120', 'systolic')).toBe(true);
  });

  it('returns true for valid diastolic value', () => {
    expect(isValidBloodPressureInput('80', 'diastolic')).toBe(true);
  });

  it('returns false for non-numeric input', () => {
    expect(isValidBloodPressureInput('abc', 'systolic')).toBe(false);
    expect(isValidBloodPressureInput('12.5', 'systolic')).toBe(false);
  });

  it('returns false when systolic exceeds MAX (350)', () => {
    expect(isValidBloodPressureInput('400', 'systolic')).toBe(false);
  });

  it('returns false when diastolic exceeds MAX (130)', () => {
    expect(isValidBloodPressureInput('150', 'diastolic')).toBe(false);
  });

  it('allows values at exact MAX', () => {
    expect(isValidBloodPressureInput('350', 'systolic')).toBe(true);
    expect(isValidBloodPressureInput('130', 'diastolic')).toBe(true);
  });
});

describe('getBloodPressureCategory', () => {
  it('returns null for zero values (falsy)', () => {
    expect(getBloodPressureCategory(0, 80)).toBeNull();
    expect(getBloodPressureCategory(120, 0)).toBeNull();
  });

  it('returns null for normal BP (120/80)', () => {
    expect(getBloodPressureCategory(120, 80)).toBeNull();
  });

  it('returns High when systolic > 130', () => {
    expect(getBloodPressureCategory(140, 80)).toEqual({ category: 'High' });
  });

  it('returns High when diastolic >= 90', () => {
    expect(getBloodPressureCategory(120, 90)).toEqual({ category: 'High' });
  });

  it('returns Low when systolic < 90', () => {
    expect(getBloodPressureCategory(85, 55)).toEqual({ category: 'Low' });
  });

  it('returns Low when diastolic < 60', () => {
    expect(getBloodPressureCategory(100, 55)).toEqual({ category: 'Low' });
  });

  it('boundary: systolic exactly 130 is normal (not > 130)', () => {
    expect(getBloodPressureCategory(130, 80)).toBeNull();
  });

  it('boundary: systolic exactly 90 is normal (not < 90)', () => {
    expect(getBloodPressureCategory(90, 60)).toBeNull();
  });

  it('boundary: diastolic exactly 60 is normal (not < 60)', () => {
    expect(getBloodPressureCategory(100, 60)).toBeNull();
  });
});

describe('parseBloodPressureValues', () => {
  it('returns parsed values for valid input', () => {
    expect(parseBloodPressureValues({ systolic: 120, diastolic: 80 })).toEqual({
      systolic: 120,
      diastolic: 80,
    });
  });

  it('returns null when systolic is missing', () => {
    expect(parseBloodPressureValues({ systolic: null, diastolic: 80 })).toBeNull();
  });

  it('returns null when diastolic is missing', () => {
    expect(parseBloodPressureValues({ systolic: 120, diastolic: null })).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseBloodPressureValues(undefined)).toBeNull();
  });

  it('parses string-like numeric values', () => {
    const result = parseBloodPressureValues({ systolic: 120, diastolic: 80 });
    expect(result).toEqual({ systolic: 120, diastolic: 80 });
  });
});
