import { add, multiplyByQuantity, sum } from '@/lib/money';

describe('lib/money', () => {
  describe('add', () => {
    it('sums two numeric(10,2) strings without float drift', () => {
      expect(add('19.99', '5.00')).toBe('24.99');
    });

    it('avoids the classic 0.1 + 0.2 float trap', () => {
      expect(add('0.10', '0.20')).toBe('0.30');
    });

    it('handles values without a fractional part', () => {
      expect(add('10', '5')).toBe('15.00');
    });
  });

  describe('multiplyByQuantity', () => {
    it('multiplies a price by an integer quantity', () => {
      expect(multiplyByQuantity('3.90', 3)).toBe('11.70');
    });

    it('handles quantity 1 as a no-op', () => {
      expect(multiplyByQuantity('1.40', 1)).toBe('1.40');
    });
  });

  describe('sum', () => {
    it('sums a list of order item subtotals', () => {
      expect(sum(['1.40', '1.50', '3.90'])).toBe('6.80');
    });

    it('returns 0.00 for an empty list', () => {
      expect(sum([])).toBe('0.00');
    });
  });

  describe('invalid input', () => {
    it('throws on a non-numeric string instead of silently returning NaN', () => {
      expect(() => add('abc', '1.00')).toThrow();
    });

    it('throws on more than 2 fraction digits instead of silently truncating', () => {
      expect(() => add('19.999', '1.00')).toThrow();
    });
  });
});
