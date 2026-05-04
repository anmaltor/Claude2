interface WeatherData {
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    dew_point_2m: number[]
  }
}

async function getWeatherData(): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&hourly=temperature_2m,relative_humidity_2m,dew_point_2m&timezone=America%2FToronto&forecast_days=2',
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

type RiskLevel = 'CLEAR' | 'ADVISORY' | 'WARNING' | 'CRITICAL'

const RISK_LEVELS: RiskLevel[] = ['CLEAR', 'ADVISORY', 'WARNING', 'CRITICAL']

function getRiskLevel(dpd: number): RiskLevel {
  if (dpd <= 0) return 'CRITICAL'
  if (dpd <= 2) return 'WARNING'
  if (dpd <= 5) return 'ADVISORY'
  return 'CLEAR'
}

const riskConfig: Record<RiskLevel, {
  badge: string; border: string; bg: string; text: string; dot: string; label: string; sublabel: string
}> = {
  CRITICAL: {
    badge: 'bg-red-600 text-white',
    border: 'border-red-500',
    bg: 'bg-red-950',
    text: 'text-red-300',
    dot: 'bg-red-500',
    label: 'CRITICAL',
    sublabel: 'Active Condensation Present',
  },
  WARNING: {
    badge: 'bg-orange-500 text-white',
    border: 'border-orange-400',
    bg: 'bg-orange-950',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
    label: 'WARNING',
    sublabel: 'High Condensation Risk',
  },
  ADVISORY: {
    badge: 'bg-yellow-500 text-black',
    border: 'border-yellow-400',
    bg: 'bg-yellow-950',
    text: 'text-yellow-300',
    dot: 'bg-yellow-400',
    label: 'ADVISORY',
    sublabel: 'Moderate Risk — Monitor Closely',
  },
  CLEAR: {
    badge: 'bg-green-600 text-white',
    border: 'border-green-500',
    bg: 'bg-green-950',
    text: 'text-green-300',
    dot: 'bg-green-500',
    label: 'CLEAR',
    sublabel: 'Normal Operating Conditions',
  },
}

const recommendations: Record<RiskLevel, string[]> = {
  CRITICAL: [
    'Reduce maximum operating speed on all surface sections by 15 km/h',
    'Activate sand dispensing systems on all CAF Urbos 100 vehicles immediately',
    'Deploy inspection team to all surface-to-tunnel transition points (Mt Dennis, Laird, Kennedy)',
    'OCC: Increase headway buffers by 2 minutes across the full network',
    'YCC: Apply rail adhesion compound on surface track before 05:30',
    'Alert all drivers: Extend braking distances — low adhesion conditions confirmed',
  ],
  WARNING: [
    'Pre-position maintenance vehicles at Mount Dennis and Kennedy termini',
    'Alert all drivers: Potential low adhesion on surface sections',
    'OCC: Standby for headway adjustments if wheel slip events are reported',
    'Monitor tunnel portal transition points at 30-minute intervals',
    'Sand dispensing systems armed — activate immediately upon first wheel slip event',
  ],
  ADVISORY: [
    'Standard precautionary monitoring of all surface sections',
    'Drivers briefed on potential early-morning condensation at pre-service briefing',
    'Track inspection team on advisory notice — no deployment required',
    'Normal speed restrictions apply — no additional adjustments required',
  ],
  CLEAR: [
    'Normal operations — standard monitoring protocols in effect',
    'No restrictions or special precautions required',
  ],
}

const networkSections = [
  { name: 'Western Surface — Mount Dennis to Keelesdale', type: 'surface' as const, tunnelOffset: 0 },
  { name: 'Underground Tunnel — Mount Dennis to Laird', type: 'tunnel' as const, tunnelOffset: 2, note: 'Controlled environment; risk concentrated at portal entry/exit points only' },
  { name: 'Eastern Surface — Laird to Kennedy', type: 'surface' as const, tunnelOffset: 0 },
]

function getSectionRisk(baseLevel: RiskLevel, tunnelOffset: number): RiskLevel {
  const idx = Math.max(0, RISK_LEVELS.indexOf(baseLevel) - tunnelOffset)
  return RISK_LEVELS[idx]
}

