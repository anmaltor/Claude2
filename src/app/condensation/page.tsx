'use client'

import { useEffect, useState } from 'react'

interface HourlyData {
  time: string[]
  temperature_2m: number[]
  relativehumidity_2m: number[]
  dewpoint_2m: number[]
  precipitation_probability: number[]
  precipitation: number[]
  windspeed_10m: number[]
}

interface WeatherResponse {
  hourly: HourlyData
  timezone: string
}

interface ForecastHour {
  time: string
  temperature: number
  humidity: number
  dewpoint: number
  precipitationProbability: number
  precipitation: number
  windspeed: number
  dewpointSpread: number
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
}

function calcRisk(temp: number, dewpoint: number, humidity: number): ForecastHour['riskLevel'] {
  const spread = temp - dewpoint
  if (spread < 1.5 || humidity >= 95) return 'CRITICAL'
  if (spread < 3 || humidity >= 88) return 'HIGH'
  if (spread < 6 || humidity >= 75) return 'MODERATE'
  return 'LOW'
}

const riskColors: Record<ForecastHour['riskLevel'], string> = {
  CRITICAL: 'bg-red-100 border-red-500 text-red-800',
  HIGH: 'bg-orange-100 border-orange-500 text-orange-800',
  MODERATE: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  LOW: 'bg-green-100 border-green-500 text-green-800',
}

const riskBadge: Record<ForecastHour['riskLevel'], string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MODERATE: 'bg-yellow-400 text-gray-900',
  LOW: 'bg-green-500 text-white',
}

const riskOpsAction: Record<ForecastHour['riskLevel'], string> = {
  CRITICAL:
    'Implement speed restrictions. Activate sanding systems. Issue Slippery Rail Notice to OCC and all drivers. Delay revenue service start pending track inspection.',
  HIGH:
    'Alert OCC and drivers. Pre-position sand cars. Conduct early track inspection. Monitor adhesion reports in real time.',
  MODERATE:
    'Issue advisory to drivers. Confirm sanding system readiness. OCC to monitor incident reports.',
  LOW: 'Normal operations. Routine pre-service track inspection applies.',
}

