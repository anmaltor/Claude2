import { NextResponse } from 'next/server';

// Eglinton Crosstown LRT corridor — Midtown Toronto
const LAT = 43.708;
const LON = -79.398;

const OPEN_METEO_URL =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${LAT}&longitude=${LON}` +
  `&hourly=temperature_2m,relativehumidity_2m,dewpoint_2m` +
  `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
  `&timezone=America%2FToronto` +
  `&forecast_days=1`;

function condensationRisk(tempC: number, dewPointC: number): 'high' | 'moderate' | 'low' {
  const spread = tempC - dewPointC;
  if (spread < 2) return 'high';
  if (spread < 5) return 'moderate';
  return 'low';
}

export async function GET() {
  try {
    const res = await fetch(OPEN_METEO_URL, { next: { revalidate: 1800 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Open-Meteo returned ${res.status}` },
        { status: 502 }
      );
    }

    const raw = await res.json();

    const hourly: HourlyForecast[] = raw.hourly.time.map(
      (time: string, i: number) => ({
        time,
        temperatureC: raw.hourly.temperature_2m[i],
        relativeHumidityPct: raw.hourly.relativehumidity_2m[i],
        dewPointC: raw.hourly.dewpoint_2m[i],
        condensationRisk: condensationRisk(
          raw.hourly.temperature_2m[i],
          raw.hourly.dewpoint_2m[i]
        ),
      })
    );

    const daily = {
      maxTempC: raw.daily.temperature_2m_max[0],
      minTempC: raw.daily.temperature_2m_min[0],
      precipitationMm: raw.daily.precipitation_sum[0],
    };

    const highRiskHours = hourly.filter(h => h.condensationRisk === 'high').length;
    const overallRisk: 'high' | 'moderate' | 'low' =
      highRiskHours >= 3 ? 'high' : highRiskHours >= 1 ? 'moderate' : 'low';

    return NextResponse.json({
      location: 'Eglinton Crosstown LRT, Toronto',
      date: raw.daily.time[0],
      overallCondensationRisk: overallRisk,
      highRiskHoursCount: highRiskHours,
      daily,
      hourly,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

interface HourlyForecast {
  time: string;
  temperatureC: number;
  relativeHumidityPct: number;
  dewPointC: number;
  condensationRisk: 'high' | 'moderate' | 'low';
}
