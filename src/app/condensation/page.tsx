import CondensationForecast from '@/components/CondensationForecast'

export const metadata = {
  title: 'Daily 5 AM Condensation Forecast — Antonio Mallol',
  description: 'Daily 5 AM condensation and rail adhesion risk forecast for Toronto LRT operations.',
}

export default function CondensationPage() {
  return (
    <div>
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Daily 5 AM Condensation Forecast</h1>
          <p className="mt-2 text-blue-200 text-sm max-w-2xl">
            Hourly dew-point spread analysis for rail adhesion planning. Condensation on rail surfaces
            significantly reduces wheel–rail adhesion, requiring speed restrictions and sanding protocols.
          </p>
        </div>
      </div>
      <CondensationForecast />
    </div>
  )
}
