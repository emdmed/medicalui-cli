import { describe, it, expect } from 'vitest';
import {
  safeParseFloat,
  calculateInsensibleLoss,
  calculateEndogenousGeneration,
  calculateDefecationLoss,
  calculateWaterBalance,
} from '../../components/water-balance/lib';

describe('safeParseFloat', () => {
  it('returns 0 for empty string', () => {
    expect(safeParseFloat('')).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(safeParseFloat(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(safeParseFloat(undefined)).toBe(0);
  });

  it('returns 0 for NaN string', () => {
    expect(safeParseFloat('abc')).toBe(0);
  });

  it('parses valid number string', () => {
    expect(safeParseFloat('70')).toBe(70);
  });

  it('parses valid float string', () => {
    expect(safeParseFloat('70.5')).toBe(70.5);
  });

  it('parses numeric input directly', () => {
    expect(safeParseFloat(70)).toBe(70);
  });
});

describe('calculateInsensibleLoss', () => {
  it('calculates for standard 70kg patient: 70 × 12 = 840 mL', () => {
    expect(calculateInsensibleLoss(70)).toBe('840');
  });

  it('returns 0 for zero weight', () => {
    expect(calculateInsensibleLoss(0)).toBe('0');
  });

  it('handles string input', () => {
    expect(calculateInsensibleLoss('70')).toBe('840');
  });

  it('handles empty/null input gracefully', () => {
    expect(calculateInsensibleLoss('')).toBe('0');
    expect(calculateInsensibleLoss(null)).toBe('0');
  });
});

describe('calculateEndogenousGeneration', () => {
  it('calculates for standard 70kg patient: 70 × 4.5 = 315 mL', () => {
    expect(calculateEndogenousGeneration(70)).toBe('315');
  });

  it('returns 0 for zero weight', () => {
    expect(calculateEndogenousGeneration(0)).toBe('0');
  });
});

describe('calculateDefecationLoss', () => {
  it('calculates for 2 stools: 2 × 120 = 240 mL', () => {
    expect(calculateDefecationLoss(2)).toBe('240');
  });

  it('returns 0 for zero stools', () => {
    expect(calculateDefecationLoss(0)).toBe('0');
  });

  it('handles string input', () => {
    expect(calculateDefecationLoss('3')).toBe('360');
  });
});

describe('calculateWaterBalance', () => {
  it('calculates net balance for standard 70kg patient', () => {
    const result = calculateWaterBalance('70', '1500', '500', '1200', '2');
    expect(result).toBe('35');
  });

  it('returns negative balance when output exceeds intake', () => {
    const result = calculateWaterBalance('70', '500', '0', '1500', '1');
    expect(parseInt(result)).toBeLessThan(0);
  });

  it('handles zero weight (only oral + IV intake, only diuresis + defecation output)', () => {
    const result = calculateWaterBalance('0', '1000', '500', '800', '1');
    expect(result).toBe('580');
  });

  it('handles all empty inputs gracefully', () => {
    const result = calculateWaterBalance('', '', '', '', '');
    expect(result).toBe('0');
  });
});
