export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'

export interface HourlyReading {
  hour: number
  time: string
  temperature: number
  dewPoint: number
  humidity: number
  risk: RiskLevel
  margin: number // surface temp - dew point
}

export interface ZoneStatus {
  name: string
  stations: string
  surfaceTemp: number
  risk: RiskLevel
  notes: string
}

// ECLRT tunnel zones with representative ground-coupled surface temperatures
export const TUNNEL_ZONES: Omit<ZoneStatus, 'risk' | 'notes'>[] = [
  {
    name: 'Zone A – East Underground',
    stations: 'Laird → Mt Pleasant',
    surfaceTemp: 11,
  },
  {
    name: 'Zone B – Central Underground',
    stations: 'Mt Pleasant → Allen',
    surfaceTemp: 10,
  },
  {
    name: 'Zone C – West Underground',
    stations: 'Allen → Kingsway',
    surfaceTemp: 10,
  },
  {
    name: 'Zone D – Surface / At-Grade',
    stations: 'Kennedy → Laird & Kingsway → Airport Corporate Centre',
    surfaceTemp: -99, // uses ambient — always managed by ventilation
  },
]

export function getRisk(dewPoint: number, surfaceTemp: number): RiskLevel {
  if (surfaceTemp === -99) return 'LOW' // surface zones: no tunnel condensation
  const margin = surfaceTemp - dewPoint
  if (margin <= 0) return 'CRITICAL'
  if (margin <= 2) return 'HIGH'
  if (margin <= 5) return 'MODERATE'
  return 'LOW'
}

export function riskColour(risk: RiskLevel) {
  switch (risk) {
    case 'CRITICAL': return { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-600', dot: 'bg-red-500' }
    case 'HIGH':     return { bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-500', dot: 'bg-orange-400' }
    case 'MODERATE': return { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: 'bg-yellow-400', dot: 'bg-yellow-400' }
    case 'LOW':      return { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-500', dot: 'bg-green-400' }
  }
}

export function riskLabel(risk: RiskLevel): string {
  switch (risk) {
    case 'CRITICAL': return 'Critical — Condensation Forming'
    case 'HIGH':     return 'High — Imminent Risk'
    case 'MODERATE': return 'Moderate — Monitor'
    case 'LOW':      return 'Low — Clear'
  }
}

export function zoneNotes(risk: RiskLevel): string {
  switch (risk) {
    case 'CRITICAL': return 'Active condensation expected. Ventilation ramp-up and slip-hazard protocols required before revenue service.'
    case 'HIGH':     return 'Condensation imminent. Increase ventilation rate and inspect rail head and platform surfaces.'
    case 'MODERATE': return 'Conditions within watch threshold. Monitor tunnel sensors and stand by ventilation adjustment.'
    case 'LOW':      return 'Conditions normal. Standard ventilation programme applies.'
  }
}

export interface WeatherData {
  fetchedAt: string
  forecastDate: string
  hourly: HourlyReading[]
  am5Reading: HourlyReading | null
  overallRisk: RiskLevel
  zones: ZoneStatus[]
}

export async function fetchCondensationForecast(): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832' +
      '&hourly=temperature_2m,relative_humidity_2m,dew_point_2m' +
      '&forecast_days=1&timezone=America%2FToronto',
      { next: { revalidate: 1800 } } // cache 30 min
    )
    if (!res.ok) return null
    const json = await res.json()

    const times: string[] = json.hourly.time
    const temps: number[] = json.hourly.temperature_2m
    const humidity: number[] = json.hourly.relative_humidity_2m
    const dewPoints: number[] = json.hourly.dew_point_2m

    const hourly: HourlyReading[] = times.map((t, i) => {
      const hour = new Date(t).getHours()
      // Use Zone B (central underground, 10°C) as reference for hourly risk
      const surfaceTemp = 10
      const dp = Math.round(dewPoints[i] * 10) / 10
      const margin = Math.round((surfaceTemp - dp) * 10) / 10
      return {
        hour,
        time: t.slice(11, 16),
        temperature: Math.round(temps[i] * 10) / 10,
        dewPoint: dp,
        humidity: Math.round(humidity[i]),
        risk: getRisk(dp, surfaceTemp),
        margin,
      }
    })

    const am5Reading = hourly.find(h => h.hour === 5) ?? null

    // Overall risk = worst across all 24h (for tunnel zones)
    const riskOrder: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
    const overallRisk = hourly.reduce<RiskLevel>((worst, h) => {
      return riskOrder.indexOf(h.risk) > riskOrder.indexOf(worst) ? h.risk : worst
    }, 'LOW')

    // Use 5 AM dew point for zone assessment; fallback to worst of night hours
    const refDp = am5Reading?.dewPoint ?? Math.max(...dewPoints.slice(0, 8).map(d => Math.round(d * 10) / 10))

    const zones: ZoneStatus[] = TUNNEL_ZONES.map(z => {
      const risk = getRisk(refDp, z.surfaceTemp)
      return { ...z, risk, notes: zoneNotes(risk) }
    })

    const forecastDate = times[0]?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)

    return {
      fetchedAt: new Date().toISOString(),
      forecastDate,
      hourly,
      am5Reading,
      overallRisk,
      zones,
    }
  } catch {
    return null
  }
}
