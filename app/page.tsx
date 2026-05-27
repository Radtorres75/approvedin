import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center max-w-xl">
        {/* Logo */}
        <div className="mb-4">
          <span className="text-5xl font-bold tracking-tight text-[#217346]">
            ApprovedIn
          </span>
        </div>

        {/* Tagline */}
        <p className="text-xl text-gray-500 font-light tracking-widest uppercase mb-12">
          Compliance. Community.
        </p>

        {/* Description */}
        <p className="text-gray-600 mb-10 text-lg leading-relaxed">
          The vendor compliance platform built for Florida community association managers.
          Track certificates of insurance, trade licenses, and corporate filings — all in one place.
        </p>

        {/* Sign In Button */}
        <Link
          href="/login"
          className="inline-block bg-[#217346] hover:bg-[#185c38] text-white font-semibold px-10 py-3 rounded-lg text-lg transition-colors duration-200 shadow-sm"
        >
          Sign In
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-gray-400 text-sm">
        © {new Date().getFullYear()} ApprovedIn. Built for Florida CAMs.
      </footer>
    </main>
  )
}
