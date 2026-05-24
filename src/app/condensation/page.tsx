import { fetchCondensationForecast, riskColour, riskLabel } from '@/lib/condensation'

export const metadata = {
  title: 'Condensation Forecast – ECLRT Line 5',
  description: 'Daily 5 AM tunnel condensation forecast and zone status for the Eglinton Crosstown LRT.',
}

export default async function CondensationPage() {
  const data = await fetchCondensationForecast()

  const formatDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-CA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

  const formatFetched = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-CA', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto', timeZoneName: 'short',
    })

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#0087C3' }}>
              Condensation Forecast – ECLRT Line 5
            </h1>
            <p className="text-gray-600">
              Weather data unavailable. Please check your network connection and reload.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { am5, overall, c } = {
    am5: data.am5Reading,
    overall: data.overallRisk,
    c: riskColour(data.overallRisk),
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Page header */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: '#0087C3' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#888B8D' }}>
                CTSM · Eglinton Crosstown LRT
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#0087C3' }}>
                Tunnel Condensation Forecast
              </h1>
              <p className="text-gray-600 mt-1">{formatDate(data.forecastDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Data fetched</p>
              <p className="text-sm font-medium text-gray-700">{formatFetched(data.fetchedAt)}</p>
              <p className="text-xs text-gray-400 mt-1">Open-Meteo · Toronto</p>
            </div>
          </div>
        </div>

        {/* 5 AM snapshot + overall risk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* 5 AM card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#888B8D' }}>
              5:00 AM Forecast
            </p>
            {am5 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold" style={{ color: '#0087C3' }}>
                    {am5.dewPoint}°C
                  </span>
                  <span className="text-gray-500 pb-1">dew point</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-500 text-xs">Ambient Temp</p>
                    <p className="font-semibold">{am5.temperature}°C</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-500 text-xs">Rel. Humidity</p>
                    <p className="font-semibold">{am5.humidity}%</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-500 text-xs">Tunnel Surface</p>
                    <p className="font-semibold">~10°C</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-500 text-xs">ΔT (Surface − Td)</p>
                    <p className={`font-semibold ${am5.margin <= 0 ? 'text-red-600' : am5.margin <= 2 ? 'text-orange-600' : 'text-green-600'}`}>
                      {am5.margin > 0 ? '+' : ''}{am5.margin}°C
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">5 AM data not available in this forecast window.</p>
            )}
          </div>

          {/* Overall risk card */}
          <div className={`rounded-lg shadow-md p-6 ${c.bg}`}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#888B8D' }}>
              Overall Risk (24 h)
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-block w-4 h-4 rounded-full ${c.dot}`}></span>
              <span className={`text-2xl font-bold ${c.text}`}>{overall}</span>
            </div>
            <p className={`text-sm font-medium ${c.text} mb-4`}>{riskLabel(overall)}</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>Critical: Dew pt ≥ Surface temp</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1"></span>High: ΔT &lt; 2°C</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>Moderate: ΔT 2–5°C</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1"></span>Low: ΔT &gt; 5°C</p>
            </div>
          </div>
        </div>

        {/* Zone status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#0087C3' }}>
            Zone Status — Based on 5 AM Dew Point
          </h2>
          <div className="space-y-4">
            {data.zones.map((zone) => {
              const zc = riskColour(zone.risk)
              return (
                <div key={zone.name} className={`rounded-lg p-4 ${zc.bg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div>
                      <p className={`font-semibold ${zc.text}`}>{zone.name}</p>
                      <p className="text-xs text-gray-500">{zone.stations}</p>
                    </div>
                    <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full text-white ${zc.badge}`}>
                      {zone.risk}
                    </span>
                  </div>
                  <p className={`text-sm ${zc.text}`}>{zone.notes}</p>
                  {zone.surfaceTemp !== -99 && am5 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Surface {zone.surfaceTemp}°C · Dew pt {am5.dewPoint}°C · ΔT {Math.round((zone.surfaceTemp - am5.dewPoint) * 10) / 10}°C
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Hourly table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#0087C3' }}>
            24-Hour Hourly Forecast
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-600 whitespace-nowrap">Time</th>
                  <th className="text-right py-2 pr-4 font-semibold text-gray-600 whitespace-nowrap">Temp (°C)</th>
                  <th className="text-right py-2 pr-4 font-semibold text-gray-600 whitespace-nowrap">Dew Pt (°C)</th>
                  <th className="text-right py-2 pr-4 font-semibold text-gray-600 whitespace-nowrap">RH (%)</th>
                  <th className="text-right py-2 pr-4 font-semibold text-gray-600 whitespace-nowrap">ΔT (°C)</th>
                  <th className="text-left py-2 font-semibold text-gray-600">Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.hourly.map((h) => {
                  const hc = riskColour(h.risk)
                  const is5am = h.hour === 5
                  return (
                    <tr
                      key={h.time}
                      className={`border-b border-gray-100 ${is5am ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {h.time}
                        {is5am && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded text-white font-normal" style={{ backgroundColor: '#0087C3' }}>
                            5 AM
                          </span>
                        )}
                      </td>
                      <td className="text-right py-2 pr-4">{h.temperature}</td>
                      <td className="text-right py-2 pr-4">{h.dewPoint}</td>
                      <td className="text-right py-2 pr-4">{h.humidity}</td>
                      <td className={`text-right py-2 pr-4 ${h.margin <= 0 ? 'text-red-600' : h.margin <= 2 ? 'text-orange-600' : 'text-gray-700'}`}>
                        {h.margin > 0 ? '+' : ''}{h.margin}
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white ${hc.badge}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80"></span>
                          {h.risk}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-500">
            Condensation risk is assessed against a nominal tunnel surface temperature of ~10°C (Toronto subsurface ground temperature at 5–10 m depth).
            Actual surface temperatures vary by section, season, and ventilation mode. This forecast is a planning aid only;
            field readings from tunnel sensors and OCC records take precedence.
            Weather source: Open-Meteo (open-meteo.com). Data refreshed every 30 minutes.
          </p>
        </div>

      </div>
    </div>
  )
}
