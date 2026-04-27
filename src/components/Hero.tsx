import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Antonio Mallol Torralbo
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-blue-100">
            Rail Operations Executive | COO / Head of Operations
          </p>
          <p className="text-lg mb-10 text-blue-100 max-w-2xl mx-auto">
            20+ years of expertise leading end-to-end transit operations in PPP environments. Proven leader in operational readiness, service delivery, and lifecycle optimization for complex rail systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/about"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View My CV
            </Link>
            <Link
              href="/projects"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              See My Projects
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
