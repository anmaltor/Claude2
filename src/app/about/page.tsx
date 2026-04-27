import { resumeData } from '@/data/resume'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">{resumeData.name}</h1>
          <p className="text-xl text-gray-600 mb-4">{resumeData.title}</p>
          <div className="flex flex-wrap gap-6 text-gray-600">
            <a href={`mailto:${resumeData.email}`} className="hover:text-blue-600">
              {resumeData.email}
            </a>
            <a href={`tel:${resumeData.phone}`} className="hover:text-blue-600">
              {resumeData.phone}
            </a>
            <span>{resumeData.location}</span>
            <a href={resumeData.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
              LinkedIn
            </a>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Professional Summary</h2>
          <p className="text-gray-700 leading-relaxed">{resumeData.summary}</p>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Professional Experience</h2>
          <div className="space-y-8">
            {resumeData.experience.map((job, index) => (
              <div key={index} className="border-l-4 border-blue-600 pl-6">
                <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                <p className="text-blue-600 font-semibold">{job.company}</p>
                <p className="text-gray-600 text-sm">
                  {job.startDate} – {job.endDate} | {job.location}
                </p>
                <ul className="mt-3 space-y-2">
                  {job.highlights.map((highlight, idx) => (
                    <li key={idx} className="text-gray-700 flex items-start">
                      <span className="text-blue-600 mr-3">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Core Skills</h2>
          <div className="flex flex-wrap gap-3">
            {resumeData.skills.map((skill) => (
              <span key={skill} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Education</h2>
          <div className="space-y-6">
            {resumeData.education.map((edu, index) => (
              <div key={index} className="pb-6 border-b border-gray-200 last:border-b-0">
                <h3 className="text-lg font-bold text-gray-900">{edu.degree}</h3>
                <p className="text-blue-600 font-semibold">{edu.school}</p>
                <p className="text-gray-600 text-sm">{edu.location} • {edu.year}</p>
                {edu.note && <p className="text-gray-700 mt-2 italic text-sm">{edu.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Interests</h2>
          <div className="flex flex-wrap gap-3">
            {resumeData.interests.map((interest) => (
              <span key={interest} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium">
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
