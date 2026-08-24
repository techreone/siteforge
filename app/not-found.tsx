import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME } from '../lib/site-config'

export const metadata: Metadata = {
  title: `Page Not Found — ${SITE_NAME}`,
  description:
    `The page you are looking for does not exist or has moved. Browse ${SITE_NAME} posts from the homepage instead.`,
  robots: {
    index: false,
  },
}

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-8 py-24 text-center text-white">
      <p className="font-heading text-6xl font-bold text-zinc-700">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Page Not Found</h1>
      <p className="mt-3 leading-relaxed text-zinc-400">
        The page you are looking for does not exist or has been moved. Try the homepage or one of
        the topic hubs below.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:border-white hover:text-white transition-colors">
          Back to Home
        </Link>
        <Link href="/about" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          {`About ${SITE_NAME}`}
        </Link>
      </div>
    </main>
  )
}
