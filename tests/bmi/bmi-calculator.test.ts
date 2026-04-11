import { describe, it, expect } from 'vitest';
import { calculateBMI, getBMICategory } from '../../components/bmi/lib';

describe('calculateBMI — imperial', () => {
  it('calculates BMI for 154 lbs, 5\'9"', () => {
    const bmi = calculateBMI('154', '5', '9', '', false);
    expect(bmi).not.toBeNull();
    expect(parseFloat(bmi!)).toBeCloseTo(22.7, 0);
  });

  it('calculates BMI for 200 lbs, 5\'10"', () => {
    const bmi = calculateBMI('200', '5', '10', '', false);
    expect(parseFloat(bmi!)).toBeCloseTo(28.7, 0);
  });

  it('returns null for zero weight', () => {
    expect(calculateBMI('0', '5', '9', '', false)).toBeNull();
  });

  it('returns null for zero height', () => {
    expect(calculateBMI('154', '0', '0', '', false)).toBeNull();
  });

  it('handles feet only (no inches)', () => {
    const bmi = calculateBMI('154', '5', '0', '', false);
    expect(bmi).not.toBeNull();
  });

  it('handles inches only (no feet)', () => {
    const bmi = calculateBMI('154', '0', '69', '', false);
    expect(bmi).not.toBeNull();
  });
});

describe('calculateBMI — metric', () => {
  it('calculates BMI for 70kg, 1.75m', () => {
    const bmi = calculateBMI('70', '', '', '1.75', true);
    expect(bmi).not.toBeNull();
    expect(parseFloat(bmi!)).toBeCloseTo(22.9, 0);
  });

  it('calculates BMI for 100kg, 1.80m', () => {
    const bmi = calculateBMI('100', '', '', '1.80', true);
    expect(parseFloat(bmi!)).toBeCloseTo(30.9, 0);
  });

  it('returns null for zero height in metric', () => {
    expect(calculateBMI('70', '', '', '0', true)).toBeNull();
  });

  it('returns null for negative weight', () => {
    expect(calculateBMI('-10', '', '', '1.75', true)).toBeNull();
  });
});

describe('getBMICategory', () => {
  it('returns Underweight for BMI < 18.5', () => {
    expect(getBMICategory('17.0')).toBe('Underweight');
    expect(getBMICategory('18.4')).toBe('Underweight');
  });

  it('returns Normal for BMI 18.5-24.9', () => {
    expect(getBMICategory('18.5')).toBe('Normal');
    expect(getBMICategory('22.0')).toBe('Normal');
    expect(getBMICategory('24.9')).toBe('Normal');
  });

  it('returns Overweight for BMI 25-29.9', () => {
    expect(getBMICategory('25.0')).toBe('Overweight');
    expect(getBMICategory('27.0')).toBe('Overweight');
    expect(getBMICategory('29.9')).toBe('Overweight');
  });

  it('returns Obese for BMI >= 30', () => {
    expect(getBMICategory('30.0')).toBe('Obese');
    expect(getBMICategory('35.0')).toBe('Obese');
  });

  it('returns Unknown for null', () => {
    expect(getBMICategory(null)).toBe('Unknown');
  });
});
