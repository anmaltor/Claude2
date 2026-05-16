import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Condensation Forecast | ECLRT Operations',
  description: 'Daily 5 AM condensation and low adhesion risk forecast for Eglinton Crosstown LRT operations',
}

export const revalidate = 1800

interface HourData {
  time: string
  temp: number
  humidity: number
  dewpoint: number
  precipProb: number
  precip: number
}

interface WeatherResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    relativehumidity_2m: number[]
    dewpoint_2m: number[]
    precipitation_probability: number[]
    precipitation: number[]
  }
}

function getRisk(temp: number, dewpoint: number, precipProb: number) {
  const spread = temp - dewpoint
  if (temp <= 0) {
    return {
      level: 'CRITICAL' as const,
      color: 'text-red-700',
      bg: 'bg-red-50 border-red-500',
      pill: 'bg-red-100 text-red-700',
      desc: 'Frost/Ice Risk — Rail surface freezing conditions',
    }
  }
  if (spread < 2 || precipProb > 70) {
    return {
      level: 'CRITICAL' as const,
      color: 'text-red-700',
      bg: 'bg-red-50 border-red-500',
      pill: 'bg-red-100 text-red-700',
      desc: 'Condensation near-certain — Activate Low Adhesion protocols',
    }
  }
  if (spread < 4 || precipProb > 50) {
    return {
      level: 'HIGH' as const,
      color: 'text-orange-700',
      bg: 'bg-orange-50 border-orange-500',
      pill: 'bg-orange-100 text-orange-700',
      desc: 'High condensation probability — Alert drivers, standby sand dispensers',
    }
  }
  if (spread < 8 || precipProb > 30) {
    return {
      level: 'MEDIUM' as const,
      color: 'text-yellow-700',
      bg: 'bg-yellow-50 border-yellow-500',
      pill: 'bg-yellow-100 text-yellow-700',
      desc: 'Moderate risk — Monitor OCC reports, pre-position resources',
    }
  }
  return {
    level: 'LOW' as const,
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-500',
    pill: 'bg-green-100 text-green-700',
    desc: 'Normal operations — Standard adhesion conditions expected',
  }
}

