import { describe, it, expect } from 'vitest';
import BloodOxygenValidations, {
  spo2,
  fio2,
  utils,
  hasValidBloodOxygenInput,
  hasValidFio2Input,
} from '../../components/vital-signs/validations/blood-oxygen-validations';

describe('spo2.isValid', () => {
  it('returns true for normal SpO2 (98%)', () => {
    expect(spo2.isValid('98')).toBe(true);
  });

  it('returns true at lower bound (70%)', () => {
    expect(spo2.isValid('70')).toBe(true);
  });

  it('returns true at upper bound (100%)', () => {
    expect(spo2.isValid('100')).toBe(true);
  });

  it('returns false below range (69%)', () => {
    expect(spo2.isValid('69')).toBe(false);
  });

  it('returns false above range (101%)', () => {
    expect(spo2.isValid('101')).toBe(false);
  });

  it('returns false for non-numeric', () => {
    expect(spo2.isValid('abc')).toBe(false);
  });
});

describe('spo2.isLow', () => {
  it('returns true for SpO2 < 95 (93%)', () => {
    expect(spo2.isLow('93')).toBe(true);
  });

  it('returns false for SpO2 >= 95 (95%)', () => {
    expect(spo2.isLow('95')).toBe(false);
  });

  it('returns false for SpO2 = 98', () => {
    expect(spo2.isLow('98')).toBe(false);
  });

  it('returns false for non-numeric', () => {
    expect(spo2.isLow('abc')).toBe(false);
  });
});

describe('spo2.isCritical', () => {
  it('returns true for SpO2 < 90 (88%)', () => {
    expect(spo2.isCritical('88')).toBe(true);
  });

  it('returns false for SpO2 >= 90 (90%)', () => {
    expect(spo2.isCritical('90')).toBe(false);
  });

  it('returns true for SpO2 = 89', () => {
    expect(spo2.isCritical('89')).toBe(true);
  });
});

describe('spo2.getSeverity', () => {
  it('returns normal for SpO2 >= 95', () => {
    expect(spo2.getSeverity('98')).toBe('normal');
    expect(spo2.getSeverity('95')).toBe('normal');
  });

  it('returns low for SpO2 90-94', () => {
    expect(spo2.getSeverity('93')).toBe('low');
    expect(spo2.getSeverity('90')).toBe('low');
  });

  it('returns critical for SpO2 < 90', () => {
    expect(spo2.getSeverity('88')).toBe('critical');
    expect(spo2.getSeverity('70')).toBe('critical');
  });

  it('returns invalid for out-of-range values', () => {
    expect(spo2.getSeverity('69')).toBe('invalid');
    expect(spo2.getSeverity('101')).toBe('invalid');
    expect(spo2.getSeverity('abc')).toBe('invalid');
  });
});

describe('spo2.getErrorMessage', () => {
  it('returns null for valid value', () => {
    expect(spo2.getErrorMessage('98')).toBeNull();
  });

  it('returns null for empty value', () => {
    expect(spo2.getErrorMessage('')).toBeNull();
  });

  it('returns error for NaN', () => {
    expect(spo2.getErrorMessage('abc')).toBe('Please enter a valid number');
  });

  it('returns error for value below 70', () => {
    expect(spo2.getErrorMessage('50')).toContain('at least 70');
  });

  it('returns error for value above 100', () => {
    expect(spo2.getErrorMessage('105')).toContain('cannot exceed 100');
  });
});

describe('fio2.isValid', () => {
  it('returns true for room air (21%)', () => {
    expect(fio2.isValid('21')).toBe(true);
  });

  it('returns true for supplemental (40%)', () => {
    expect(fio2.isValid('40')).toBe(true);
  });

  it('returns true at maximum (100%)', () => {
    expect(fio2.isValid('100')).toBe(true);
  });

  it('returns false below minimum (20%)', () => {
    expect(fio2.isValid('20')).toBe(false);
  });

  it('returns false for non-numeric', () => {
    expect(fio2.isValid('abc')).toBe(false);
  });
});