export default function CondensationPage() {
  const [forecast, setForecast] = useState<ForecastHour[]>([])
  const [fiveAmStatus, setFiveAmStatus] = useState<ForecastHour | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string>('')
  const [today, setToday] = useState<string>('')

  useEffect(() => {
    async function loadForecast() {
      try {
        const url =
          'https://api.open-meteo.com/v1/forecast' +
          '?latitude=43.6532&longitude=-79.3832' +
          '&hourly=temperature_2m,relativehumidity_2m,dewpoint_2m,precipitation_probability,precipitation,windspeed_10m' +
          '&timezone=America%2FToronto' +
          '&forecast_days=2'

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
        const data: WeatherResponse = await res.json()

        const now = new Date()
        const todayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD

        const hours: ForecastHour[] = data.hourly.time
          .map((t, i) => {
            const temp = data.hourly.temperature_2m[i]
            const dewpoint = data.hourly.dewpoint_2m[i]
            const humidity = data.hourly.relativehumidity_2m[i]
            return {
              time: t,
              temperature: temp,
              humidity,
              dewpoint,
              precipitationProbability: data.hourly.precipitation_probability[i],
              precipitation: data.hourly.precipitation[i],
              windspeed: data.hourly.windspeed_10m[i],
              dewpointSpread: parseFloat((temp - dewpoint).toFixed(1)),
              riskLevel: calcRisk(temp, dewpoint, humidity),
            }
          })
          .filter((h) => h.time.startsWith(todayStr))

        setForecast(hours)
        setToday(todayStr)

        const fiveAm = hours.find((h) => h.time.endsWith('T05:00'))
        setFiveAmStatus(fiveAm ?? null)

        setFetchedAt(
          now.toLocaleTimeString('en-CA', {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
            timeZone: 'America/Toronto',
          })
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast')
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [])

  const formatHour = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Toronto',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Condensation Forecast</h1>
          <p className="text-gray-600 mt-1">
            Eglinton Crosstown LRT — Toronto, ON &nbsp;|&nbsp; Rail Head Adhesion Risk Assessment
          </p>
          {fetchedAt && (
            <p className="text-xs text-gray-400 mt-1">Last updated: {fetchedAt}</p>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <div className="text-gray-500">Loading live forecast data…</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 5 AM Status — hero card */}
            <div
              className={`rounded-xl shadow-lg border-l-8 p-8 mb-8 ${
                fiveAmStatus ? riskColors[fiveAmStatus.riskLevel] : 'bg-gray-100 border-gray-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider opacity-70 mb-1">
                    Daily 5 AM Pre-Service Status
                  </p>
                  <h2 className="text-4xl font-bold">
                    {today
                      ? new Date(today + 'T00:00').toLocaleDateString('en-CA', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'America/Toronto',
                        })
                      : '—'}
                  </h2>
                </div>
                {fiveAmStatus && (
                  <span
                    className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${
                      riskBadge[fiveAmStatus.riskLevel]
                    }`}
                  >
                    {fiveAmStatus.riskLevel} RISK
                  </span>
                )}
              </div>

              {fiveAmStatus ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <Stat label="Air Temp" value={`${fiveAmStatus.temperature}°C`} />
                    <Stat label="Dew Point" value={`${fiveAmStatus.dewpoint}°C`} />
                    <Stat label="Spread" value={`${fiveAmStatus.dewpointSpread}°C`} />
                    <Stat label="Humidity" value={`${fiveAmStatus.humidity}%`} />
                  </div>
                  <div className="mt-6 p-4 bg-white bg-opacity-60 rounded-lg">
                    <p className="text-sm font-semibold uppercase tracking-wide mb-1">
                      Operational Action
                    </p>
                    <p className="text-base leading-relaxed">
                      {riskOpsAction[fiveAmStatus.riskLevel]}
                    </p>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-gray-500 italic">
                  5 AM data not available for today&apos;s forecast window.
                </p>
              )}
            </div>

            {/* How risk is calculated */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Risk Calculation Methodology</h3>
              <p className="text-sm text-gray-600 mb-3">
                Rail head condensation forms when surface temperature falls below the dew point, creating an
                ultra-thin water film that dramatically reduces wheel–rail adhesion (effective CoF can drop
                from ~0.35 to &lt;0.05). The dew point spread (air temp − dew point) is the primary
                operational trigger used in European and North American rail safety frameworks.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <RiskKey level="CRITICAL" label="Spread < 1.5°C or RH ≥ 95%" />
                <RiskKey level="HIGH" label="Spread < 3°C or RH ≥ 88%" />
                <RiskKey level="MODERATE" label="Spread < 6°C or RH ≥ 75%" />
                <RiskKey level="LOW" label="Spread ≥ 6°C and RH < 75%" />
              </div>
            </div>

            {/* Hourly table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Hourly Forecast — {today}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-right">Temp (°C)</th>
                      <th className="px-4 py-3 text-right">Dew Pt (°C)</th>
                      <th className="px-4 py-3 text-right">Spread (°C)</th>
                      <th className="px-4 py-3 text-right">RH (%)</th>
                      <th className="px-4 py-3 text-right">Precip (%)</th>
                      <th className="px-4 py-3 text-right">Wind (km/h)</th>
                      <th className="px-4 py-3 text-center">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((h) => {
                      const isFiveAm = h.time.endsWith('T05:00')
                      return (
                        <tr
                          key={h.time}
                          className={`border-t border-gray-100 ${isFiveAm ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-2 text-left whitespace-nowrap">
                            {formatHour(h.time)}
                            {isFiveAm && (
                              <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                                5 AM
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">{h.temperature}</td>
                          <td className="px-4 py-2 text-right">{h.dewpoint}</td>
                          <td className="px-4 py-2 text-right">{h.dewpointSpread}</td>
                          <td className="px-4 py-2 text-right">{h.humidity}</td>
                          <td className="px-4 py-2 text-right">{h.precipitationProbability}</td>
                          <td className="px-4 py-2 text-right">{h.windspeed}</td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${riskBadge[h.riskLevel]}`}
                            >
                              {h.riskLevel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Context note */}
            <div className="bg-white rounded-lg shadow-md p-6 text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">Data Source</p>
              <p>
                Meteorological data provided by{' '}
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open-Meteo
                </a>{' '}
                (CC BY 4.0). Station coordinates: Toronto, ON (43.65°N, 79.38°W). This page is for
                demonstration purposes — production rail operations require certified meteorological
                data feeds integrated directly into the OCC.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
      <p className="text-xs uppercase tracking-wide opacity-70 mb-0.5">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function RiskKey({ level, label }: { level: ForecastHour['riskLevel']; label: string }) {
  return (
    <div className={`rounded p-2 border ${riskColors[level]}`}>
      <p className={`text-xs font-bold mb-0.5 inline-block px-1.5 py-0.5 rounded ${riskBadge[level]}`}>
        {level}
      </p>
      <p className="text-xs mt-1">{label}</p>
    </div>
  )
}
