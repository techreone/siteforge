import type { Metadata } from 'next'
import localFont from 'next/font/local'
import '../styles/globals.css'
import Link from 'next/link'
import AdsterraBanner from '../components/AdsterraBanner'
import LeftSidebar from '../components/LeftSidebar'
import MainHeader from '../components/MainHeader'
import { getCatalog, listTopics } from '../lib/data'
import { listPosts } from '../lib/posts'
import { DEFAULT_OG_IMAGE, SITE_URL } from '../lib/seo'
import { CONTACT_EMAIL, DEFAULT_TITLE, SITE_LOGO_ICON, SITE_NAME, SITE_TAGLINE } from '../lib/site-config'

// 真实游戏列表：只有"有真实内容（content/ 攻略）"的游戏才显示，
// 假数据游戏（poe2/hades2/d4 等）不进入侧边栏/顶栏
const GAMES = listTopics()
  .filter((g) => !g.startsWith('_') && g !== 'demo' && listPosts(g).length > 0)
  .map((g) => {
    const cat = getCatalog(g)
    return { id: g, title: cat.name, img: (cat as { icon?: string }).icon ?? '' }
  })

const sourceSans3 = localFont({
  src: [
    { path: '../public/fonts/SourceSans3-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/SourceSans3-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/SourceSans3-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

const oswald = localFont({
  src: [
    { path: '../public/fonts/Oswald-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/Oswald-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/Oswald-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/Oswald-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-oswald',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: '%s',
  },
  description:
    SITE_TAGLINE,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${sourceSans3.variable} ${oswald.variable}`}>
      <head>
        {/* Google AdSense (ca-pub-4279540531842674) */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4279540531842674" crossOrigin="anonymous" />
        {/* Adsterra Popunder Ad (ID: 30727122) */}
        <script async src="https://pl30827621.effectivecpmnetwork.com/c3/ef/81/c3ef814f619c0d00ce39cd5770fb6f38.js" />
      </head>
      <body className="flex min-h-screen flex-col bg-[var(--dark-1)] text-foreground font-sans antialiased pb-14 md:pb-0">
        {/* Permanent Expandable Left Navigation Sidebar */}
        <LeftSidebar topics={GAMES} />

        {/* Main Content Wrapper (Adjacent to Left Sidebar) */}
        <div className="main-content-wrapper">
          {/* Permanent Top Main Header Navigation */}
          <MainHeader topics={GAMES} />

          {/* Page Body Content */}
          {children}

          {/* Global Footer — EAT 信任链接（TOS/Privacy/About）全站可见 */}
          <footer className="border-t border-zinc-800/60 py-8">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-zinc-500 sm:flex-row">
              <div>
                {`${new Date().getFullYear()} © ${SITE_NAME}`}
              </div>
              <nav aria-label="Footer" className="flex items-center gap-4">
                <Link href="/about" className="transition-colors hover:text-zinc-300">About</Link>
                <Link href="/privacy" className="transition-colors hover:text-zinc-300">Privacy Policy</Link>
                <Link href="/tos" className="transition-colors hover:text-zinc-300">Terms of Service</Link>
              </nav>
            </div>
          </footer>

          {/* Structured Data (JSON-LD Organization) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: SITE_NAME,
                url: SITE_URL,
                logo: {
                  '@type': 'ImageObject',
                  url: 'SITE_LOGO_ICON}',
                },
                email: 'CONTACT_EMAIL',
              }),
            }}
          />
        </div>

        {/* Adsterra Mobile Sticky Bottom Banner 320x50 (ID: 30727131) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center bg-[#0a0a0a]/95 border-t border-zinc-800/80 py-1 shadow-2xl backdrop-blur-md md:hidden">
          <AdsterraBanner
            idKey="a7513ad6cd7218ca2f3dfb789cf33ea4"
            width={320}
            height={50}
            label=""
            className="!my-0 !p-0 !border-0 !bg-transparent !shadow-none"
          />
        </div>

        {/* Adsterra Social Bar Ad (ID: 30727124) */}
        <script async src="https://pl30827623.effectivecpmnetwork.com/bb/99/32/bb99320097771b0677d9fa8794479c0c.js" />
      </body>
    </html>
  )
}