describe('fio2.isSupplemental', () => {
  it('returns true for FiO2 > 21% (40%)', () => {
    expect(fio2.isSupplemental('40')).toBe(true);
  });

  it('returns false for room air (21%)', () => {
    expect(fio2.isSupplemental('21')).toBe(false);
  });
});

describe('fio2.isRoomAir', () => {
  it('returns true for FiO2 = 21%', () => {
    expect(fio2.isRoomAir('21')).toBe(true);
  });

  it('returns false for FiO2 > 21%', () => {
    expect(fio2.isRoomAir('40')).toBe(false);
  });
});

describe('fio2.getDeliveryMethod', () => {
  it('returns room air for FiO2 = 21', () => {
    expect(fio2.getDeliveryMethod('21')).toBe('room air');
  });

  it('returns low flow for FiO2 22-40', () => {
    expect(fio2.getDeliveryMethod('30')).toBe('low flow');
    expect(fio2.getDeliveryMethod('40')).toBe('low flow');
  });

  it('returns high flow for FiO2 > 40', () => {
    expect(fio2.getDeliveryMethod('60')).toBe('high flow');
    expect(fio2.getDeliveryMethod('100')).toBe('high flow');
  });

  it('returns invalid for out-of-range values', () => {
    expect(fio2.getDeliveryMethod('20')).toBe('invalid');
    expect(fio2.getDeliveryMethod('abc')).toBe('invalid');
  });
});

describe('fio2.getErrorMessage', () => {
  it('returns null for valid value', () => {
    expect(fio2.getErrorMessage('21')).toBeNull();
  });

  it('returns null for empty value', () => {
    expect(fio2.getErrorMessage('')).toBeNull();
  });

  it('returns error for value below 21', () => {
    expect(fio2.getErrorMessage('15')).toContain('at least 21');
  });

  it('returns error for value above 100', () => {
    expect(fio2.getErrorMessage('110')).toContain('cannot exceed 100');
  });
});

describe('utils.calculateRatio (SpO2/FiO2)', () => {
  it('calculates ratio for normal values', () => {
    expect(utils.calculateRatio('98', '21')).toBe('4.67');
  });

  it('returns null when FiO2 is 0 (division by zero)', () => {
    expect(utils.calculateRatio('98', '0')).toBeNull();
  });

  it('returns null for non-numeric SpO2', () => {
    expect(utils.calculateRatio('abc', '21')).toBeNull();
  });

  it('returns null for non-numeric FiO2', () => {
    expect(utils.calculateRatio('98', 'abc')).toBeNull();
  });

  it('calculates ratio with supplemental oxygen', () => {
    expect(utils.calculateRatio('95', '40')).toBe('2.38');
  });
});

describe('utils.toNumber', () => {
  it('parses valid number', () => {
    expect(utils.toNumber('42')).toBe(42);
  });

  it('returns null for non-numeric', () => {
    expect(utils.toNumber('abc')).toBeNull();
  });
});

describe('utils.formatNumber', () => {
  it('formats number with default 0 decimals', () => {
    expect(utils.formatNumber('42.7')).toBe('43');
  });

  it('formats number with specified decimals', () => {
    expect(utils.formatNumber('42.756', 2)).toBe('42.76');
  });

  it('returns empty string for non-numeric', () => {
    expect(utils.formatNumber('abc')).toBe('');
  });
});

describe('utils.isEmpty', () => {
  it('returns true for null', () => {
    expect(utils.isEmpty(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(utils.isEmpty(undefined)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(utils.isEmpty('')).toBe(true);
  });

  it('returns false for a value', () => {
    expect(utils.isEmpty('98')).toBe(false);
  });
});

describe('exported aliases', () => {
  it('hasValidBloodOxygenInput is spo2.isValid', () => {
    expect(hasValidBloodOxygenInput('98')).toBe(true);
    expect(hasValidBloodOxygenInput('50')).toBe(false);
  });

  it('hasValidFio2Input is fio2.isValid', () => {
    expect(hasValidFio2Input('21')).toBe(true);
    expect(hasValidFio2Input('10')).toBe(false);
  });
});
