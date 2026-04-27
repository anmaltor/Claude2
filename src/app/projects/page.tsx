import ProjectCard from '@/components/ProjectCard'
import { resumeData } from '@/data/resume'

export default function Projects() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Featured Projects</h1>
          <p className="text-xl text-gray-600">
            A selection of major projects and initiatives I've led throughout my career in rail operations and infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resumeData.projects.map((project) => (
            <ProjectCard
              key={project.title}
              title={project.title}
              description={project.description}
              technologies={project.technologies}
              link={project.link}
            />
          ))}
        </div>

        {/* Project Details Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Key Project Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-600">ECLRT Operational Readiness</h3>
              <p className="text-gray-700 mb-3">
                Led the complete operational readiness strategy for the Eglinton Crosstown Light Rail Transit, achieving successful trial running phase and transition to live operations.
              </p>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• ~98% Service Availability (SLA Target)</li>
                <li>• 25 stations and 19km of track handover</li>
                <li>• Full evacuation protocol validation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-600">Madrid Light Rail Network</h3>
              <p className="text-gray-700 mb-3">
                Maintained exceptional service levels across the ML2 and ML3 light rail network while driving significant cost reductions.
              </p>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• 99.5% Service Availability</li>
                <li>• 35% reduction in maintenance budget</li>
                <li>• 30% reduction in service-affecting incidents</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-600">Bechtel O&M Business Development</h3>
              <p className="text-gray-700 mb-3">
                Established and grew Bechtel's O&M business line globally, leading multiple major PPP rail projects.
              </p>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Ottawa LRT: 30% cost savings</li>
                <li>• Finch LRT: 20% cost savings</li>
                <li>• Gordie Howe Bridge: 40% cost savings</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-600">ECLRT Vehicle-Infrastructure Integration</h3>
              <p className="text-gray-700 mb-3">
                Resolved critical technical integration challenges between fleet manufacturer and construction joint venture for multi-billion dollar project.
              </p>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Successfully mediated technical clashes</li>
                <li>• Delivered competitive 25% cost reduction bid</li>
                <li>• Ensured regulatory compliance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
