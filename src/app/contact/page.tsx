import { resumeData } from '@/data/resume'

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold mb-6">Contact Information</h1>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <a href={`mailto:${resumeData.email}`} className="text-blue-600 hover:text-blue-800">
                    {resumeData.email}
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                  <a href={`tel:${resumeData.phone}`} className="text-blue-600 hover:text-blue-800">
                    {resumeData.phone}
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-700">{resumeData.location}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">LinkedIn</h3>
                  <a href={resumeData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    View Profile
                  </a>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
