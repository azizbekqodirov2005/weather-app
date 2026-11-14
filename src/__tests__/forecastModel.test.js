import { describe, expect, it } from 'vitest';
import { buildForecastModel } from '../utils/forecastModel';
import { makeForecast } from '../test/fixtures';

describe('buildForecastModel', () => {
  it('builds hourly (24 items from the current hour) and daily (7) models', () => {
    const m = buildForecastModel(makeForecast());
    expect(m.hourly).toHaveLength(24);
    expect(m.hourly[0].time).toBe('2026-11-13T11:00');
    expect(m.daily).toHaveLength(7);
    expect(m.current.temperature).toBe(12.4);
    expect(m.current.tempMax).toBe(15.1);
    expect(m.current.sunrise).toBe('2026-11-13T07:02');
    expect(m.current.uvIndex).toBe(3.2); // sampled at hour 11
    expect(m.current.visibility).toBe(24140);
    expect(m.current.isDay).toBe(true);
  });
  it('turns missing variables into null instead of inventing values', () => {
    const raw = makeForecast();
    delete raw.hourly.visibility;
    delete raw.hourly.uv_index;
    raw.current.wind_gusts_10m = undefined;
    const m = buildForecastModel(raw);
    expect(m.current.visibility).toBeNull();
    expect(m.current.uvIndex).toBeNull();
    expect(m.current.windGusts).toBeNull();
  });
});
