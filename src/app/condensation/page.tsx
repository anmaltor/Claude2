'use client'

import { useEffect, useState } from 'react'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface ZoneStatus {
  zone: string
  section: string
  risk: RiskLevel
  action: string
}

interface HourlyForecast {
  time: string
  risk: RiskLevel
  temp: number
  dewPoint: number
  humidity: number
}

const riskColors: Record<RiskLevel, { bg: string; text: string; badge: string; border: string }> = {
  LOW:      { bg: 'bg-green-50',  text: 'text-green-800',  badge: 'bg-green-100 text-green-800',  border: 'border-green-300' },
  MEDIUM:   { bg: 'bg-yellow-50', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300' },
  HIGH:     { bg: 'bg-orange-50', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800', border: 'border-orange-300' },
  CRITICAL: { bg: 'bg-red-50',    text: 'text-red-800',    badge: 'bg-red-100 text-red-800',       border: 'border-red-400' },
}

const weatherData = {
  temperature: 11.2,
  dewPoint: 9.1,
  deltaT: 2.1,
  humidity: 86,
  windSpeed: 6,
  windDir: 'NW',
  visibility: 4.5,
  forecast: 'Patchy fog clearing by 08:30',
  overallRisk: 'HIGH' as RiskLevel,
}

const zones: ZoneStatus[] = [
  {
    zone: 'Surface West',
    section: 'Mount Dennis → Jane St',
    risk: 'HIGH',
    action: 'Deploy adhesion improvement vehicle before 06:30. Friction modifier treatment required.',
  },
  {
    zone: 'Surface East',
    section: 'Kennedy → Scarborough Centre',
    risk: 'HIGH',
    action: 'Apply sanding treatment on curves. Alert Train Operators to reduced adhesion.',
  },
  {
    zone: 'Tunnel (Central)',
    section: 'Cedarvale → Mount Dennis (Underground)',
    risk: 'LOW',
    action: 'Standard monitoring. Check ventilation systems are active.',
  },
  {
    zone: 'Elevated Structures',
    section: 'Don Mills Crossings',
    risk: 'MEDIUM',
    action: 'Pre-service rail temperature check. Monitor first two service runs.',
  },
  {
    zone: 'Maintenance Depot',
    section: 'SCMT Yard – Finch',
    risk: 'MEDIUM',
    action: 'Inspect running rails on departure track before 05:45. Confirm brake test procedures.',
  },
  {
    zone: 'Station Platform Edges',
    section: 'All surface & portal stations',
    risk: 'MEDIUM',
    action: 'Platform anti-slip treatment applied. Station staff briefed on slip risk.',
  },
]

const hourlyForecast: HourlyForecast[] = [
  { time: '05:00', risk: 'HIGH',   temp: 11.2, dewPoint: 9.1,  humidity: 86 },
  { time: '06:00', risk: 'HIGH',   temp: 11.0, dewPoint: 9.3,  humidity: 88 },
  { time: '07:00', risk: 'MEDIUM', temp: 11.8, dewPoint: 9.2,  humidity: 83 },
  { time: '08:00', risk: 'MEDIUM', temp: 13.1, dewPoint: 9.0,  humidity: 76 },
  { time: '09:00', risk: 'LOW',    temp: 14.6, dewPoint: 8.7,  humidity: 68 },
  { time: '10:00', risk: 'LOW',    temp: 16.0, dewPoint: 8.4,  humidity: 62 },
]

const actions = [
  { priority: 'IMMEDIATE', text: 'Deploy adhesion vehicles on surface west and east sections — complete before 06:30 service start.' },
  { priority: 'HIGH',      text: 'Brief all Train Operators at 06:00 handover: surface condensation risk, reduce approach speeds at surface curves.' },
  { priority: 'HIGH',      text: 'Confirm friction modifier treatment applied to Kennedy → Scarborough Centre alignment.' },
  { priority: 'MEDIUM',    text: 'Alert OCC Duty Manager: increased dwell time buffer of +30 sec authorised during 06:00–08:00 window.' },
  { priority: 'STANDARD',  text: 'Monitor first three revenue service runs. Report any adhesion incidents to YCC immediately.' },
]

const actionColors: Record<string, string> = {
  IMMEDIATE: 'bg-red-100 text-red-800 border-red-300',
  HIGH:      'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  STANDARD:  'bg-blue-100 text-blue-800 border-blue-300',
}

export default function CondensationPage() {
  const [briefingTime, setBriefingTime] = useState('')

  useEffect(() => {
    const now = new Date()
    setBriefingTime(
      now.toLocaleString('en-CA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'America/Toronto',
      })
    )
  }, [])

  const overall = riskColors[weatherData.overallRisk]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header bar */}
      <div className={`${overall.bg} border-b-4 ${overall.border} py-6 px-4`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
                Eglinton Crosstown LRT — Operations Control Centre
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Daily Condensation Forecast
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {briefingTime ? `${briefingTime} · 05:00 Morning Briefing` : '05:00 Morning Briefing'}
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 ${overall.border} ${overall.bg}`}>
              <span className={`w-3 h-3 rounded-full ${weatherData.overallRisk === 'HIGH' ? 'bg-orange-500' : weatherData.overallRisk === 'CRITICAL' ? 'bg-red-600' : weatherData.overallRisk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
              <span className={`text-lg font-bold ${overall.text}`}>
                {weatherData.overallRisk} RISK
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Current Conditions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Conditions — Toronto (05:00)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Air Temp', value: `${weatherData.temperature}°C` },
              { label: 'Dew Point', value: `${weatherData.dewPoint}°C` },
              { label: 'ΔT (Air − Dew Pt)', value: `${weatherData.deltaT}°C`, highlight: true },
              { label: 'Rel. Humidity', value: `${weatherData.humidity}%` },
              { label: 'Wind', value: `${weatherData.windSpeed} km/h ${weatherData.windDir}` },
              { label: 'Visibility', value: `${weatherData.visibility} km` },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className={`rounded-lg p-4 border text-center ${highlight ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'}`}
              >
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-xl font-bold ${highlight ? 'text-orange-700' : 'text-gray-900'}`}>{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-2">
            <span className="font-semibold">Forecast:</span> {weatherData.forecast}
          </p>
        </section>

        {/* Zone Risk Assessment */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Zone Risk Assessment</h2>
          <div className="space-y-3">
            {zones.map((z) => {
              const c = riskColors[z.risk]
              return (
                <div key={z.zone} className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.badge}`}>{z.risk}</span>
                        <span className="font-semibold text-gray-900">{z.zone}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{z.section}</p>
                      <p className="text-sm text-gray-700">{z.action}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Hourly Forecast */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Hourly Risk Timeline</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {hourlyForecast.map((h) => {
              const c = riskColors[h.risk]
              return (
                <div key={h.time} className={`rounded-lg border ${c.border} ${c.bg} p-3 text-center`}>
                  <p className="text-xs font-bold text-gray-500 mb-2">{h.time}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.badge}`}>{h.risk}</span>
                  <p className="text-sm font-semibold text-gray-800 mt-2">{h.temp}°C</p>
                  <p className="text-xs text-gray-500">DP {h.dewPoint}°C</p>
                  <p className="text-xs text-gray-500">{h.humidity}% RH</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recommended Actions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended Actions</h2>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${actionColors[a.priority]}`}>
                <span className={`text-xs font-bold whitespace-nowrap mt-0.5 px-2 py-0.5 rounded border ${actionColors[a.priority]}`}>
                  {a.priority}
                </span>
                <p className="text-sm">{a.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-xs text-gray-400 border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between gap-1">
          <span>Data source: Environment and Climate Change Canada · OCC Meteorological Feed</span>
          <span>Last updated: 05:00 · Next update: 06:00</span>
        </footer>
      </div>
    </div>
  )
}