async function getWeatherData(): Promise<WeatherResponse | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&hourly=temperature_2m,relativehumidity_2m,dewpoint_2m,precipitation_probability,precipitation&timezone=America%2FToronto&forecast_days=2',
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function CondensationPage() {
  const data = await getWeatherData()

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const fiveAmTag = `${tomorrowStr}T05:00`
  const fiveAmIndex = data?.hourly.time.findIndex(t => t === fiveAmTag) ?? -1

  const morningHours: HourData[] = fiveAmIndex >= 0
    ? Array.from({ length: 6 }, (_, i) => ({
        time: data!.hourly.time[fiveAmIndex + i],
        temp: data!.hourly.temperature_2m[fiveAmIndex + i],
        humidity: data!.hourly.relativehumidity_2m[fiveAmIndex + i],
        dewpoint: data!.hourly.dewpoint_2m[fiveAmIndex + i],
        precipProb: data!.hourly.precipitation_probability[fiveAmIndex + i],
        precip: data!.hourly.precipitation[fiveAmIndex + i],
      }))
    : []

  const fiveAm = morningHours[0]
  const risk = fiveAm ? getRisk(fiveAm.temp, fiveAm.dewpoint, fiveAm.precipProb) : null

  const generatedAt = new Date().toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const metrics = fiveAm
    ? [
        {
          label: 'Dew Point',
          value: `${fiveAm.dewpoint.toFixed(1)}°C`,
          sub: `Spread: ${(fiveAm.temp - fiveAm.dewpoint).toFixed(1)}°C`,
        },
        {
          label: 'Humidity',
          value: `${fiveAm.humidity}%`,
          sub: fiveAm.humidity > 90 ? 'Near saturation' : fiveAm.humidity > 75 ? 'Elevated' : 'Normal',
        },
        {
          label: 'Precip. Prob.',
          value: `${fiveAm.precipProb}%`,
          sub: fiveAm.precipProb > 50 ? 'Likely precipitation' : 'Dry expected',
        },
        {
          label: 'Precipitation',
          value: `${fiveAm.precip.toFixed(1)} mm`,
          sub: '1-hour accumulation',
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Condensation Forecast</h1>
              <p className="text-gray-600">Eglinton Crosstown LRT — Toronto Operations</p>
              <p className="text-sm text-gray-500 mt-2">5 AM Service Start Assessment · {tomorrowStr}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Generated: {generatedAt}</p>
              <p className="text-xs mt-1">Open-Meteo · America/Toronto</p>
            </div>
          </div>
        </div>

        {!data || !fiveAm ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Weather data temporarily unavailable. Please refresh.
          </div>
        ) : (
          <>
            {/* Risk Banner */}
            <div className={`rounded-lg border-l-4 p-6 mb-6 shadow-md ${risk!.bg}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">5 AM Risk Level</p>
                  <p className={`text-4xl font-bold ${risk!.color}`}>{risk!.level}</p>
                  <p className={`text-sm mt-2 font-medium ${risk!.color}`}>{risk!.desc}</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-800">{fiveAm.temp.toFixed(1)}°C</p>
                  <p className="text-sm text-gray-500 mt-1">Temperature at 05:00</p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {metrics.map(m => (
                <div key={m.label} className="bg-white rounded-lg shadow-md p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Morning Hourly Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Morning Operations Window (05:00–10:00)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                      <th className="pb-2 text-left">Time</th>
                      <th className="pb-2 text-right">Temp</th>
                      <th className="pb-2 text-right">Dew Pt</th>
                      <th className="pb-2 text-right">Spread</th>
                      <th className="pb-2 text-right">RH%</th>
                      <th className="pb-2 text-right">Precip%</th>
                      <th className="pb-2 text-center">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {morningHours.map((h, i) => {
                      const hr = getRisk(h.temp, h.dewpoint, h.precipProb)
                      const label = h.time.split('T')[1]
                      return (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 font-mono font-medium">{label}</td>
                          <td className="py-2 text-right">{h.temp.toFixed(1)}°C</td>
                          <td className="py-2 text-right">{h.dewpoint.toFixed(1)}°C</td>
                          <td className="py-2 text-right">{(h.temp - h.dewpoint).toFixed(1)}°C</td>
                          <td className="py-2 text-right">{h.humidity}%</td>
                          <td className="py-2 text-right">{h.precipProb}%</td>
                          <td className="py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${hr.pill}`}>
                              {hr.level}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operational Guidance */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Operational Guidance</h2>
              <div className="space-y-2 text-sm text-gray-700">
                {risk!.level === 'CRITICAL' && (
                  <>
                    <p className="font-semibold text-red-700">IMMEDIATE ACTIONS REQUIRED</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Activate Low Adhesion Management Protocol</li>
                      <li>Brief all Train Operators via pre-service bulletin</li>
                      <li>Confirm sand dispenser activation and sand levels at key locations</li>
                      <li>Increase headway buffer by 2–3 minutes at service start</li>
                      <li>Alert OCC — monitor real-time reports for slip/slide incidents</li>
                      <li>Notify Control Room to prepare for extended dwell times</li>
                    </ul>
                  </>
                )}
                {risk!.level === 'HIGH' && (
                  <>
                    <p className="font-semibold text-orange-700">PRECAUTIONARY ACTIONS</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Issue Low Adhesion advisory to all Train Operators</li>
                      <li>Verify sand dispensers are operational and stocked</li>
                      <li>OCC to monitor for slip/slide events during first hour of service</li>
                      <li>Standby Failure Management team on reduced response SLA</li>
                    </ul>
                  </>
                )}
                {risk!.level === 'MEDIUM' && (
                  <>
                    <p className="font-semibold text-yellow-700">MONITORING ACTIONS</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Standard pre-service adhesion checks</li>
                      <li>OCC to log any driver-reported adhesion issues</li>
                      <li>Review forecast at 04:00 for any deterioration</li>
                    </ul>
                  </>
                )}
                {risk!.level === 'LOW' && (
                  <>
                    <p className="font-semibold text-green-700">STANDARD OPERATIONS</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Normal pre-service checks apply</li>
                      <li>No additional adhesion-related actions required</li>
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Risk Methodology — Dew Point Spread</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  { level: 'LOW', desc: 'Spread > 8°C', cls: 'text-green-700 bg-green-50 border border-green-200' },
                  { level: 'MEDIUM', desc: 'Spread 4–8°C', cls: 'text-yellow-700 bg-yellow-50 border border-yellow-200' },
                  { level: 'HIGH', desc: 'Spread 2–4°C', cls: 'text-orange-700 bg-orange-50 border border-orange-200' },
                  { level: 'CRITICAL', desc: 'Spread < 2°C or frost', cls: 'text-red-700 bg-red-50 border border-red-200' },
                ].map(l => (
                  <div key={l.level} className={`rounded p-2 text-center ${l.cls}`}>
                    <p className="font-bold">{l.level}</p>
                    <p className="text-gray-500 mt-0.5">{l.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Spread = Temperature − Dew Point. Precipitation probability and sub-zero temperature override the spread thresholds.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
