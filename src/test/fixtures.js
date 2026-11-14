/** A minimal but realistic Open-Meteo forecast response (shape only; values are test data). */
export function makeForecast(overrides = {}) {
  const hours = Array.from({ length: 48 }, (_, i) => {
    const day = i < 24 ? '13' : '14';
    return `2026-11-${day}T${String(i % 24).padStart(2, '0')}:00`;
  });
  const n = hours.length;
  const seq = (f) => Array.from({ length: n }, (_, i) => f(i));
  return {
    latitude: 41.3,
    longitude: 69.25,
    timezone: 'Asia/Tashkent',
    timezone_abbreviation: 'GMT+5',
    utc_offset_seconds: 18000,
    current: {
      time: '2026-11-13T11:15',
      temperature_2m: 12.4,
      relative_humidity_2m: 55,
      apparent_temperature: 10.1,
      is_day: 1,
      precipitation: 0,
      weather_code: 2,
      cloud_cover: 40,
      surface_pressure: 985.2,
      pressure_msl: 1018.6,
      wind_speed_10m: 9.7,
      wind_direction_10m: 270,
      wind_gusts_10m: 18.2,
    },
    hourly: {
      time: hours,
      temperature_2m: seq((i) => 5 + (i % 24) / 2),
      relative_humidity_2m: seq(() => 50),
      apparent_temperature: seq((i) => 4 + (i % 24) / 2),
      precipitation_probability: seq((i) => (i * 7) % 100),
      precipitation: seq(() => 0),
      weather_code: seq((i) => (i % 3 === 0 ? 61 : 1)),
      wind_speed_10m: seq(() => 8),
      wind_direction_10m: seq(() => 180),
      surface_pressure: seq(() => 985),
      cloud_cover: seq(() => 30),
      visibility: seq(() => 24140),
      uv_index: seq((i) => (i % 24 === 11 ? 3.2 : 0.5)),
      dew_point_2m: seq(() => 3.3),
      is_day: seq((i) => (i % 24 >= 7 && i % 24 <= 17 ? 1 : 0)),
    },
    daily: {
      time: ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'],
      weather_code: [2, 61, 3, 0, 1, 71, 95],
      temperature_2m_max: [15.1, 13.2, 11.8, 14, 16.3, 5.2, 9.9],
      temperature_2m_min: [4.2, 5.5, 3.1, 2.8, 6, -1.4, 1.2],
      apparent_temperature_max: [14, 12, 10, 13, 15, 3, 8],
      apparent_temperature_min: [2, 3, 1, 1, 4, -4, -1],
      sunrise: Array(7).fill('2026-11-13T07:02'),
      sunset: Array(7).fill('2026-11-13T17:11'),
      uv_index_max: [3.4, 2.1, 1.8, 3.9, 4, 1, 2],
      precipitation_sum: [0, 4.2, 0.1, 0, 0, 2.5, 7],
      precipitation_probability_max: [10, 80, 30, 5, 0, 70, 90],
      wind_speed_10m_max: [12, 18, 9, 7, 11, 22, 30],
      wind_direction_10m_dominant: [270, 180, 90, 0, 45, 225, 315],
    },
    ...overrides,
  };
}
