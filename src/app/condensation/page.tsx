import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily 5 AM Condensation Forecast | ECLRT Operations',
  description: 'Daily condensation forecast and tunnel status report for Eglinton Crosstown LRT pre-service operations.',
}

type RiskLevel = 'low' | 'medium' | 'high'

interface Section {
  id: string
  name: string
  type: 'Portal' | 'Tunnel' | 'Station' | 'Surface'
  km: string
  outsideTemp: number
  tunnelTemp: number
  humidity: number
  dewPoint: number
  risk: RiskLevel
  note?: string
}

const sections: Section[] = [
  {
    id: 's1',
    name: 'Kennedy Portal (East)',
    type: 'Portal',
    km: '0.0',
    outsideTemp: 9.1,
    tunnelTemp: 18.4,
    humidity: 81,
    dewPoint: 6.2,
    risk: 'high',
    note: 'Portal transition zone — inspect rail head for condensation film',
  },
  {
    id: 's2',
    name: 'Kennedy → Science Centre',
    type: 'Tunnel',
    km: '0.0–3.1',
    outsideTemp: 9.1,
    tunnelTemp: 18.1,
    humidity: 74,
    dewPoint: 5.1,
    risk: 'medium',
  },
  {
    id: 's3',
    name: 'Science Centre Station',
    type: 'Station',
    km: '3.1',
    outsideTemp: 9.1,
    tunnelTemp: 17.8,
    humidity: 71,
    dewPoint: 4.7,
    risk: 'medium',
  },
  {
    id: 's4',
    name: 'Science Centre → Eglinton',
    type: 'Tunnel',
    km: '3.1–7.4',
    outsideTemp: 9.1,
    tunnelTemp: 17.2,
    humidity: 65,
    dewPoint: 3.8,
    risk: 'low',
  },
  {
    id: 's5',
    name: 'Eglinton Station',
    type: 'Station',
    km: '7.4',
    outsideTemp: 9.1,
    tunnelTemp: 17.0,
    humidity: 62,
    dewPoint: 3.1,
    risk: 'low',
  },
  {
    id: 's6',
    name: 'Eglinton → Dufferin',
    type: 'Tunnel',
    km: '7.4–10.2',
    outsideTemp: 9.1,
    tunnelTemp: 17.5,
    humidity: 73,
    dewPoint: 5.0,
    risk: 'medium',
  },
  {
    id: 's7',
    name: 'Dufferin Station',
    type: 'Station',
    km: '10.2',
    outsideTemp: 9.1,
    tunnelTemp: 17.6,
    humidity: 75,
    dewPoint: 5.3,
    risk: 'medium',
  },
  {
    id: 's8',
    name: 'Dufferin → Kingsway',
    type: 'Tunnel',
    km: '10.2–14.5',
    outsideTemp: 9.1,
    tunnelTemp: 18.0,
    humidity: 77,
    dewPoint: 5.7,
    risk: 'medium',
  },
  {
    id: 's9',
    name: 'Kingsway Portal (West)',
    type: 'Portal',
    km: '14.5',
    outsideTemp: 9.1,
    tunnelTemp: 18.3,
    humidity: 82,
    dewPoint: 6.4,
    risk: 'high',
    note: 'Increased condensation at dawn — verify signaling equipment dry',
  },
  {
    id: 's10',
    name: 'Surface West (→ Mount Dennis)',
    type: 'Surface',
    km: '14.5–19.0',
    outsideTemp: 9.1,
    tunnelTemp: 9.1,
    humidity: 72,
    dewPoint: 4.8,
    risk: 'low',
  },
]

const RISK_STYLES: Record<RiskLevel, { badge: string; row: string; label: string }> = {
  high:   { badge: 'bg-red-500 text-white',    row: 'bg-red-50 border-red-100',       label: 'HIGH' },
  medium: { badge: 'bg-yellow-500 text-white', row: 'bg-yellow-50 border-yellow-100', label: 'MEDIUM' },
  low:    { badge: 'bg-green-500 text-white',  row: 'bg-green-50 border-green-100',   label: 'LOW' },
}

