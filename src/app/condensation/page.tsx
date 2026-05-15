import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Condensation Forecast – Rail Operations',
  description: 'Daily 5 AM condensation forecast and operational status for Eglinton Crosstown LRT, Toronto.',
}

interface HourlyData {
  time: string[]
  temperature_2m: number[]
  dewpoint_2m: number[]
  relativehumidity_2m: number[]
  precipitation: number[]
  weathercode: number[]
}

interface WeatherResponse {
  hourly: HourlyData
}

interface ForecastPoint {
  temp: number
  dewpoint: number
  humidity: number
  precip: number
  weathercode: number
  spread: number
  date: string
  dayLabel: string
}

async function fetchWeather(): Promise<WeatherResponse | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832' +
        '&hourly=temperature_2m,dewpoint_2m,relativehumidity_2m,precipitation,weathercode' +
        '&timezone=America%2FToronto&forecast_days=3',
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function extract5AM(data: WeatherResponse, offsetDays: number): ForecastPoint | null {
  const base = new Date()
  base.setDate(base.getDate() + offsetDays)
  const dateStr = base.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
  const target = `${dateStr}T05:00`
  const idx = data.hourly.time.indexOf(target)
  if (idx === -1) return null

  const temp = data.hourly.temperature_2m[idx]
  const dewpoint = data.hourly.dewpoint_2m[idx]
  const humidity = data.hourly.relativehumidity_2m[idx]
  const precip = data.hourly.precipitation[idx]
  const weathercode = data.hourly.weathercode[idx]
  const spread = parseFloat((temp - dewpoint).toFixed(1))
  const dayLabel = offsetDays === 0 ? 'Today' : offsetDays === 1 ? 'Tomorrow' : `+${offsetDays}d`
  const date = base.toLocaleDateString('en-CA', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return { temp, dewpoint, humidity, precip, weathercode, spread, date, dayLabel }
}

function riskLevel(spread: number, humidity: number) {
  if (spread < 2 || humidity > 90) {
    return {
      label: 'HIGH',
      textColor: 'text-red-700',
      badgeBg: 'bg-red-100 text-red-700 border-red-300',
      cardBorder: 'border-red-300',
      noteBg: 'bg-red-50',
      noteText: 'text-red-800',
      description:
        'Condensation likely on rail surfaces, platforms, and electrical equipment. Enhanced monitoring required.',
    }
  }
  if (spread < 5 || humidity > 75) {
    return {
      label: 'MEDIUM',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-100 text-amber-700 border-amber-300',
      cardBorder: 'border-amber-300',
      noteBg: 'bg-amber-50',
      noteText: 'text-amber-800',
      description:
        'Conditions may support condensation formation. Standard precautionary measures in effect.',
    }
  }
  return {
    label: 'LOW',
    textColor: 'text-green-700',
    badgeBg: 'bg-green-100 text-green-700 border-green-300',
    cardBorder: 'border-green-300',
    noteBg: 'bg-green-50',
    noteText: 'text-green-800',
    description: 'Condensation risk is minimal. Normal operational conditions expected.',
  }
}

function weatherDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 49) return 'Fog / mist'
  if (code <= 59) return 'Drizzle'
  if (code <= 69) return 'Rain'
  if (code <= 79) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 86) return 'Snow showers'
  return 'Thunderstorm'
}

function spreadColor(spread: number) {
  if (spread < 2) return 'text-red-600'
  if (spread < 5) return 'text-amber-600'
  return 'text-green-600'
}

function humidityColor(h: number) {
  if (h > 90) return 'text-red-600'
  if (h > 75) return 'text-amber-600'
  return 'text-green-600'
}

