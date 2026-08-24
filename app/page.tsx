import Link from 'next/link'
import RightSidebar from '../components/RightSidebar'
import { listTopics, getCatalog } from '../lib/data'
import { getPost, listPosts } from '../lib/posts'
import { makeOpenGraph, makeTwitter, SITE_URL } from '../lib/seo'
import type { Metadata } from 'next'
import { DEFAULT_TITLE, SITE_NAME, SITE_TAGLINE } from '../lib/site-config'

const PAGE_TITLE = DEFAULT_TITLE
const PAGE_DESCRIPTION =
  SITE_TAGLINE

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
  openGraph: makeOpenGraph({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: SITE_URL,
  }),
  twitter: makeTwitter({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  }),
}

// 真实攻略（全量，仅含实际有 content 攻略的游戏；去掉骨架期占位游戏 poe2/hades2/d4 等假入口）
const ALL_GUIDES = listTopics()
  .filter((g) => !g.startsWith('_') && g !== 'demo')
  .flatMap((topic) =>
    listPosts(topic).map((slug) => {
      const guide = getPost(topic, slug)
      return {
        topic: topic,
        name: getCatalog(topic).name,
        slug,
        title: guide?.frontmatter.title ?? slug.replace(/-/g, ' '),
        summary: guide?.frontmatter.description ?? '',
        img: String(guide?.frontmatter.img ?? ''),
        tags: guide?.frontmatter.mainKeyword ? [guide.frontmatter.mainKeyword] : [],
        date: guide?.frontmatter.date ?? '',
        href: `/${topic}/posts/${slug}`,
      }
    })
  )

// Featured：真实攻略前 1 主 + 4 grid
const FEATURED_MAIN = ALL_GUIDES[0] ?? { title: 'Guides Coming Soon', topic: '', name: '', date: '', href: '/', img: '', summary: '', tags: [] }
const FEATURED_GRID = ALL_GUIDES.slice(1, 5)

// Latest：按更新日期降序（全量展示，替代原 Popular 栏目）
const LATEST = [...ALL_GUIDES].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
// 全站游戏索引（按游戏去重，供 #all-topics 区块渲染）
const ALL_GAMES = [...new Map(ALL_GUIDES.map((g) => [g.topic, g])).values()]

export default function Home() {
  return (
    <>
      {/* Full-Width Welcome Hero Banner */}
        <header className="welcome-hero">
          <div className="welcome-hero-inner">
            <div>
              <h1 className="font-sans text-[28px] font-normal tracking-tight text-[#dadada]">
                Welcome to <strong className="font-semibold text-white">{SITE_NAME}</strong>
              </h1>
              <p className="mt-2 text-sm text-[#95989b] max-w-xl">
                The ultimate portal for Roguelike, Roguelite & Action RPG Topic Guides & Tools.
                Comprehensive build guides, endgame tier lists, and theorycrafting tools.
              </p>
            </div>

          </div>
        </header>

        {/* Main Page Container */}
        <main className="page-container">
          {/* FEATURED GUIDES SECTION */}
          <section className="mb-12">
            <div className="title-box">
              <div className="title-left">
                <div className="title-accent-square"></div>
                <div className="title-text font-sans font-semibold text-sm tracking-wider">Featured Guides</div>
              </div>
              <div className="pager-arrows">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-gray-400 hover:text-white transition-colors"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </div>
            </div>

            <div className="gaming-section">
              {/* Left 56% Main Feature Card */}
              <Link href={FEATURED_MAIN.href} className="post-card gaming-feature-card group">
                {FEATURED_MAIN.img && (
                  <div className="img-container">
                    <div className="img-bg" style={{ backgroundImage: `url('${FEATURED_MAIN.img}')` }} />
                  </div>
                )}
                <div className="shadow-overlay"></div>
                <div className="content-overlay">
                  <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    {FEATURED_MAIN.name}
                  </div>
                  <div className="card-title text-xl font-semibold group-hover:text-white transition-colors">
                    {FEATURED_MAIN.title}
                  </div>
                  <div className="card-meta">
                    {FEATURED_MAIN.date}
                  </div>
                </div>
              </Link>

              {/* Right 44% 2x2 Grid */}
              <div className="gaming-grid-right">
                {FEATURED_GRID.map((item) => (
                  <Link key={item.title} href={item.href} className="post-card group">
                    {item.img && (
                      <div className="img-container">
                        <div className="img-bg" style={{ backgroundImage: `url('${item.img}')` }} />
                      </div>
                    )}
                    <div className="shadow-overlay"></div>
                    <div className="content-overlay">
                      <div className="card-title text-sm font-medium group-hover:text-white transition-colors">
                        {item.title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* LATEST GUIDES SECTION */}
          <section>
            <div className="title-box">
              <div className="title-left">
                <div className="title-accent-square"></div>
                <div className="title-text font-sans font-semibold text-sm tracking-wider">Latest Guides</div>
              </div>
            </div>

            <div className="news-layout">
              {/* News Feed List (Flex: 1) */}
              <div className="news-feed">
                {LATEST.slice(0, 24).map((item) => (
                  <Link key={item.title} href={item.href} className="news-post-item group">
                    {item.img && (
                      <div className="news-thumb" style={{ backgroundImage: `url('${item.img}')` }} />
                    )}
                    <div className="news-info">
                      <div>
                        <div className="news-header-row">
                          <span className="news-category text-xs font-medium uppercase text-zinc-400">
                            {item.topic} <span className="text-zinc-500">↗</span>
                          </span>
                          <div className="news-tags items-center gap-2">
                            {item.tags.map((tag) => (
                              <span key={tag} className="badge-item">{tag}</span>
                            ))}
                            <span className="text-[11px] font-medium text-zinc-500 uppercase ml-1">PC</span>
                          </div>
                        </div>
                        <div className="news-heading text-base font-semibold group-hover:text-white transition-colors">
                          {item.title}
                        </div>
                        <div className="news-summary">{item.summary}</div>
                      </div>
                      <div className="card-meta text-xs mt-2">
                        {item.date}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Right 300px Sticky Sidebar */}
              <RightSidebar />
            </div>

            {/* All Games Index — 全站入口（纯文本链接，体积小，SEO 内链保底） */}
            <div id="all-topics" className="mt-10 border-t border-zinc-800 pt-8">
              <h2 className="title-text font-sans text-sm font-semibold tracking-wider text-zinc-300">
                Browse All Topic Guides
              </h2>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {ALL_GAMES.map((g) => (
                  <li key={g.topic}>
                    <Link href={`/${g.topic}`} className="text-sm text-zinc-500 hover:text-white transition-colors">
                      {g.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Structured Data (JSON-LD FAQ) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: SITE_NAME,
                url: SITE_URL,
                description: 'Community database and wiki for roguelike and gaming action RPGs.',
              }),
            }}
          />
        </main>
    </>
  )
}
