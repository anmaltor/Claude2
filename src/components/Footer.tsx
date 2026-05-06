export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Antonio Mallol</h3>
            <p className="text-gray-400">Rail Operations Executive | COO / Head of Operations</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="/about" className="hover:text-white">About & CV</a></li>
              <li><a href="/projects" className="hover:text-white">Projects</a></li>
              <li><a href="/condensation" className="hover:text-white">Condensation</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <div className="space-y-2">
              <p className="text-gray-400">
                <a href="mailto:Antonio.MallolTorralbo@gmail.com" className="hover:text-white">
                  Email: Antonio.MallolTorralbo@gmail.com
                </a>
              </p>
              <p className="text-gray-400">
                <a href="tel:+16475392191" className="hover:text-white">
                  Phone: +1 647-539-2191
                </a>
              </p>
              <p className="text-gray-400">
                <a href="https://www.linkedin.com/in/antonio-mallol-torralbo/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  LinkedIn
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Antonio Mallol. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