export default async function CondensationPage() {
  const weather = await fetchWeather()

  const now = new Date()
  const fetchedAt = now.toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const forecasts: (ForecastPoint | null)[] = weather
    ? [extract5AM(weather, 0), extract5AM(weather, 1)]
    : [null, null]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">
            Eglinton Crosstown LRT &mdash; Toronto, Ontario
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-1">Daily Condensation Forecast</h1>
          <p className="text-blue-200 text-sm">5 AM Operational Status</p>
          <p className="text-blue-400 text-xs mt-3">Last updated: {fetchedAt}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {!weather && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-800 font-medium">
            Weather data unavailable — please retry later.
          </div>
        )}

        {/* Forecast cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forecasts.map((pt, i) => {
            if (!pt) {
              return (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-gray-500">No forecast data available.</p>
                </div>
              )
            }
            const risk = riskLevel(pt.spread, pt.humidity)
            return (
              <div
                key={i}
                className={`bg-white rounded-xl shadow-sm border-2 ${risk.cardBorder} overflow-hidden`}
              >
                <div className="p-6">
                  {/* Card header */}
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {pt.dayLabel} &middot; 05:00 EST
                      </h2>
                      <p className="text-gray-500 text-sm">{pt.date}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${risk.badgeBg}`}
                    >
                      {risk.label} RISK
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm mb-5">{weatherDescription(pt.weathercode)}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: 'Temperature', value: `${pt.temp.toFixed(1)}°C`, color: 'text-gray-800' },
                      { label: 'Dew Point', value: `${pt.dewpoint.toFixed(1)}°C`, color: 'text-gray-800' },
                      {
                        label: 'Spread (T − Td)',
                        value: `${pt.spread.toFixed(1)}°C`,
                        color: spreadColor(pt.spread),
                      },
                      {
                        label: 'Rel. Humidity',
                        value: `${pt.humidity}%`,
                        color: humidityColor(pt.humidity),
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Precip */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-5">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Precipitation</p>
                    <p className="text-lg font-semibold text-gray-700">{pt.precip.toFixed(1)} mm/hr</p>
                  </div>

                  {/* Risk note */}
                  <div className={`rounded-lg p-3 ${risk.noteBg}`}>
                    <p className={`text-sm font-medium ${risk.noteText}`}>{risk.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Risk reference table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Condensation Risk Reference</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                dot: 'bg-green-500',
                label: 'LOW RISK',
                labelColor: 'text-green-700',
                criteria: 'Spread > 5°C · RH < 75%',
                action: 'Normal operations',
              },
              {
                dot: 'bg-amber-500',
                label: 'MEDIUM RISK',
                labelColor: 'text-amber-700',
                criteria: 'Spread 2–5°C · RH 75–90%',
                action: 'Standard precautions',
              },
              {
                dot: 'bg-red-500',
                label: 'HIGH RISK',
                labelColor: 'text-red-700',
                criteria: 'Spread < 2°C or RH > 90%',
                action: 'Enhanced monitoring',
              },
            ].map(({ dot, label, labelColor, criteria, action }) => (
              <div key={label} className="flex items-start gap-3">
                <span className={`w-3 h-3 rounded-full ${dot} flex-shrink-0 mt-1`} />
                <div>
                  <p className={`font-semibold ${labelColor}`}>{label}</p>
                  <p className="text-sm text-gray-600">{criteria}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Operational Considerations</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              <span className="font-semibold">Rail adhesion:</span> Condensation reduces friction
              coefficient — alert train operators when HIGH risk is forecast.
            </li>
            <li>
              <span className="font-semibold">Tunnel environments:</span> Monitor ventilation shaft
              outlet temperatures for underground sections.
            </li>
            <li>
              <span className="font-semibold">Electrical equipment:</span> Condensation on substations
              and switchgear increases insulation fault risk.
            </li>
            <li>
              <span className="font-semibold">OCC briefing:</span> Include condensation status in daily
              05:00 pre-service handover report.
            </li>
            <li>
              <span className="font-semibold">Yard movements:</span> Apply slow-speed restrictions on
              depot leads during HIGH risk conditions.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
