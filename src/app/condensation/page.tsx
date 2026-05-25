import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Condensation Forecast — ECLRT Operations',
  description: 'Daily 5 AM condensation risk forecast for Eglinton Crosstown LRT operational zones.',
}

export const dynamic = 'force-dynamic'

type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical'

interface HourlyWeather {
  time: string[]
  temperature_2m: number[]
  relative_humidity_2m: number[]
  dew_point_2m: number[]
}

interface ForecastPayload {
  hourly: HourlyWeather
}

interface ZoneStatus {
  name: string
  description: string
  risk: RiskLevel
  dewPointDepression: number
  note: string
}

interface HourlyRow {
  time: string
  label: string
  temp: number
  rh: number
  dewPoint: number
  atGradeRisk: RiskLevel
  tunnelRisk: RiskLevel
  is5am: boolean
  isCurrent: boolean
}

const RISK_COLOR: Record<RiskLevel, { bg: string; border: string; text: string; badge: string }> = {
  Low:      { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-800',  badge: 'bg-green-100 text-green-800'  },
  Moderate: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800' },
  High:     { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800' },
  Critical: { bg: 'bg-red-50',    border: 'border-red-400',    text: 'text-red-800',    badge: 'bg-red-100 text-red-800'      },
}

const RISK_DOT: Record<RiskLevel, string> = {
  Low: 'bg-green-500',
  Moderate: 'bg-yellow-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-600',
}

function atGradeRisk(temp: number, dewPoint: number): RiskLevel {
  const d = temp - dewPoint
  if (d < 1) return 'Critical'
  if (d < 3) return 'High'
  if (d < 6) return 'Moderate'
  return 'Low'
}

function tunnelRisk(outsideDewPoint: number): RiskLevel {
  // ECLRT bore tunnel: thermal mass ~17 °C year-round
  const depression = 17 - outsideDewPoint
  if (depression < 0) return 'Critical'
  if (depression < 2) return 'High'
  if (depression < 5) return 'Moderate'
  return 'Low'
}

function overallRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ['Low', 'Moderate', 'High', 'Critical']
  return order[Math.max(order.indexOf(a), order.indexOf(b))]
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals)
}

function torontoHour(isoTime: string): number {
  // Open-Meteo returns times in the requested timezone as local ISO strings
  const d = new Date(isoTime)
  return d.getHours()
}

async function fetchWeather(): Promise<ForecastPayload | null> {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=43.7001&longitude=-79.4163' +
      '&hourly=temperature_2m,relative_humidity_2m,dew_point_2m' +
      '&timezone=America%2FToronto' +
      '&forecast_days=2'
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    return res.json() as Promise<ForecastPayload>
  } catch {
    return null
  }
}