export default function CondensationForecast() {
  const highRisk   = sections.filter(s => s.risk === 'high')
  const mediumRisk = sections.filter(s => s.risk === 'medium')

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
                Eglinton Crosstown LRT — Operations Control Centre
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                Daily Condensation Forecast
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                May 14, 2026 &bull; Generated 05:00 EST &bull; Pre-Service Assessment
              </p>
            </div>
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg border-2 bg-yellow-50 border-yellow-300 shrink-0">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase leading-none">Overall Status</p>
                <p className="text-xl font-bold text-yellow-800 mt-0.5">ADVISORY</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-yellow-800 bg-yellow-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg border-t border-yellow-300">
            Condensation risk at both tunnel portals. Pre-service inspection required at Kennedy East and Kingsway West before first departure.
          </p>
        </div>

        {/* Environmental Conditions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Environmental Conditions at 05:00 EST</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Outside Temp',      value: '9.1°C',        sub: 'Toronto (Pearson)' },
              { label: 'Avg Tunnel Temp',   value: '17.7°C',       sub: 'Central sections' },
              { label: 'Peak Δ Temp',       value: '+9.2°C',       sub: 'Portal zones' },
              { label: 'Outside RH',        value: '72%',          sub: 'Relative humidity' },
              { label: 'Dew Point',         value: '4.8°C',        sub: 'External' },
              { label: 'Wind',              value: '18 km/h NW',   sub: '' },
              { label: 'Visibility',        value: '8 km',         sub: '' },
              { label: 'Precipitation',     value: 'Light showers',sub: '08:00–11:00 EST' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{item.value}</p>
                {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Section Risk Assessment */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Tunnel Section Risk Assessment</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left">
                  <th className="py-3 px-3 font-semibold text-gray-700">Section</th>
                  <th className="py-3 px-3 font-semibold text-gray-700 hidden sm:table-cell">Type</th>
                  <th className="py-3 px-3 font-semibold text-gray-700 text-center">Δ Temp</th>
                  <th className="py-3 px-3 font-semibold text-gray-700 text-center hidden md:table-cell">RH %</th>
                  <th className="py-3 px-3 font-semibold text-gray-700 text-center hidden md:table-cell">Dew Pt.</th>
                  <th className="py-3 px-3 font-semibold text-gray-700 text-center">Risk</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(s => {
                  const style   = RISK_STYLES[s.risk]
                  const tmpDiff = (s.tunnelTemp - s.outsideTemp).toFixed(1)
                  return (
                    <tr key={s.id} className={`border-b ${style.row}`}>
                      <td className="py-3 px-3">
                        <p className="font-medium text-gray-900">{s.name}</p>
                        {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
                        <p className="text-xs text-gray-400">km {s.km}</p>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">
                          {s.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-gray-800">
                        +{tmpDiff}°C
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 hidden md:table-cell">
                        {s.humidity}%
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 hidden md:table-cell">
                        {s.dewPoint}°C
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${style.badge}`}>
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Pre-Service Maintenance Actions</h2>
          <div className="space-y-3">
            {highRisk.length > 0 && (
              <div className="border-l-4 border-red-500 bg-red-50 pl-4 py-3 pr-3 rounded-r-lg">
                <p className="font-bold text-red-800 text-sm mb-2">IMMEDIATE — High Risk Zones</p>
                <ul className="space-y-1.5">
                  {highRisk.map(s => (
                    <li key={s.id} className="text-sm text-red-700">
                      <strong>{s.name}:</strong> Inspect rail head and running surfaces for condensation film. Verify all signaling equipment dry. Deploy rail-drying run if adhesion index below threshold.
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mediumRisk.length > 0 && (
              <div className="border-l-4 border-yellow-500 bg-yellow-50 pl-4 py-3 pr-3 rounded-r-lg">
                <p className="font-bold text-yellow-800 text-sm mb-2">MONITOR — Medium Risk Zones</p>
                <ul className="space-y-1.5">
                  {mediumRisk.map(s => (
                    <li key={s.id} className="text-sm text-yellow-700">
                      <strong>{s.name}:</strong> Standard pre-service checks. Alert OCC immediately if adhesion issues are reported during early services.
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-3 pr-3 rounded-r-lg">
              <p className="font-bold text-blue-800 text-sm mb-1">PRECIPITATION ADVISORY</p>
              <p className="text-sm text-blue-700">
                Light showers expected 08:00–11:00 EST. Surface alignment west of Kingsway Portal may develop slippery rail conditions. Notify all Train Operators prior to 08:00 service departure.
              </p>
            </div>
          </div>
        </div>

        {/* Legend & Footer */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Risk Thresholds</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-500 inline-block shrink-0" />
                  Low: Δ &lt; 5°C, RH &lt; 65%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-yellow-500 inline-block shrink-0" />
                  Medium: Δ 5–8°C, RH 65–78%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500 inline-block shrink-0" />
                  High: Δ &gt; 8°C or RH &gt; 78%
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500 text-right shrink-0">
              <p className="font-medium">Next forecast: 05:00 EST, May 15, 2026</p>
              <p className="mt-1 text-xs">Data sources: Environment Canada · OCC Sensor Array</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
