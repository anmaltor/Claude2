export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface SystemStatus {
  name: string
  status: 'Nominal' | 'Monitor' | 'Alert' | 'Critical'
  note: string
}

export interface DailyForecast {
  date: string
  generatedAt: string
  tempC: number
  dewPointC: number
  humidity: number
  deltaT: number
  riskLevel: RiskLevel
  description: string
  systems: SystemStatus[]
}

export interface WeeklyForecast {
  day: string
  date: string
  tempC: number
  dewPointC: number
  humidity: number
  riskLevel: RiskLevel
}

function getRiskLevel(deltaT: number): RiskLevel {
  if (deltaT < 0.5) return 'Critical'
  if (deltaT < 2) return 'High'
  if (deltaT < 5) return 'Medium'
  return 'Low'
}

function getSystemStatus(riskLevel: RiskLevel): SystemStatus[] {
  const statusMap: Record<RiskLevel, SystemStatus[]> = {
    Low: [
      { name: 'Track Circuits', status: 'Nominal', note: 'No condensation impact expected' },
      { name: 'Traction Power (25kV)', status: 'Nominal', note: 'Insulator leakage within limits' },
      { name: 'Station HVAC', status: 'Nominal', note: 'Platform climate control operating normally' },
      { name: 'Vehicle Systems', status: 'Nominal', note: 'No cab or equipment condensation risk' },
      { name: 'Signal Equipment', status: 'Nominal', note: 'Enclosures dry — no intervention required' },
    ],
    Medium: [
      { name: 'Track Circuits', status: 'Monitor', note: 'Adhesion slight degradation possible — monitor shunt resistance' },
      { name: 'Traction Power (25kV)', status: 'Monitor', note: 'Elevated humidity — inspect insulators at next opportunity' },
      { name: 'Station HVAC', status: 'Monitor', note: 'Increase platform ventilation capacity by 15%' },
      { name: 'Vehicle Systems', status: 'Nominal', note: 'Vehicle pre-heating recommended before first service' },
      { name: 'Signal Equipment', status: 'Monitor', note: 'Check cabinet seals at surface locations' },
    ],
    High: [
      { name: 'Track Circuits', status: 'Alert', note: 'Reduced adhesion likely — apply Sandite to affected sections' },
      { name: 'Traction Power (25kV)', status: 'Alert', note: 'Elevated leakage current risk — deploy inspection team' },
      { name: 'Station HVAC', status: 'Alert', note: 'Activate condensation drainage — increase dehumidification' },
      { name: 'Vehicle Systems', status: 'Monitor', note: 'Mandate cab pre-heating 30 min before first departure' },
      { name: 'Signal Equipment', status: 'Alert', note: 'Remote diagnostics check — verify enclosure integrity' },
    ],
    Critical: [
      { name: 'Track Circuits', status: 'Critical', note: 'Severe adhesion loss — restrict speed, apply Sandite, notify OCC' },
      { name: 'Traction Power (25kV)', status: 'Critical', note: 'Emergency insulator inspection required before first service' },
      { name: 'Station HVAC', status: 'Alert', note: 'Maximum dehumidification mode — check platform slip hazard' },
      { name: 'Vehicle Systems', status: 'Alert', note: 'Full vehicle pre-heating + pantograph inspection required' },
      { name: 'Signal Equipment', status: 'Critical', note: 'Deploy field team to all surface signal locations' },
    ],
  }
  return statusMap[riskLevel]
}

function getRiskDescription(riskLevel: RiskLevel, deltaT: number): string {
  const dt = deltaT.toFixed(1)
  switch (riskLevel) {
    case 'Critical':
      return `ΔT = ${dt}°C — Condensation forming on exposed surfaces. Immediate operational action required across all vulnerable assets.`
    case 'High':
      return `ΔT = ${dt}°C — High condensation probability. Proactive interventions required before first service departure.`
    case 'Medium':
      return `ΔT = ${dt}°C — Moderate condensation risk. Enhanced monitoring in place; targeted inspections recommended.`
    case 'Low':
      return `ΔT = ${dt}°C — Condensation risk is within acceptable limits. Standard operating protocols apply.`
  }
}

// Deterministic daily values keyed to day-of-year for consistent rendering
const dailySeeds: [number, number, number][] = [
  [14.2, 9.8, 71],
  [12.5, 10.1, 78],
  [11.0, 10.2, 88],
  [15.8, 8.4, 63],
  [17.3, 7.6, 57],
  [13.6, 10.8, 80],
  [10.4, 9.7, 91],
]

function buildForecastDay(offsetDays: number): { tempC: number; dewPointC: number; humidity: number; deltaT: number; riskLevel: RiskLevel } {
  const idx = ((offsetDays % 7) + 7) % 7
  const [tempC, dewPointC, humidity] = dailySeeds[idx]
  const deltaT = parseFloat((tempC - dewPointC).toFixed(1))
  return { tempC, dewPointC, humidity, deltaT, riskLevel: getRiskLevel(deltaT) }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function dayName(d: Date): string {
  return d.toLocaleDateString('en-CA', { weekday: 'short' })
}

export function getTodayForecast(): DailyForecast {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const forecast5am = new Date(today)
  forecast5am.setHours(5, 0, 0, 0)

  const { tempC, dewPointC, humidity, deltaT, riskLevel } = buildForecastDay(0)

  return {
    date: formatDate(today),
    generatedAt: forecast5am.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' local',
    tempC,
    dewPointC,
    humidity,
    deltaT,
    riskLevel,
    description: getRiskDescription(riskLevel, deltaT),
    systems: getSystemStatus(riskLevel),
  }
}

export function getWeeklyForecast(): WeeklyForecast[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const { tempC, dewPointC, humidity, riskLevel } = buildForecastDay(i)
    return {
      day: i === 0 ? 'Today' : dayName(d),
      date: shortDate(d),
      tempC,
      dewPointC,
      humidity,
      riskLevel,
    }
  })
}

export const riskColors: Record<RiskLevel, { bg: string; text: string; border: string; badge: string }> = {
  Low:      { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-400', badge: 'bg-green-100 text-green-800' },
  Medium:   { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
  High:     { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-400', badge: 'bg-orange-100 text-orange-800' },
  Critical: { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-500',   badge: 'bg-red-100 text-red-800' },
}

export const systemStatusColors: Record<SystemStatus['status'], string> = {
  Nominal:  'bg-green-100 text-green-800',
  Monitor:  'bg-yellow-100 text-yellow-800',
  Alert:    'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
}
