import { NextResponse } from 'next/server'

// Toronto / ECLRT corridor coordinates (Eglinton Ave W–E midpoint)
const LAT = 43.7182
const LON = -79.4200

// Tunnel wall temperature (°C) — Toronto mean ground temp at ~15m depth
const TUNNEL_WALL_TEMP = 12.0

export interface SectionStatus {
  id: string
  name: string
  type: 'underground' | 'portal' | 'surface'
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  dewPoint: number
  margin: number // °C below tunnel wall temp (negative = condensation forming)
  action: string
}

export interface CondensationReport {
  generatedAt: string   // ISO timestamp
  forecastDate: string  // YYYY-MM-DD
  weather: {
    temperatureC: number
    relativeHumidity: number
    dewPointC: number
    precipitationMm: number
    windSpeedKmh: number
    weatherCode: number
    weatherDescription: string
  }
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  overallRiskReason: string
  sections: SectionStatus[]
  fiveAmSnapshot: {
    temperatureC: number
    dewPointC: number
    relativeHumidity: number
  } | null
  hourlyDewPoints: { hour: number; dewPoint: number; risk: 'LOW' | 'MEDIUM' | 'HIGH' }[]
  recommendedActions: string[]
}

// WMO weather code to description mapping (subset)
function describeWeatherCode(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Heavy showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail',
  }
  return map[code] ?? `Code ${code}`
}

// Simplified Magnus formula for dew point
function calcDewPoint(tempC: number, rhPercent: number): number {
  const a = 17.625
  const b = 243.04
  const alpha = Math.log(rhPercent / 100) + (a * tempC) / (b + tempC)
  return (b * alpha) / (a - alpha)
}

function riskLevel(dewPoint: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  const margin = TUNNEL_WALL_TEMP - dewPoint
  if (margin <= 0) return 'HIGH'
  if (margin <= 3) return 'MEDIUM'
  return 'LOW'
}

function sectionAction(risk: 'LOW' | 'MEDIUM' | 'HIGH', type: string): string {
  if (risk === 'HIGH') {
    if (type === 'underground') return 'Increase tunnel ventilation to max; inspect drainage and electrical cabinets; wet-floor protocols active'
    if (type === 'portal') return 'Monitor portal transition zones; check seals and drainage channels; alert YCC'
    return 'Monitor surface drainage; no immediate action required'
  }
  if (risk === 'MEDIUM') {
    if (type === 'underground') return 'Raise ventilation to elevated mode; verify sump pump operation; standby wet-floor protocols'
    if (type === 'portal') return 'Check portal drainage; monitor for overnight dew accumulation'
    return 'Routine monitoring'
  }
  return 'Normal operations — no intervention required'
}

// ECLRT sections (underground segment: Keele to Laird Drive)
const SECTION_DEFINITIONS: { id: string; name: string; type: SectionStatus['type'] }[] = [
  { id: 'west-surface',   name: 'West Surface (Mount Dennis → Jane)',    type: 'surface'     },
  { id: 'mt-dennis',      name: 'Mount Dennis Portal',                    type: 'portal'      },
  { id: 'keelesdale',     name: 'Keelesdale Tunnel (Keele → Dufferin)',   type: 'underground' },
  { id: 'fairbank',       name: 'Fairbank Tunnel (Dufferin → Allen)',     type: 'underground' },
  { id: 'central',        name: 'Central Tunnel (Allen → Avenue)',        type: 'underground' },
  { id: 'midtown',        name: 'Midtown Tunnel (Avenue → Mt Pleasant)',  type: 'underground' },
  { id: 'east-tunnel',    name: 'East Tunnel (Mt Pleasant → Laird)',      type: 'underground' },
  { id: 'leaside',        name: 'Leaside Portal (Laird Drive)',           type: 'portal'      },
  { id: 'east-surface',   name: 'East Surface (Laird → Kennedy)',         type: 'surface'     },
]