export default async function CondensationPage() {
  const data = await fetchWeather()

  // Toronto time now
  const nowUtc = new Date()
  const nowET = new Date(nowUtc.toLocaleString('en-US', { timeZone: 'America/Toronto' }))
  const todayStr = nowET.toISOString().slice(0, 10)

  let rows: HourlyRow[] = []
  let fiveAmRow: HourlyRow | null = null
  let currentRow: HourlyRow | null = null

  if (data) {
    const { time, temperature_2m, relative_humidity_2m, dew_point_2m } = data.hourly

    for (let i = 0; i < time.length; i++) {
      const t = time[i]
      if (!t.startsWith(todayStr)) continue

      const hour = torontoHour(t)
      const temp = temperature_2m[i]
      const rh = relative_humidity_2m[i]
      const dp = dew_point_2m[i]

      const is5am = hour === 5
      const isCurrent = hour === nowET.getHours()

      const label = hour === 0 ? '12 AM' :
        hour < 12 ? `${hour} AM` :
        hour === 12 ? '12 PM' :
        `${hour - 12} PM`

      const row: HourlyRow = {
        time: t,
        label,
        temp,
        rh,
        dewPoint: dp,
        atGradeRisk: atGradeRisk(temp, dp),
        tunnelRisk: tunnelRisk(dp),
        is5am,
        isCurrent,
      }
      rows.push(row)
      if (is5am) fiveAmRow = row
      if (isCurrent) currentRow = row
    }
  }

  const ref = fiveAmRow ?? currentRow ?? rows[0] ?? null

  const zones: ZoneStatus[] = ref
    ? [
        {
          name: 'Underground Bore',
          description: 'Forest Hill ↔ Science Centre (deep tunnel)',
          risk: tunnelRisk(ref.dewPoint),
          dewPointDepression: parseFloat(fmt(17 - ref.dewPoint)),
          note: 'Tunnel wall ~17 °C. Risk when outside dew point approaches wall temp.',
        },
        {
          name: 'Station Concourses',
          description: 'All underground & portal stations',
          risk: overallRisk(atGradeRisk(ref.temp, ref.dewPoint), tunnelRisk(ref.dewPoint)),
          dewPointDepression: parseFloat(fmt(ref.temp - ref.dewPoint)),
          note: 'Mixed conditioned/ambient air. Monitor stairwells and platform edges.',
        },
        {
          name: 'At-Grade & Yard',
          description: 'Surface stations + Whitby Yard (YCC)',
          risk: atGradeRisk(ref.temp, ref.dewPoint),
          dewPointDepression: parseFloat(fmt(ref.temp - ref.dewPoint)),
          note: 'Fully exposed to ambient. Track adhesion and switch heater focus.',
        },
      ]
    : []

  const systemRisk: RiskLevel = zones.length
    ? zones.reduce<RiskLevel>((acc, z) => overallRisk(acc, z.risk), 'Low')
    : 'Low'

  const now5amLabel = fiveAmRow
    ? `${todayStr} 05:00 ET`
    : `Live — ${nowET.getHours()}:00 ET`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: '#0087C3' }} className="text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">
                ECLRT Operations · CTSM
              </p>
              <h1 className="text-3xl font-bold">Condensation Forecast</h1>
              <p className="mt-1 text-sm opacity-80">
                Daily 5 AM snapshot — Toronto, ON · {todayStr}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70 mb-1 uppercase tracking-wide">System Risk</p>
              <span
                className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
                  systemRisk === 'Critical'
                    ? 'bg-red-600 text-white'
                    : systemRisk === 'High'
                    ? 'bg-orange-500 text-white'
                    : systemRisk === 'Moderate'
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-green-400 text-gray-900'
                }`}
              >
                {systemRisk}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* 5 AM Snapshot */}
        {ref ? (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              5 AM Conditions Snapshot
              <span className="ml-2 text-sm font-normal text-gray-400">{now5amLabel}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Temperature', value: `${fmt(ref.temp)} °C`, sub: '' },
                { label: 'Relative Humidity', value: `${fmt(ref.rh, 0)} %`, sub: '' },
                { label: 'Dew Point', value: `${fmt(ref.dewPoint)} °C`, sub: '' },
                { label: 'Dew Pt. Depression', value: `${fmt(ref.temp - ref.dewPoint)} °C`, sub: '(temp − dew pt)' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-2xl font-bold" style={{ color: '#0087C3' }}>{item.value}</p>
                  {item.sub && <p className="text-xs text-gray-400 mt-1">{item.sub}</p>}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-800 text-sm">
            Weather data unavailable. Check network connectivity or retry later.
          </div>
        )}

        {/* Zone Status Cards */}
        {zones.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Zone Risk Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {zones.map((zone) => {
                const c = RISK_COLOR[zone.risk]
                return (
                  <div
                    key={zone.name}
                    className={`rounded-lg border-2 ${c.bg} ${c.border} p-5 shadow-sm`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-bold text-base ${c.text}`}>{zone.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{zone.description}</p>
                      </div>
                      <span className={`ml-2 flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
                        <span className={`w-2 h-2 rounded-full ${RISK_DOT[zone.risk]}`} />
                        {zone.risk}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Dew pt. depression: <span className="font-semibold">{zone.dewPointDepression} °C</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2 italic">{zone.note}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Risk Legend */}
        <section className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Risk Thresholds</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {([
              ['Low', 'Depression > 6 °C / Tunnel DP < 12 °C', 'bg-green-500'],
              ['Moderate', 'Depression 3–6 °C / Tunnel DP 12–15 °C', 'bg-yellow-500'],
              ['High', 'Depression 1–3 °C / Tunnel DP 15–17 °C', 'bg-orange-500'],
              ['Critical', 'Depression < 1 °C / Tunnel DP > 17 °C', 'bg-red-600'],
            ] as const).map(([level, desc, dot]) => (
              <div key={level} className="flex items-start gap-2">
                <span className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />
                <div>
                  <p className="font-semibold text-gray-700">{level}</p>
                  <p className="text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hourly Forecast Table */}
        {rows.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Hourly Forecast — Today</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3">Time</th>
                    <th className="text-right px-4 py-3">Temp (°C)</th>
                    <th className="text-right px-4 py-3">RH (%)</th>
                    <th className="text-right px-4 py-3">Dew Pt (°C)</th>
                    <th className="text-right px-4 py-3">Depression</th>
                    <th className="text-center px-4 py-3">At-Grade</th>
                    <th className="text-center px-4 py-3">Tunnel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const highlight5am = row.is5am
                    const highlightNow = row.isCurrent && !row.is5am
                    return (
                      <tr
                        key={row.time}
                        className={
                          highlight5am
                            ? 'bg-blue-50 font-semibold'
                            : highlightNow
                            ? 'bg-amber-50'
                            : 'bg-white hover:bg-gray-50'
                        }
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="font-medium text-gray-800">{row.label}</span>
                          {highlight5am && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#0087C3', color: 'white' }}>
                              5 AM
                            </span>
                          )}
                          {highlightNow && (
                            <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                              Now
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{fmt(row.temp)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{fmt(row.rh, 0)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{fmt(row.dewPoint)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{fmt(row.temp - row.dewPoint)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <RiskBadge risk={row.atGradeRisk} />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <RiskBadge risk={row.tunnelRisk} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Footer note */}
        <p className="text-xs text-gray-400 pb-4">
          Weather source: Open-Meteo · Toronto (43.70 N, 79.42 W) · Refreshes every page load ·
          Tunnel wall reference temperature: 17 °C (ECLRT bore thermal mass). For operational decisions
          consult the OCC and site-specific readings.
        </p>
      </div>
    </div>
  )
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const c = RISK_COLOR[risk]
  const dot = RISK_DOT[risk]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {risk}
    </span>
  )
}
