'use client'

import { getTodayForecast, getWeeklyForecast, riskColors, systemStatusColors } from '@/data/condensation'

export default function CondensationPage() {
  const today = getTodayForecast()
  const weekly = getWeeklyForecast()
  const colors = riskColors[today.riskLevel]

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Condensation Forecast &amp; Status</h1>
          <p className="text-gray-500 mt-1">
            Eglinton Crosstown LRT &mdash; Daily 05:00 operational briefing
          </p>
        </div>

        {/* Today's forecast banner */}
        <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6 mb-8 shadow-sm`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${colors.badge}`}>
                  {today.riskLevel} Risk
                </span>
                <span className="text-xs text-gray-500">Generated {today.generatedAt}</span>
              </div>
              <h2 className={`text-xl font-bold ${colors.text} mt-2`}>{today.date}</h2>
              <p className="text-gray-700 mt-2 max-w-2xl text-sm leading-relaxed">{today.description}</p>
            </div>
            <div className="flex gap-6 shrink-0 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Temp</p>
                <p className="text-2xl font-bold text-gray-900">{today.tempC}°C</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dew Point</p>
                <p className="text-2xl font-bold text-gray-900">{today.dewPointC}°C</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Humidity</p>
                <p className="text-2xl font-bold text-gray-900">{today.humidity}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">ΔT</p>
                <p className={`text-2xl font-bold ${colors.text}`}>{today.deltaT}°C</p>
              </div>
            </div>
          </div>
        </div>

        {/* Systems status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            {today.systems.map((sys) => (
              <div key={sys.name} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3 sm:w-72 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${systemStatusColors[sys.status]}`}>
                    {sys.status}
                  </span>
                  <span className="font-medium text-gray-900 text-sm">{sys.name}</span>
                </div>
                <p className="text-sm text-gray-600 sm:ml-2">{sys.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day outlook */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Outlook</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekly.map((w) => {
              const c = riskColors[w.riskLevel]
              return (
                <div key={w.date} className={`rounded-lg border ${c.border} ${c.bg} p-3 text-center`}>
                  <p className="text-xs font-semibold text-gray-600 uppercase">{w.day}</p>
                  <p className="text-xs text-gray-400 mb-2">{w.date}</p>
                  <p className="text-lg font-bold text-gray-900">{w.tempC}°</p>
                  <p className="text-xs text-gray-500">DP {w.dewPointC}°</p>
                  <p className="text-xs text-gray-500">{w.humidity}% RH</p>
                  <span className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                    {w.riskLevel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Risk Thresholds (ΔT = Temperature − Dew Point)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {(['Low', 'Medium', 'High', 'Critical'] as const).map((level) => {
              const thresholds: Record<string, string> = {
                Low: 'ΔT > 5°C',
                Medium: 'ΔT 2 – 5°C',
                High: 'ΔT 0.5 – 2°C',
                Critical: 'ΔT < 0.5°C',
              }
              const c = riskColors[level]
              return (
                <div key={level} className={`rounded-lg p-3 ${c.bg} border ${c.border}`}>
                  <span className={`font-bold ${c.text}`}>{level}</span>
                  <p className="text-gray-600 mt-0.5">{thresholds[level]}</p>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Forecast generated daily at 05:00 local time. Based on ambient temperature and dew-point differential affecting
            track circuits, traction power insulators, station environments, and vehicle systems across the 19 km ECLRT corridor.
          </p>
        </div>

      </div>
    </div>
  )
}