export async function GET() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,wind_speed_10m,weather_code` +
      `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m` +
      `&timezone=America%2FToronto` +
      `&forecast_days=1`

    const res = await fetch(url, { next: { revalidate: 1800 } }) // 30-min cache
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)
    const data = await res.json()

    const current = data.current
    const hourly = data.hourly

    const tempC: number = current.temperature_2m
    const rhPct: number = current.relative_humidity_2m
    const dewPointC: number = current.dew_point_2m ?? calcDewPoint(tempC, rhPct)
    const precipMm: number = current.precipitation
    const windKmh: number = current.wind_speed_10m
    const weatherCode: number = current.weather_code

    // 5 AM snapshot from hourly data (index 5)
    const fiveAmIdx = 5
    const fiveAmSnapshot = hourly.time?.[fiveAmIdx]
      ? {
          temperatureC: hourly.temperature_2m[fiveAmIdx],
          relativeHumidity: hourly.relative_humidity_2m[fiveAmIdx],
          dewPointC: hourly.dew_point_2m[fiveAmIdx] ??
            calcDewPoint(hourly.temperature_2m[fiveAmIdx], hourly.relative_humidity_2m[fiveAmIdx]),
        }
      : null

    // Hourly dew points for the full day
    const hourlyDewPoints = (hourly.time as string[]).map((_, i) => {
      const dp = hourly.dew_point_2m?.[i] ??
        calcDewPoint(hourly.temperature_2m[i], hourly.relative_humidity_2m[i])
      return { hour: i, dewPoint: Math.round(dp * 10) / 10, risk: riskLevel(dp) }
    })

    // Build section statuses — underground sections use tunnel wall temp as the reference
    const sections: SectionStatus[] = SECTION_DEFINITIONS.map((s) => {
      // Surface sections use ambient dew point vs a slightly warmer reference (track temp)
      const referenceTemp = s.type === 'underground' ? TUNNEL_WALL_TEMP
        : s.type === 'portal' ? TUNNEL_WALL_TEMP + 2
        : TUNNEL_WALL_TEMP + 8
      const margin = Math.round((referenceTemp - dewPointC) * 10) / 10
      const risk: SectionStatus['risk'] = margin <= 0 ? 'HIGH' : margin <= 3 ? 'MEDIUM' : 'LOW'
      return {
        id: s.id,
        name: s.name,
        type: s.type,
        risk,
        dewPoint: Math.round(dewPointC * 10) / 10,
        margin,
        action: sectionAction(risk, s.type),
      }
    })

    // Overall risk = worst across all underground + portal sections
    const criticalSections = sections.filter((s) => s.type !== 'surface')
    const overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' =
      criticalSections.some((s) => s.risk === 'HIGH') ? 'HIGH'
      : criticalSections.some((s) => s.risk === 'MEDIUM') ? 'MEDIUM'
      : 'LOW'

    const overallRiskReason =
      overallRisk === 'HIGH'
        ? `Dew point (${dewPointC.toFixed(1)}°C) at or above tunnel wall temperature (${TUNNEL_WALL_TEMP}°C) — condensation likely forming on underground surfaces`
        : overallRisk === 'MEDIUM'
        ? `Dew point (${dewPointC.toFixed(1)}°C) within 3°C of tunnel wall temperature (${TUNNEL_WALL_TEMP}°C) — conditions approaching condensation threshold`
        : `Dew point (${dewPointC.toFixed(1)}°C) safely below tunnel wall temperature (${TUNNEL_WALL_TEMP}°C) — no condensation risk`

    const recommendedActions: string[] = []
    if (overallRisk === 'HIGH') {
      recommendedActions.push('Activate enhanced ventilation protocol across all underground sections')
      recommendedActions.push('Deploy wet-floor signage at all underground platform areas')
      recommendedActions.push('Notify YCC and Equipment Control Desk of elevated condensation risk')
      recommendedActions.push('Inspect electrical cabinet drainage — focus on Fairbank and Central sections')
      recommendedActions.push('Increase frequency of tunnel walkdowns to 2-hour intervals')
    } else if (overallRisk === 'MEDIUM') {
      recommendedActions.push('Raise ventilation to elevated mode in underground sections')
      recommendedActions.push('Verify sump pump operational status across all underground stations')
      recommendedActions.push('Alert YCC — monitor dew point trend through AM peak')
      recommendedActions.push('Pre-position wet-floor signage at underground platforms (standby)')
    } else {
      recommendedActions.push('Maintain normal ventilation and monitoring schedule')
      recommendedActions.push('Routine AM inspection per standard SOPs')
    }

    if (precipMm > 5) {
      recommendedActions.push(`Active precipitation (${precipMm.toFixed(1)} mm) — check portal drainage and track drainage channels`)
    }

    const today = new Date().toISOString().slice(0, 10)

    const report: CondensationReport = {
      generatedAt: new Date().toISOString(),
      forecastDate: today,
      weather: {
        temperatureC: Math.round(tempC * 10) / 10,
        relativeHumidity: Math.round(rhPct),
        dewPointC: Math.round(dewPointC * 10) / 10,
        precipitationMm: Math.round(precipMm * 10) / 10,
        windSpeedKmh: Math.round(windKmh * 10) / 10,
        weatherCode,
        weatherDescription: describeWeatherCode(weatherCode),
      },
      overallRisk,
      overallRiskReason,
      sections,
      fiveAmSnapshot,
      hourlyDewPoints,
      recommendedActions,
    }

    return NextResponse.json(report)
  } catch (err) {
    console.error('Condensation API error:', err)
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 502 })
  }
}
