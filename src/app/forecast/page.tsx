import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Condensation Forecast | Antonio Mallol',
  description: '5 AM rail condensation forecast for ECLRT operations in Toronto',
}

export const revalidate = 3600

interface WeatherResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    dew_point_2m: number[]
    relative_humidity_2m: number[]
    precipitation_probability: number[]
    weather_code: number[]
  }
}

interface ForecastPoint {
  date: string
  temperature: number
  dewpoint: number
  humidity: number
  precipProbability: number
  weathercode: number
  spread: number
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
}

function getRiskLevel(spread: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (spread < 2) return 'HIGH'
  if (spread <= 4) return 'MEDIUM'
  return 'LOW'
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Fog'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 86) return 'Snow showers'
  return 'Thunderstorm'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })
}

async function fetchWeatherData(): Promise<WeatherResponse | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.7001&longitude=-79.4163' +
        '&hourly=temperature_2m,dew_point_2m,relative_humidity_2m,precipitation_probability,weather_code' +
        '&timezone=America%2FToronto&forecast_days=3',
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const riskConfig = {
  HIGH: {
    containerClass: 'bg-red-50 border-red-300',
    badgeClass: 'bg-red-100 text-red-800',
    label: 'HIGH RISK',
    recommendation:
      'Condensation on rail surface very likely. Apply anti-condensation treatment before first service. Reduce line speed on exposed sections and activate slip detection protocols in OCC.',
  },
  MEDIUM: {
    containerClass: 'bg-amber-50 border-amber-300',
    badgeClass: 'bg-amber-100 text-amber-800',
    label: 'MEDIUM RISK',
    recommendation:
      'Condensation possible. Brief OCC and driver crews on elevated adhesion risk. Prepare anti-condensation equipment and monitor rail surface reports during early service.',
  },
  LOW: {
    containerClass: 'bg-green-50 border-green-300',
    badgeClass: 'bg-green-100 text-green-800',
    label: 'LOW RISK',
    recommendation: 'Condensation unlikely. Standard pre-service checks apply. Normal operations.',
  },
}

export default async function ForecastPage() {
  const data = await fetchWeatherData()

  let forecasts: ForecastPoint[] = []

  if (data) {
    // Hourly data: index 5 = 05:00 day 0, 29 = 05:00 day 1, 53 = 05:00 day 2
    const indices = [5, 29, 53]
    forecasts = indices.map((idx) => {
      const temp = data.hourly.temperature_2m[idx]
      const dew = data.hourly.dew_point_2m[idx]
      const spread = Math.round((temp - dew) * 10) / 10
      return {
        date: data.hourly.time[idx].split('T')[0],
        temperature: Math.round(temp * 10) / 10,
        dewpoint: Math.round(dew * 10) / 10,
        humidity: data.hourly.relative_humidity_2m[idx],
        precipProbability: data.hourly.precipitation_probability[idx],
        weathercode: data.hourly.weather_code[idx],
        spread,
        riskLevel: getRiskLevel(spread),
      }
    })
  }

  const today = forecasts[0]

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">5 AM Condensation Forecast</h1>
              <p className="text-gray-600">Eglinton Crosstown LRT · Toronto, Ontario</p>
              <p className="text-xs text-gray-400 mt-1">Source: Open-Meteo · Updates every hour</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>43.70°N, 79.42°W</div>
              <div className="text-xs">ECLRT Operations Zone</div>
            </div>
          </div>
        </div>

        {!data && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 mb-8 text-yellow-800">
            Weather data is temporarily unavailable. Please refresh or check back shortly.
          </div>
        )}

        {today && (
          <>
            {/* Today primary card */}
            <div className={`rounded-lg border-2 shadow-md p-8 mb-8 ${riskConfig[today.riskLevel].containerClass}`}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                    Today · 05:00 Local Time
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">{formatDate(today.date)}</h2>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${riskConfig[today.riskLevel].badgeClass}`}>
                  {riskConfig[today.riskLevel].label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-gray-900">{today.temperature}°C</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Dew Point</p>
                  <p className="text-2xl font-bold text-gray-900">{today.dewpoint}°C</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Spread</p>
                  <p className="text-2xl font-bold text-gray-900">{today.spread}°C</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Humidity</p>
                  <p className="text-2xl font-bold text-gray-900">{today.humidity}%</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-sm bg-white px-3 py-1 rounded-full text-gray-700 shadow-sm">
                  {getWeatherDescription(today.weathercode)}
                </span>
                <span className="text-sm bg-white px-3 py-1 rounded-full text-gray-700 shadow-sm">
                  Precipitation probability: {today.precipProbability}%
                </span>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <p className="text-sm font-semibold text-gray-800 mb-1">Operational Recommendation</p>
                <p className="text-sm text-gray-700">{riskConfig[today.riskLevel].recommendation}</p>
              </div>
            </div>

            {/* 3-Day outlook */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">3-Day 5 AM Outlook</h2>
              <div className="space-y-3">
                {forecasts.map((f, i) => (
                  <div
                    key={f.date}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 border ${riskConfig[f.riskLevel].containerClass}`}
                  >
                    <div className="min-w-[130px]">
                      <p className="font-semibold text-gray-900">
                        {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day 3'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(f.date)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      <span>
                        {f.temperature}°C · Dew {f.dewpoint}°C · Spread {f.spread}°C
                      </span>
                      <span className="hidden sm:inline">{f.humidity}% RH</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskConfig[f.riskLevel].badgeClass}`}>
                      {riskConfig[f.riskLevel].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Explainer */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About Rail Condensation Risk</h2>
          <p className="text-gray-700 mb-4">
            Condensation on rail surfaces forms when the rail head cools to or below the dew point, depositing a thin
            moisture film that substantially reduces wheel–rail adhesion. On light rail systems like ECLRT, this is most
            critical in the early morning hours before solar heating raises surface temperatures.
          </p>
          <p className="text-gray-700 mb-5">
            The <strong>dew point spread</strong> — the gap between air temperature and dew point — is the primary
            indicator used by operations teams:
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold whitespace-nowrap">
                HIGH · &lt;2°C spread
              </span>
              <span className="text-gray-700">
                Condensation very likely. Treat rails before first service and brief crews on reduced adhesion.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold whitespace-nowrap">
                MEDIUM · 2–4°C spread
              </span>
              <span className="text-gray-700">
                Condensation possible. Heightened vigilance required; monitor early-service incident reports.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold whitespace-nowrap">
                LOW · &gt;4°C spread
              </span>
              <span className="text-gray-700">Condensation unlikely. Standard pre-service adhesion checks apply.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
