import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  convertPressure,
  convertTemperature,
  convertWindSpeed,
  degreesToCompass,
  fahrenheitToCelsius,
  formatPressure,
  formatTemperature,
  formatVisibility,
  formatWindSpeed,
  hpaToMmHg,
  kmhToMph,
  kmhToMs,
  roundTo,
  uvCategoryKey,
} from '../utils/conversions';

describe('temperature', () => {
  it('converts °C to °F correctly', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(-40)).toBe(-40);
    expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6, 5);
  });
  it('round-trips', () => {
    expect(fahrenheitToCelsius(celsiusToFahrenheit(21.5))).toBeCloseTo(21.5, 10);
  });
  it('returns null for non-numbers and never invents data', () => {
    expect(convertTemperature(null, 'celsius')).toBeNull();
    expect(convertTemperature(undefined, 'fahrenheit')).toBeNull();
    expect(convertTemperature(NaN, 'fahrenheit')).toBeNull();
    expect(formatTemperature(null, 'celsius')).toBe('—');
  });
  it('formats with unit and avoids "-0"', () => {
    expect(formatTemperature(12.4, 'celsius')).toBe('12°C');
    expect(formatTemperature(12.4, 'fahrenheit')).toBe('54°F');
    expect(formatTemperature(-0.3, 'celsius')).toBe('0°C');
    expect(formatTemperature(12.4, 'celsius', { withUnit: false })).toBe('12°');
  });
});

describe('wind', () => {
  it('converts km/h to m/s and mph', () => {
    expect(kmhToMs(36)).toBeCloseTo(10, 10);
    expect(kmhToMph(100)).toBeCloseTo(62.1371, 3);
    expect(convertWindSpeed(18, 'ms')).toBeCloseTo(5, 10);
    expect(convertWindSpeed(18, 'kmh')).toBe(18);
    expect(convertWindSpeed(null, 'mph')).toBeNull();
  });
  it('formats with labels', () => {
    expect(formatWindSpeed(18, 'ms')).toBe('5 m/s');
    expect(formatWindSpeed(18, 'mph')).toBe('11 mph');
    expect(formatWindSpeed(undefined, 'kmh')).toBe('—');
  });
  it('maps degrees to 16-point compass', () => {
    expect(degreesToCompass(0)).toBe('N');
    expect(degreesToCompass(360)).toBe('N');
    expect(degreesToCompass(90)).toBe('E');
    expect(degreesToCompass(180)).toBe('S');
    expect(degreesToCompass(270)).toBe('W');
    expect(degreesToCompass(22.5)).toBe('NNE');
    expect(degreesToCompass(45)).toBe('NE');
    expect(degreesToCompass(348.75)).toBe('N');
    expect(degreesToCompass(-90)).toBe('W');
    expect(degreesToCompass(null)).toBeNull();
  });
});

describe('pressure', () => {
  it('converts hPa to mmHg', () => {
    expect(hpaToMmHg(1013.25)).toBeCloseTo(760, 2);
    expect(convertPressure(1000, 'hpa')).toBe(1000);
    expect(formatPressure(1013.25, 'mmhg')).toBe('760 mmHg');
    expect(formatPressure(null, 'hpa')).toBe('—');
  });
});

describe('visibility & misc', () => {
  it('formats visibility in km / m / mi', () => {
    expect(formatVisibility(24140, 'kmh')).toBe('24 km');
    expect(formatVisibility(850, 'kmh')).toBe('850 m');
    expect(formatVisibility(1609.344, 'mph')).toBe('1 mi');
    expect(formatVisibility(null, 'kmh')).toBe('—');
  });
  it('categorises UV index', () => {
    expect(uvCategoryKey(1)).toBe('low');
    expect(uvCategoryKey(3)).toBe('moderate');
    expect(uvCategoryKey(7.9)).toBe('high');
    expect(uvCategoryKey(10)).toBe('veryHigh');
    expect(uvCategoryKey(11)).toBe('extreme');
    expect(uvCategoryKey(null)).toBeNull();
  });
  it('rounds safely', () => {
    expect(roundTo(1.005, 2)).toBe(1); // float artefact tolerated
    expect(roundTo('x')).toBeNull();
  });
});