export default async function CondensationForecast() {
  const weather = await getWeatherData()

  const now = new Date()

  const todayLabel = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  }).format(now)

  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto', hour: 'numeric', hour12: false,
    }).format(now)
  )

  const isTomorrow = currentHour >= 10
  const baseIndex = isTomorrow ? 24 : 0
  const forecastLabel = isTomorrow ? 'Tomorrow Morning' : 'This Morning'

  type MorningSlot = {
    hour: number; time: string; temp: number; dewPoint: number
    humidity: number; dpd: number; risk: RiskLevel
  }

  const morningSlots: MorningSlot[] = weather
    ? [4, 5, 6, 7, 8, 9, 10].map((h) => {
        const idx = baseIndex + h
        const temp = weather.hourly.temperature_2m[idx]
        const dewPoint = weather.hourly.dew_point_2m[idx]
        const humidity = weather.hourly.relative_humidity_2m[idx]
        const dpd = Math.round((temp - dewPoint) * 10) / 10
        return { hour: h, time: `${String(h).padStart(2, '0')}:00`, temp, dewPoint, humidity, dpd, risk: getRiskLevel(dpd) }
      })
    : []

  const fiveAmSlot = morningSlots.find((s) => s.hour === 5)
  const primaryLevel: RiskLevel = fiveAmSlot ? fiveAmSlot.risk : 'CLEAR'
  const primaryConfig = riskConfig[primaryLevel]

  const peakRisk = morningSlots.reduce<RiskLevel>(
    (worst, slot) => RISK_LEVELS.indexOf(slot.risk) > RISK_LEVELS.indexOf(worst) ? slot.risk : worst,
    'CLEAR'
  )

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
                ECLRT — Operations Control Brief
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Daily 5 AM Condensation Forecast
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                Eglinton Crosstown LRT · Toronto, Ontario · {todayLabel}
              </p>
            </div>
            <div className={`hidden sm:flex flex-col items-center px-5 py-3 rounded-lg border-2 flex-shrink-0 ${primaryConfig.border} ${primaryConfig.bg}`}>
              <span className={`text-xs font-mono font-bold tracking-widest ${primaryConfig.text}`}>05:00 STATUS</span>
              <span className={`text-2xl font-black mt-1 ${primaryConfig.text}`}>{primaryConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {!weather && (
          <div className="bg-gray-800 border border-yellow-500 rounded-lg p-6">
            <p className="text-yellow-400 font-semibold">Weather data unavailable — check network connectivity.</p>
          </div>
        )}

        {/* Primary Status Banner */}
        {fiveAmSlot && (
          <div className={`rounded-lg border-2 ${primaryConfig.border} ${primaryConfig.bg} p-6`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${primaryConfig.badge}`}>
                    <span className="w-2 h-2 rounded-full bg-white opacity-80"></span>
                    {primaryConfig.label}
                  </span>
                  <span className={`text-sm font-medium ${primaryConfig.text}`}>{primaryConfig.sublabel}</span>
                </div>
                <p className={`mt-2 text-sm ${primaryConfig.text} opacity-80`}>
                  {forecastLabel} · Peak risk window: <strong>{riskConfig[peakRisk].label}</strong>
                </p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className={`text-xs font-mono uppercase tracking-wide ${primaryConfig.text} opacity-60`}>Dew Point Depression</p>
                  <p className={`text-3xl font-black font-mono ${primaryConfig.text}`}>
                    {fiveAmSlot.dpd > 0 ? '+' : ''}{fiveAmSlot.dpd}°C
                  </p>
                  <p className={`text-xs ${primaryConfig.text} opacity-60`}>at 05:00</p>
                </div>
                <div>
                  <p className={`text-xs font-mono uppercase tracking-wide ${primaryConfig.text} opacity-60`}>Humidity</p>
                  <p className={`text-3xl font-black font-mono ${primaryConfig.text}`}>{fiveAmSlot.humidity}%</p>
                  <p className={`text-xs ${primaryConfig.text} opacity-60`}>relative</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Morning Forecast Table */}
        {weather && morningSlots.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Morning Forecast — {forecastLabel}</h2>
              <p className="text-xs text-gray-400 mt-1">Hourly conditions for early service hours (04:00–10:00)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-mono text-gray-400 uppercase bg-gray-900">
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-right">Temp (°C)</th>
                    <th className="px-4 py-3 text-right">Dew Pt (°C)</th>
                    <th className="px-4 py-3 text-right">DPD (°C)</th>
                    <th className="px-4 py-3 text-right">RH (%)</th>
                    <th className="px-4 py-3 text-center">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {morningSlots.map((slot) => {
                    const cfg = riskConfig[slot.risk]
                    const is5am = slot.hour === 5
                    return (
                      <tr key={slot.time} className={`border-t border-gray-700 ${is5am ? 'bg-gray-700' : ''}`}>
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          {slot.time}
                          {is5am && <span className="ml-2 text-xs text-blue-400 font-normal">← brief</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-200 font-mono">{slot.temp.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right text-gray-200 font-mono">{slot.dewPoint.toFixed(1)}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${cfg.text}`}>
                          {slot.dpd > 0 ? '+' : ''}{slot.dpd.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300 font-mono">{slot.humidity}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-900 border-t border-gray-700">
              <p className="text-xs text-gray-500 font-mono">
                DPD = Dew Point Depression (Air Temp − Dew Point) · ≤ 0°C: CRITICAL · ≤ 2°C: WARNING · ≤ 5°C: ADVISORY · &gt; 5°C: CLEAR
              </p>
            </div>
          </div>
        )}

        {/* Network Section Assessment */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Network Section Assessment</h2>
            <p className="text-xs text-gray-400 mt-1">Condensation risk by infrastructure segment</p>
          </div>
          <div className="divide-y divide-gray-700">
            {networkSections.map((section) => {
              const sectionLevel = getSectionRisk(primaryLevel, section.tunnelOffset)
              const cfg = riskConfig[sectionLevel]
              return (
                <div key={section.name} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}></span>
                      <p className="text-white font-medium text-sm">{section.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        section.type === 'tunnel' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {section.type === 'tunnel' ? 'Underground' : 'Surface'}
                      </span>
                    </div>
                    {section.note && (
                      <p className="text-xs text-gray-400 mt-1 ml-4">{section.note}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Operational Recommendations */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Operational Recommendations</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${primaryConfig.badge}`}>
              {primaryConfig.label}
            </span>
          </div>
          <ul className="divide-y divide-gray-700">
            {recommendations[primaryLevel].map((rec, i) => (
              <li key={i} className="px-6 py-4 flex items-start gap-3">
                <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${primaryConfig.badge}`}>
                  {i + 1}
                </span>
                <p className="text-gray-200 text-sm">{rec}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-xs text-gray-600 font-mono pb-4">
          Data: Open-Meteo.com · Toronto 43.65°N 79.38°W · Refreshes hourly
          <br />
          Portfolio demonstration of operational monitoring concepts for rail transit systems.
        </p>

      </div>
    </div>
  )
}
