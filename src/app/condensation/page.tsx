'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CondensationReport } from '../api/condensation/route'

const RISK_COLOR: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  HIGH:   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-400',   badge: 'bg-red-600 text-white'   },
  MEDIUM: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-400', badge: 'bg-amber-500 text-white' },
  LOW:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-400', badge: 'bg-green-600 text-white' },
}

const TYPE_ICON: Record<string, string> = {
  underground: '🚇',
  portal: '🔵',
  surface: '☀️',
}

function RiskBadge({ risk }: { risk: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const c = RISK_COLOR[risk]
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${c.badge}`}>
      {risk}
    </span>
  )
}

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('en-CA', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto',
  })
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Toronto',
  })
}

export default function CondensationPage() {
  const [report, setReport] = useState<CondensationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReport = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/condensation', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: CondensationReport = await res.json()
      setReport(data)
    } catch {
      setError('Unable to load condensation data. Check network connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchReport() }, [fetchReport])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading condensation forecast…</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">{error ?? 'No data available.'}</p>
          <button
            onClick={() => fetchReport()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const rc = RISK_COLOR[report.overallRisk]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1">
              CTSM — ECLRT Line 5 Operations
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0087C3]">
              Daily Condensation Forecast
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {formatDate(report.generatedAt)} &nbsp;·&nbsp; Generated {formatTime(report.generatedAt)} ET
            </p>
          </div>
          <button
            onClick={() => fetchReport(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Overall risk banner */}
      <div className={`rounded-xl border-2 p-4 mb-6 ${rc.bg} ${rc.border}`}>
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-black ${rc.text}`}>{report.overallRisk}</span>
          <div>
            <p className={`font-bold text-sm ${rc.text}`}>Overall Condensation Risk</p>
            <p className={`text-sm ${rc.text} opacity-90`}>{report.overallRiskReason}</p>
          </div>
        </div>
      </div>

      {/* Weather + 5 AM snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Current Conditions — Toronto / ECLRT Corridor
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Temperature" value={`${report.weather.temperatureC}°C`} />
            <Stat label="Dew Point" value={`${report.weather.dewPointC}°C`} highlight={report.overallRisk !== 'LOW'} />
            <Stat label="Rel. Humidity" value={`${report.weather.relativeHumidity}%`} />
            <Stat label="Precipitation" value={`${report.weather.precipitationMm} mm`} />
            <Stat label="Wind Speed" value={`${report.weather.windSpeedKmh} km/h`} />
            <Stat label="Sky" value={report.weather.weatherDescription} />
          </div>
        </div>

        {report.fiveAmSnapshot && (
          <div className="bg-[#0087C3]/5 border border-[#0087C3]/30 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-[#0087C3] uppercase tracking-wide mb-3">
              05:00 AM Snapshot (Forecast Reference)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Temperature" value={`${report.fiveAmSnapshot.temperatureC.toFixed(1)}°C`} />
              <Stat label="Dew Point"   value={`${report.fiveAmSnapshot.dewPointC.toFixed(1)}°C`}  highlight />
              <Stat label="Rel. Humidity" value={`${report.fiveAmSnapshot.relativeHumidity}%`} />
              <Stat label="Tunnel Wall" value={`12.0°C (ref.)`} />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Shift start reference — used for morning condensation risk assessment
            </p>
          </div>
        )}
      </div>

      {/* Section status table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Tunnel Section Status</h2>
          <span className="text-xs text-gray-500">Wall ref. temp: 12.0°C</span>
        </div>
        <div className="divide-y divide-gray-50">
          {report.sections.map((s) => (
            <div key={s.id} className={`px-4 py-3 ${RISK_COLOR[s.risk].bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-lg mt-0.5 shrink-0">{TYPE_ICON[s.type]}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{s.action}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <RiskBadge risk={s.risk} />
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    DP {s.dewPoint}°C &nbsp;|&nbsp; margin {s.margin > 0 ? `+${s.margin}` : s.margin}°C
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly dew point bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Dew Point — 24-Hour Profile (Today)</h2>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-1 min-w-[560px] h-24">
            {report.hourlyDewPoints.map(({ hour, dewPoint, risk }) => {
              // Scale: -10°C → 0px, 20°C → 96px
              const pct = Math.max(0, Math.min(100, ((dewPoint + 10) / 30) * 100))
              const barColor =
                risk === 'HIGH' ? 'bg-red-500' : risk === 'MEDIUM' ? 'bg-amber-400' : 'bg-[#84BD00]'
              return (
                <div key={hour} className="flex flex-col items-center flex-1 group relative">
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                    {hour.toString().padStart(2, '0')}:00 — {dewPoint}°C
                  </div>
                  <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                    <div
                      className={`w-full rounded-t ${barColor}`}
                      style={{ height: `${pct}%`, minHeight: '2px' }}
                    />
                  </div>
                  {hour % 6 === 0 && (
                    <span className="text-[10px] text-gray-400 mt-1">{hour.toString().padStart(2, '0')}h</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Dew point scale: −10°C (low) → 20°C (high)</span>
            <span className="flex gap-3">
              <span><span className="inline-block w-2 h-2 rounded bg-[#84BD00] mr-1" />Low</span>
              <span><span className="inline-block w-2 h-2 rounded bg-amber-400 mr-1" />Medium</span>
              <span><span className="inline-block w-2 h-2 rounded bg-red-500 mr-1" />High</span>
            </span>
          </div>
        </div>
      </div>

      {/* Recommended actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Recommended Actions</h2>
        <ol className="space-y-2">
          {report.recommendedActions.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-[#0087C3] text-white text-xs flex items-center justify-center shrink-0 font-bold">
                {i + 1}
              </span>
              {action}
            </li>
          ))}
        </ol>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 text-center">
        Weather data: Open-Meteo API · Toronto corridor (43.72°N, 79.42°W) · Refreshes every 30 min ·
        Tunnel wall ref. temperature 12.0°C (mean ground temp at 15 m depth) ·
        This report is generated for CTSM operational planning — verify against YCC readings before actioning.
      </p>
    </div>
  )
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`font-semibold text-sm ${highlight ? 'text-amber-600' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}
