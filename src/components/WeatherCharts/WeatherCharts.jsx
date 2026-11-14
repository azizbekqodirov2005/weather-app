import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { convertTemperature, roundTo, temperatureSymbol } from '../../utils/conversions';
import { formatShortDate, formatTime, formatWeekday } from '../../utils/dateUtils';
import './WeatherCharts.css';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Convert to the display unit; missing values stay `null` so Recharts leaves a gap. */
function temp(c, unit) {
  return isNum(c) ? roundTo(convertTemperature(c, unit), 1) : null;
}

function ChartTooltip({ active, payload, label, unitSuffix, title }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tip" role="status">
      <div className="chart-tip__title">{title ? title(label) : label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tip__row">
          <span className="chart-tip__swatch" style={{ background: p.color || p.stroke }} aria-hidden="true" />
          <span className="chart-tip__name">{p.name}</span>
          <span className="chart-tip__value">
            {isNum(p.value) ? `${p.value}${unitSuffix}` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

const AXIS = { fontSize: 12, fill: 'var(--chart-axis)' };

/**
 * Three charts on real data: 24 h temperature, 7-day max/min, 24 h precipitation probability.
 */
export default function WeatherCharts({ hourly, daily }) {
  const { t, language, units } = useSettings();
  const [tab, setTab] = useState('temp24');
  const symbol = temperatureSymbol(units.temperature);

  const hourlyData = useMemo(
    () =>
      (hourly || []).map((h) => ({
        time: h.time,
        label: formatTime(h.time, language),
        temperature: temp(h.temperature, units.temperature),
        precipitation: isNum(h.precipitationProbability) ? Math.round(h.precipitationProbability) : null,
      })),
    [hourly, language, units.temperature],
  );

  const dailyData = useMemo(
    () =>
      (daily || []).map((d) => ({
        date: d.date,
        label: formatWeekday(d.date, language),
        max: temp(d.tempMax, units.temperature),
        min: temp(d.tempMin, units.temperature),
      })),
    [daily, language, units.temperature],
  );

  const hasHourly = hourlyData.some((d) => isNum(d.temperature));
  const hasDaily = dailyData.some((d) => isNum(d.max) || isNum(d.min));
  const hasPrecip = hourlyData.some((d) => isNum(d.precipitation));

  const tabs = [
    { id: 'temp24', label: t('charts.temp24'), short: t('charts.tab24'), available: hasHourly },
    { id: 'temp7', label: t('charts.temp7'), short: t('charts.tab7'), available: hasDaily },
    { id: 'precip', label: t('charts.precip'), short: t('charts.tabPrecip'), available: hasPrecip },
  ];

  const hourTitle = (label) => {
    const item = hourlyData.find((d) => d.label === label);
    return item ? `${formatTime(item.time, language)}` : label;
  };
  const dayTitle = (label) => {
    const item = dailyData.find((d) => d.label === label);
    return item ? `${formatWeekday(item.date, language, 'long')}, ${formatShortDate(item.date, language)}` : label;
  };

  const gridProps = { stroke: 'var(--chart-grid)', strokeDasharray: '3 6', vertical: false };
  const tooltipCursor = { stroke: 'var(--border-strong)', strokeWidth: 1 };
  const current = tabs.find((x) => x.id === tab);

  return (
    <section className="card fade-in" aria-labelledby="charts-title">
      <div className="card__header charts__header">
        <h2 id="charts-title" className="card__title">
          <LineChartIcon size={18} aria-hidden="true" /> {t('charts.title')}
        </h2>
        <div className="segmented charts__tabs" role="tablist" aria-label={t('charts.title')}>
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              className="segmented__option"
              onClick={() => setTab(x.id)}
              disabled={!x.available}
              aria-label={x.label}
            >
              <span className="charts__tab-long">{x.label}</span>
              <span className="charts__tab-short" aria-hidden="true">
                {x.short}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card__body charts__body" role="tabpanel">
        {!current?.available ? (
          <p className="charts__empty">{t('charts.noData')}</p>
        ) : null}

        {tab === 'temp24' && hasHourly ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={hourlyData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="skycast-temp-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-temp)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-temp)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v) => `${v}°`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                cursor={tooltipCursor}
                content={<ChartTooltip unitSuffix={symbol} title={hourTitle} />}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="temperature"
                name={t('charts.temperature')}
                stroke="var(--chart-temp)"
                strokeWidth={2}
                fill="url(#skycast-temp-fill)"
                connectNulls={false}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface-solid)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}

        {tab === 'temp7' && hasDaily ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={0} minTickGap={4} />
              <YAxis
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v) => `${v}°`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                cursor={tooltipCursor}
                content={<ChartTooltip unitSuffix={symbol} title={dayTitle} />}
                isAnimationActive={false}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} iconType="plainline" />
              <Line
                type="monotone"
                dataKey="max"
                name={t('charts.max')}
                stroke="var(--chart-temp-max)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface-solid)', fill: 'var(--chart-temp-max)' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="min"
                name={t('charts.min')}
                stroke="var(--chart-temp-min)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface-solid)', fill: 'var(--chart-temp-min)' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null}

        {tab === 'precip' && hasPrecip ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={44}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-strong)' }}
                content={<ChartTooltip unitSuffix="%" title={hourTitle} />}
                isAnimationActive={false}
              />
              <Bar
                dataKey="precipitation"
                name={t('charts.probability')}
                fill="var(--chart-precip)"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </section>
  );
}
