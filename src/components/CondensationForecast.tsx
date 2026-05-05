'use client'

import { useEffect, useState } from 'react'

interface ForecastDay {
  date: string
  temperature: number
  dewPoint: number
  humidity: number
  spread: number
  status: string
  risk: 'critical' | 'high' | 'moderate' | 'low'
}

interface ForecastData {
  forecasts: ForecastDay[]
  location: string
  generatedAt: string
}

const riskStyles: Record<string, { bg: string; text: string; badge: string }> = {
  critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', badge: 'bg-red-600 text-white' },
  high:     { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', badge: 'bg-orange-500 text-white' },
  moderate: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-400 text-gray-900' },
  low:      { bg: 'bg-green-50 border-green-200', text: 'text-green-800', badge: 'bg-green-500 text-white' },
}

function formatDate(isoDate: string) {
  const [datePart] = isoDate.split('T')
  const d = new Date(datePart + 'T05:00:00')
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function CondensationForecast() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/condensation')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading forecast data...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500">
        {error ?? 'Unable to load forecast'}
      </div>
    )
  }

  const today = data.forecasts[0]
  const todayStyle = riskStyles[today.risk]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Today's status card */}
      <div className={`rounded-xl border-2 p-6 mb-8 ${todayStyle.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-wide ${todayStyle.text}`}>
              Today — 5 AM Condensation Status
            </p>
            <p className={`text-3xl font-bold mt-1 ${todayStyle.text}`}>{today.status}</p>
            <p className={`text-sm mt-1 ${todayStyle.text}`}>{data.location}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${todayStyle.badge}`}>
              Spread: {today.spread > 0 ? '+' : ''}{today.spread} °C
            </span>
            <p className={`text-xs mt-2 ${todayStyle.text}`}>
              Temp {today.temperature}°C · Dew {today.dewPoint}°C · RH {today.humidity}%
            </p>
          </div>
        </div>

        <div className={`mt-4 pt-4 border-t text-xs ${todayStyle.text} border-current opacity-40`} />
        <p className={`text-xs mt-0 ${todayStyle.text} opacity-60`}>
          Condensation forms when rail surface temperature ≤ dew point.
          Spread = Air Temp − Dew Point. Values below 2 °C indicate adhesion risk.
        </p>
      </div>

      {/* 7-day table */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">7-Day 5 AM Forecast</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Temp (°C)</th>
              <th className="px-4 py-3 text-right">Dew Point (°C)</th>
              <th className="px-4 py-3 text-right">Spread (°C)</th>
              <th className="px-4 py-3 text-right">RH (%)</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.forecasts.map((day, i) => {
              const s = riskStyles[day.risk]
              return (
                <tr key={day.date} className={`border-t border-gray-100 ${i === 0 ? 'font-semibold' : ''}`}>
                  <td className="px-4 py-3">{formatDate(day.date)}</td>
                  <td className="px-4 py-3 text-right">{day.temperature}</td>
                  <td className="px-4 py-3 text-right">{day.dewPoint}</td>
                  <td className="px-4 py-3 text-right">{day.spread > 0 ? '+' : ''}{day.spread}</td>
                  <td className="px-4 py-3 text-right">{day.humidity}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
                      {day.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-right">
        Data: Open-Meteo · Updated hourly · Generated {new Date(data.generatedAt).toLocaleTimeString('en-CA')}
      </p>
    </div>
  )
}
