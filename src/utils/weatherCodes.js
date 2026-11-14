/**
 * WMO 4677 weather interpretation codes as returned by Open-Meteo.
 * https://open-meteo.com/en/docs  (section "WMO Weather interpretation codes")
 *
 * Each code is mapped to:
 *  - key:    translation key (i18n `weather.<key>`)
 *  - icon:   name of the icon used by the UI (day / night variants)
 *  - accent: visual accent used for dynamic background tints
 *  - group:  coarse grouping used for charts / background logic
 */

const CODES = {
  0: { key: 'clearSky', icon: { day: 'Sun', night: 'Moon' }, accent: 'clear', group: 'clear' },
  1: { key: 'mainlyClear', icon: { day: 'SunDim', night: 'Moon' }, accent: 'clear', group: 'clear' },
  2: { key: 'partlyCloudy', icon: { day: 'CloudSun', night: 'CloudMoon' }, accent: 'cloudy', group: 'cloudy' },
  3: { key: 'overcast', icon: { day: 'Cloudy', night: 'Cloudy' }, accent: 'overcast', group: 'cloudy' },
  45: { key: 'fog', icon: { day: 'CloudFog', night: 'CloudFog' }, accent: 'fog', group: 'fog' },
  48: { key: 'rimeFog', icon: { day: 'CloudFog', night: 'CloudFog' }, accent: 'fog', group: 'fog' },
  51: { key: 'lightDrizzle', icon: { day: 'CloudDrizzle', night: 'CloudDrizzle' }, accent: 'rain', group: 'drizzle' },
  53: { key: 'moderateDrizzle', icon: { day: 'CloudDrizzle', night: 'CloudDrizzle' }, accent: 'rain', group: 'drizzle' },
  55: { key: 'denseDrizzle', icon: { day: 'CloudDrizzle', night: 'CloudDrizzle' }, accent: 'rain', group: 'drizzle' },
  56: { key: 'lightFreezingDrizzle', icon: { day: 'CloudHail', night: 'CloudHail' }, accent: 'freezing', group: 'freezing' },
  57: { key: 'denseFreezingDrizzle', icon: { day: 'CloudHail', night: 'CloudHail' }, accent: 'freezing', group: 'freezing' },
  61: { key: 'slightRain', icon: { day: 'CloudRain', night: 'CloudRain' }, accent: 'rain', group: 'rain' },
  63: { key: 'moderateRain', icon: { day: 'CloudRain', night: 'CloudRain' }, accent: 'rain', group: 'rain' },
  65: { key: 'heavyRain', icon: { day: 'CloudRainWind', night: 'CloudRainWind' }, accent: 'rain', group: 'rain' },
  66: { key: 'lightFreezingRain', icon: { day: 'CloudHail', night: 'CloudHail' }, accent: 'freezing', group: 'freezing' },
  67: { key: 'heavyFreezingRain', icon: { day: 'CloudHail', night: 'CloudHail' }, accent: 'freezing', group: 'freezing' },
  71: { key: 'slightSnow', icon: { day: 'CloudSnow', night: 'CloudSnow' }, accent: 'snow', group: 'snow' },
  73: { key: 'moderateSnow', icon: { day: 'CloudSnow', night: 'CloudSnow' }, accent: 'snow', group: 'snow' },
  75: { key: 'heavySnow', icon: { day: 'Snowflake', night: 'Snowflake' }, accent: 'snow', group: 'snow' },
  77: { key: 'snowGrains', icon: { day: 'Snowflake', night: 'Snowflake' }, accent: 'snow', group: 'snow' },
  80: { key: 'slightRainShowers', icon: { day: 'CloudSunRain', night: 'CloudMoonRain' }, accent: 'rain', group: 'rain' },
  81: { key: 'moderateRainShowers', icon: { day: 'CloudRain', night: 'CloudRain' }, accent: 'rain', group: 'rain' },
  82: { key: 'violentRainShowers', icon: { day: 'CloudRainWind', night: 'CloudRainWind' }, accent: 'rain', group: 'rain' },
  85: { key: 'slightSnowShowers', icon: { day: 'CloudSnow', night: 'CloudSnow' }, accent: 'snow', group: 'snow' },
  86: { key: 'heavySnowShowers', icon: { day: 'CloudSnow', night: 'CloudSnow' }, accent: 'snow', group: 'snow' },
  95: { key: 'thunderstorm', icon: { day: 'CloudLightning', night: 'CloudLightning' }, accent: 'storm', group: 'storm' },
  97: { key: 'heavyThunderstorm', icon: { day: 'CloudLightning', night: 'CloudLightning' }, accent: 'storm', group: 'storm' },
  96: { key: 'thunderstormSlightHail', icon: { day: 'CloudLightning', night: 'CloudLightning' }, accent: 'storm', group: 'storm' },
  99: { key: 'thunderstormHeavyHail', icon: { day: 'CloudLightning', night: 'CloudLightning' }, accent: 'storm', group: 'storm' },
};

const UNKNOWN = { key: 'unknown', icon: { day: 'CloudSun', night: 'CloudMoon' }, accent: 'cloudy', group: 'cloudy' };

export const SUPPORTED_WEATHER_CODES = Object.keys(CODES).map(Number);

/**
 * Translate a WMO weather code into UI metadata.
 * @param {number|null|undefined} code  WMO code from Open-Meteo
 * @param {boolean} isDay               true for daytime, false for night
 * @returns {{code:number|null, key:string, icon:string, accent:string, group:string, known:boolean}}
 */
export function getWeatherInfo(code, isDay = true) {
  const numeric = typeof code === 'number' && Number.isFinite(code) ? code : null;
  const entry = numeric !== null && CODES[numeric] ? CODES[numeric] : UNKNOWN;
  return {
    code: numeric,
    key: entry.key,
    icon: isDay ? entry.icon.day : entry.icon.night,
    accent: entry.accent,
    group: entry.group,
    known: numeric !== null && Boolean(CODES[numeric]),
  };
}

export function isKnownWeatherCode(code) {
  return typeof code === 'number' && Boolean(CODES[code]);
}
