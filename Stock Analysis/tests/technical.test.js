// Unit Tests for Technical Analysis Functions
import { describe, it, expect, beforeEach } from 'vitest';
import { TechnicalAnalysis } from '../js/modules/technical.js';

describe('TechnicalAnalysis', () => {
  let samplePrices;

  beforeEach(() => {
    // Sample price data for testing
    samplePrices = [
      100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
      110, 108, 111, 113, 112, 114, 116, 115, 117, 119,
      118, 120, 122, 121, 123, 125, 124, 126, 128, 127
    ];
  });

  describe('calculateSMA', () => {
    it('should calculate simple moving average correctly', () => {
      const sma = TechnicalAnalysis.calculateSMA([1, 2, 3, 4, 5], 3);
      expect(sma).toEqual([2, 3, 4]); // (1+2+3)/3=2, (2+3+4)/3=3, (3+4+5)/3=4
    });

    it('should handle window size equal to data length', () => {
      const sma = TechnicalAnalysis.calculateSMA([1, 2, 3], 3);
      expect(sma).toEqual([2]); // (1+2+3)/3=2
    });

    it('should throw error for invalid input', () => {
      expect(() => TechnicalAnalysis.calculateSMA([], 5)).toThrow();
      expect(() => TechnicalAnalysis.calculateSMA([1, 2], 5)).toThrow();
      expect(() => TechnicalAnalysis.calculateSMA([1, 2, 3], 0)).toThrow();
      expect(() => TechnicalAnalysis.calculateSMA('invalid', 3)).toThrow();
    });

    it('should throw error for non-numeric data', () => {
      expect(() => TechnicalAnalysis.calculateSMA([1, 'invalid', 3], 2)).toThrow();
      expect(() => TechnicalAnalysis.calculateSMA([1, NaN, 3], 2)).toThrow();
    });

    it('should work with larger dataset', () => {
      const sma = TechnicalAnalysis.calculateSMA(samplePrices, 5);
      expect(sma).toHaveLength(samplePrices.length - 4);
      expect(sma[0]).toBeCloseTo(102.2, 1); // (100+102+101+103+105)/5
    });
  });

  describe('calculateRSI', () => {
    it('should calculate RSI correctly', () => {
      const rsi = TechnicalAnalysis.calculateRSI(samplePrices, 14);
      expect(rsi).toHaveLength(samplePrices.length - 14);
      expect(rsi[0]).toBeGreaterThan(0);
      expect(rsi[0]).toBeLessThan(100);
    });

    it('should handle RSI edge cases', () => {
      // All gains (RSI should approach 100)
      const allGains = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115];
      const rsiGains = TechnicalAnalysis.calculateRSI(allGains, 14);
      expect(rsiGains[0]).toBeGreaterThan(90);

      // Alternating gains and losses
      const alternating = [100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101];
      const rsiAlt = TechnicalAnalysis.calculateRSI(alternating, 14);
      expect(rsiAlt[0]).toBeCloseTo(50, 0);
    });

    it('should throw error for insufficient data', () => {
      expect(() => TechnicalAnalysis.calculateRSI([100, 101], 14)).toThrow();
      expect(() => TechnicalAnalysis.calculateRSI([], 14)).toThrow();
      expect(() => TechnicalAnalysis.calculateRSI(samplePrices, 0)).toThrow();
    });

    it('should use default window of 14', () => {
      const rsi14 = TechnicalAnalysis.calculateRSI(samplePrices);
      const rsiExplicit = TechnicalAnalysis.calculateRSI(samplePrices, 14);
      expect(rsi14).toEqual(rsiExplicit);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate exponential moving average correctly', () => {
      const ema = TechnicalAnalysis.calculateEMA([1, 2, 3, 4, 5], 3);
      expect(ema).toHaveLength(5);
      expect(ema[0]).toBe(1); // First value is the seed
      expect(ema[1]).toBeCloseTo(1.5, 1); // 1 + 0.5 * (2 - 1)
    });

    it('should throw error for invalid input', () => {
      expect(() => TechnicalAnalysis.calculateEMA([], 3)).toThrow();
      expect(() => TechnicalAnalysis.calculateEMA([1, 2], 5)).toThrow();
      expect(() => TechnicalAnalysis.calculateEMA([1, 2, 3], 0)).toThrow();
    });

    it('should handle non-numeric data errors', () => {
      expect(() => TechnicalAnalysis.calculateEMA([1, 'invalid', 3], 2)).toThrow();
      expect(() => TechnicalAnalysis.calculateEMA([1, NaN, 3], 2)).toThrow();
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD correctly with default parameters', () => {
      const longPrices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.1) * 10);
      const macd = TechnicalAnalysis.calculateMACD(longPrices);
      
      expect(macd).toHaveProperty('macd');
      expect(macd).toHaveProperty('signal');
      expect(typeof macd.macd).toBe('number');
      expect(typeof macd.signal).toBe('number');
    });

    it('should calculate MACD with custom parameters', () => {
      const longPrices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.1) * 10);
      const macd = TechnicalAnalysis.calculateMACD(longPrices, 8, 21, 5);
      
      expect(macd).toHaveProperty('macd');
      expect(macd).toHaveProperty('signal');
    });

    it('should throw error for insufficient data', () => {
      expect(() => TechnicalAnalysis.calculateMACD([100, 101], 12, 26, 9)).toThrow();
      expect(() => TechnicalAnalysis.calculateMACD(samplePrices, 15, 10, 9)).toThrow(); // fast >= slow
      expect(() => TechnicalAnalysis.calculateMACD(samplePrices, 0, 26, 9)).toThrow();
    });
  });

  describe('validatePriceData', () => {
    it('should validate and clean good price data', () => {
      const result = TechnicalAnalysis.validatePriceData([100, 101, 102]);
      expect(result).toEqual([100, 101, 102]);
    });

    it('should handle string numbers', () => {
      const result = TechnicalAnalysis.validatePriceData(['100', '101.5', '102']);
      expect(result).toEqual([100, 101.5, 102]);
    });

    it('should filter out invalid data', () => {
      const result = TechnicalAnalysis.validatePriceData([100, 'invalid', null, 102, -5, 0]);
      expect(result).toEqual([100, 102]);
    });

    it('should throw error for no valid data', () => {
      expect(() => TechnicalAnalysis.validatePriceData(['invalid', null, -5, 0])).toThrow();
      expect(() => TechnicalAnalysis.validatePriceData([])).toThrow();
      expect(() => TechnicalAnalysis.validatePriceData('not an array')).toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle real-world price patterns', () => {
      // Simulate a trending stock
      const trendingPrices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5 + Math.random() * 2);
      
      const sma20 = TechnicalAnalysis.calculateSMA(trendingPrices, 20);
      const rsi = TechnicalAnalysis.calculateRSI(trendingPrices);
      const macd = TechnicalAnalysis.calculateMACD(trendingPrices);
      
      expect(sma20.length).toBeGreaterThan(0);
      expect(rsi.length).toBeGreaterThan(0);
      expect(rsi.every(value => value >= 0 && value <= 100)).toBe(true);
      expect(typeof macd.macd).toBe('number');
      expect(typeof macd.signal).toBe('number');
    });

    it('should handle volatile price data', () => {
      // Simulate volatile stock
      const volatilePrices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.5) * 20 + Math.random() * 10);
      
      const sma10 = TechnicalAnalysis.calculateSMA(volatilePrices, 10);
      const rsi = TechnicalAnalysis.calculateRSI(volatilePrices);
      
      expect(sma10.length).toBe(volatilePrices.length - 9);
      expect(rsi.every(value => value >= 0 && value <= 100)).toBe(true);
    });
  });
});