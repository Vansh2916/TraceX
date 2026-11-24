import { validateIndianPlate } from '../utils/plateValidator';

describe('validateIndianPlate', () => {
  it('validates Delhi vehicle plates properly', () => {
    const res = validateIndianPlate('DL 01 AB 1234');
    expect(res.isValid).toBe(true);
    expect(res.normalizedPlate).toBe('DL01AB1234');
    expect(res.stateCode).toBe('DL');
  });

  it('validates Haryana and UP plates', () => {
    expect(validateIndianPlate('HR26DK9723').isValid).toBe(true);
    expect(validateIndianPlate('UP-16-BT-4097').isValid).toBe(true);
  });

  it('rejects invalid strings', () => {
    expect(validateIndianPlate('INVALID').isValid).toBe(false);
    expect(validateIndianPlate('').isValid).toBe(false);
  });
});
