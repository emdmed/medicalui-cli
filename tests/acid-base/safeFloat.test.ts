import { describe, it, expect } from 'vitest';
import { safeFloat } from '../../components/acid-base/utils/safeFloat';
import { safeParseFloat } from '../../components/water-balance/lib';

describe('safeFloat', () => {
  it('parses valid integer string', () => {
    expect(safeFloat('42')).toBe(42);
  });

  it('parses valid decimal string', () => {
    expect(safeFloat('7.40')).toBeCloseTo(7.4);
  });

  it('parses negative number', () => {
    expect(safeFloat('-3.5')).toBe(-3.5);
  });

  it('returns null for empty string', () => {
    expect(safeFloat('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(safeFloat('   ')).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(safeFloat('abc')).toBeNull();
  });

  it('trims whitespace before parsing', () => {
    expect(safeFloat('  7.4  ')).toBeCloseTo(7.4);
  });

  it('parses zero', () => {
    expect(safeFloat('0')).toBe(0);
  });
});

describe('safeFloat vs safeParseFloat — intentional behavior difference', () => {
  it('safeFloat returns null for empty string (missing lab values block calculation)', () => {
    expect(safeFloat('')).toBeNull();
  });

  it('safeParseFloat returns 0 for empty string (empty fluid fields contribute zero)', () => {
    expect(safeParseFloat('')).toBe(0);
  });

  it('safeFloat returns null for non-numeric input', () => {
    expect(safeFloat('abc')).toBeNull();
  });

  it('safeParseFloat returns 0 for non-numeric input', () => {
    expect(safeParseFloat('abc')).toBe(0);
  });

  it('both parse valid numbers identically', () => {
    expect(safeFloat('42')).toBe(42);
    expect(safeParseFloat('42')).toBe(42);
    expect(safeFloat('7.4')).toBeCloseTo(7.4);
    expect(safeParseFloat('7.4')).toBeCloseTo(7.4);
  });
});
