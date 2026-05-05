import { NextResponse } from 'next/server'

const LAT = 43.7001
const LON = -79.4163
const TIMEZONE = 'America%2FToronto'

function getRiskLevel(spread: number): { status: string; risk: 'critical' | 'high' | 'moderate' | 'low' } {
  if (spread <= 0) return { status: 'Active Condensation', risk: 'critical' }
  if (spread <= 2) return { status: 'High Risk', risk: 'high' }
  if (spread <= 5) return { status: 'Moderate Risk', risk: 'moderate' }
  return { status: 'Low Risk', risk: 'low' }
}

export async function GET() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&hourly=temperature_2m,dew_point_2m,relative_humidity_2m` +
    `&timezone=${TIMEZONE}&forecast_days=7`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 502 })
  }

  const data = await res.json()
  const { time, temperature_2m, dew_point_2m, relative_humidity_2m } = data.hourly

  const forecasts = Array.from({ length: 7 }, (_, day) => {
    const idx = day * 24 + 5
    const temp = temperature_2m[idx]
    const dewPoint = dew_point_2m[idx]
    const humidity = relative_humidity_2m[idx]
    const spread = Math.round((temp - dewPoint) * 10) / 10
    return {
      date: time[idx],
      temperature: Math.round(temp * 10) / 10,
      dewPoint: Math.round(dewPoint * 10) / 10,
      humidity,
      spread,
      ...getRiskLevel(spread),
    }
  })

  return NextResponse.json({ forecasts, location: 'Toronto, ON', generatedAt: new Date().toISOString() })
}
