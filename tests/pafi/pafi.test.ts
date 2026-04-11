import { describe, it, expect } from 'vitest';
import { calculatePaFi, getPaFiClassification, getPaFiSeverity } from '../../components/pafi/lib';

describe('calculatePaFi', () => {
  it('calculates PaFi for PaO2 90, FiO2 21%: 90 / 0.21 = 429', () => {
    const result = calculatePaFi('90', '21');
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeCloseTo(429, 0);
  });

  it('calculates PaFi for PaO2 60, FiO2 40%: 60 / 0.40 = 150', () => {
    const result = calculatePaFi('60', '40');
    expect(result).toBe('150');
  });

  it('calculates PaFi for PaO2 80, FiO2 100%: 80 / 1.0 = 80', () => {
    const result = calculatePaFi('80', '100');
    expect(result).toBe('80');
  });

  it('calculates PaFi for PaO2 100, FiO2 21%: 100 / 0.21 = 476', () => {
    const result = calculatePaFi('100', '21');
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeCloseTo(476, 0);
  });

  it('calculates PaFi for PaO2 55, FiO2 50%: 55 / 0.50 = 110', () => {
    const result = calculatePaFi('55', '50');
    expect(result).toBe('110');
  });

  it('calculates PaFi for PaO2 200, FiO2 100%: 200 / 1.0 = 200', () => {
    const result = calculatePaFi('200', '100');
    expect(result).toBe('200');
  });

  it('calculates PaFi for PaO2 300, FiO2 100%: 300 / 1.0 = 300', () => {
    const result = calculatePaFi('300', '100');
    expect(result).toBe('300');
  });

  it('returns null for zero PaO2', () => {
    expect(calculatePaFi('0', '21')).toBeNull();
  });

  it('returns null for negative PaO2', () => {
    expect(calculatePaFi('-10', '21')).toBeNull();
  });

  it('returns null for empty PaO2', () => {
    expect(calculatePaFi('', '21')).toBeNull();
  });

  it('returns null for FiO2 below 21%', () => {
    expect(calculatePaFi('90', '20')).toBeNull();
  });

  it('returns null for FiO2 above 100%', () => {
    expect(calculatePaFi('90', '101')).toBeNull();
  });

  it('returns null for zero FiO2', () => {
    expect(calculatePaFi('90', '0')).toBeNull();
  });

  it('returns null for negative FiO2', () => {
    expect(calculatePaFi('90', '-5')).toBeNull();
  });

  it('returns null for empty FiO2', () => {
    expect(calculatePaFi('90', '')).toBeNull();
  });

  it('returns null for non-numeric PaO2', () => {
    expect(calculatePaFi('abc', '21')).toBeNull();
  });

  it('returns null for non-numeric FiO2', () => {
    expect(calculatePaFi('90', 'abc')).toBeNull();
  });

  it('accepts FiO2 at exactly 21% (minimum)', () => {
    expect(calculatePaFi('90', '21')).not.toBeNull();
  });

  it('accepts FiO2 at exactly 100% (maximum)', () => {
    expect(calculatePaFi('90', '100')).not.toBeNull();
  });
});

describe('getPaFiClassification', () => {
  it('returns Normal for PaFi > 300', () => {
    expect(getPaFiClassification('301')).toBe('Normal');
    expect(getPaFiClassification('429')).toBe('Normal');
    expect(getPaFiClassification('500')).toBe('Normal');
  });

  it('returns Mild ARDS for PaFi 200-300', () => {
    expect(getPaFiClassification('300')).toBe('Mild ARDS');
    expect(getPaFiClassification('250')).toBe('Mild ARDS');
    expect(getPaFiClassification('200')).toBe('Mild ARDS');
  });

  it('returns Moderate ARDS for PaFi 100-199', () => {
    expect(getPaFiClassification('199')).toBe('Moderate ARDS');
    expect(getPaFiClassification('150')).toBe('Moderate ARDS');
    expect(getPaFiClassification('100')).toBe('Moderate ARDS');
  });

  it('returns Severe ARDS for PaFi < 100', () => {
    expect(getPaFiClassification('99')).toBe('Severe ARDS');
    expect(getPaFiClassification('50')).toBe('Severe ARDS');
    expect(getPaFiClassification('0')).toBe('Severe ARDS');
  });

  it('returns Unknown for null', () => {
    expect(getPaFiClassification(null)).toBe('Unknown');
  });

  it('returns Unknown for non-numeric string', () => {
    expect(getPaFiClassification('abc')).toBe('Unknown');
  });
});

describe('getPaFiSeverity', () => {
  it('returns normal for PaFi > 300', () => {
    expect(getPaFiSeverity('400')).toBe('normal');
  });

  it('returns mild for PaFi 200-300', () => {
    expect(getPaFiSeverity('250')).toBe('mild');
  });

  it('returns moderate for PaFi 100-199', () => {
    expect(getPaFiSeverity('150')).toBe('moderate');
  });

  it('returns severe for PaFi < 100', () => {
    expect(getPaFiSeverity('50')).toBe('severe');
  });

  it('returns default for null', () => {
    expect(getPaFiSeverity(null)).toBe('default');
  });
});
