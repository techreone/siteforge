import Link from 'next/link'
import TopicSubHeader, { type TopicTab } from '../TopicSubHeader'
import { SITE_NAME } from '../../lib/site-config'


// 可复用游戏 Hub 模板：数据驱动（guides/categories 从真实数据传入），
// 无数据时用占位图 + 占位名兜底；排版保留（hero + Featured + Essential）。

interface HubGuide {
  slug: string
  title: string
  description?: string
  img?: string
}

interface HubCategory {
  slug: string
  name: string
  description?: string
}

interface TopicHubTemplateProps {
  topicId: string
  topicName: string
  version?: string
  description?: string
  about?: string
  bannerImg?: string
  guides?: HubGuide[]
  categories?: HubCategory[]
  tabs?: TopicTab[]
  accent?: string
}

export default function TopicHubTemplate({
  topicId,
  topicName,
  version = 'v1.0.0',
  description = 'Guides, puzzle solutions and resources for this topic.',
  about = '',
  bannerImg = '',
  guides = [],
  categories = [],
  tabs = [],
  accent = '#e2b93f',
}: TopicHubTemplateProps) {
  // Featured 去重规则：攻略 ≥3 篇才显示 Featured（取前 3）；<3 篇不显示 Featured，全部进 Section 2
  const hasFeatured = guides.length >= 3
  const mainGuide = hasFeatured ? guides[0] : undefined
  const secondary = hasFeatured ? guides.slice(1, 3) : []
  // Section 2 只显示 Featured 之外的剩余篇（≥4 篇时）；无剩余则整个模块不显示（不重复、不补占位）
  const section2Guides = hasFeatured ? guides.slice(3) : guides
  const showSection2 = section2Guides.length > 0
  // hero 按钮：db 分类入口（跳过 guides，已有 View All Guides 覆盖攻略入口）
  const dbCategories = categories.filter((c) => c.slug !== 'posts').slice(0, 2)

  return (
    <div className="min-h-screen bg-[var(--dark-1)] text-white selection:bg-zinc-800 selection:text-white">
      {/* Universal Sub-Header */}
      <TopicSubHeader topicId={topicId} topicName={topicName} activeCategory="overview" tabs={tabs} />

      {/* Topic Hero Banner (Vibrant Original Artwork - No Greyscale) */}
      <section className="relative w-full border-b border-[#27272a] bg-[#09090b]">
        {bannerImg && (
          <div className="absolute inset-0 opacity-40 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerImg} alt={topicName} className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          </div>
        )}

        <div className="relative mx-auto flex max-w-[1360px] flex-col gap-6 px-8 py-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl drop-shadow-md">
              <span className="inline-block border-b-4 pb-1" style={{ borderColor: accent }}>
              {topicName} <span className="font-normal text-zinc-400">Hub</span>
            </span>
            </h1>
            <p className="text-sm leading-relaxed text-zinc-300 drop-shadow">
              {description}
            </p>
          </div>

          {dbCategories.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {dbCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${topicId}/db/${c.slug}`}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-black/80 backdrop-blur-sm px-5 py-2.5 text-xs font-semibold text-zinc-200 hover:border-white hover:text-white transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About {topicName} — 折叠摘要（details 原生折叠，零 JS；SEO 全文保留在 DOM） */}
      {about && (
        <details className="group mx-auto max-w-[1360px] px-8 pt-6">
          <summary className="flex cursor-pointer list-none items-center justify-between border-b border-[#27272a] pb-2 text-sm font-semibold text-white uppercase tracking-wider [&::-webkit-details-marker]:hidden">
            <span>About {topicName}</span>
            <span className="text-xs font-normal text-zinc-500 group-open:hidden">Read more ▾</span>
            <span className="hidden text-xs font-normal text-zinc-500 group-open:inline">Collapse ▴</span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300 md:text-[15px]">
            {about}
          </p>
        </details>
      )}

      {/* Main Bento Layout with Rich Image Entrances */}
      <main className="mx-auto max-w-[1360px] px-8 py-10 space-y-12">
        {/* SECTION 1: FEATURED GUIDES — 仅 ≥3 篇时显示（前 3 篇），与 Section 2 不重复 */}
        {hasFeatured && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Featured Guides ({topicName})
              </h2>
            </div>
            <Link href={`/${topicId}/guides`} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
              View All Guides &rarr;
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            {/* Main Featured Card (7 Cols) - Rich Artwork Background */}
            <Link
              href={`/${topicId}/guides/${mainGuide?.slug ?? ''}`}
              className={`group relative md:col-span-7 h-[360px] rounded-xl border border-[#27272a] overflow-hidden transition-all duration-300 hover:border-zinc-400 ${mainGuide ? '' : 'pointer-events-none opacity-80'}`}
            >
              {mainGuide?.img && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${mainGuide.img}')` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

              <div className="relative z-10 flex h-full flex-col justify-end p-6 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="rounded bg-white px-2 py-0.5 font-bold text-black">
                    FEATURED
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white group-hover:text-zinc-100 transition-colors drop-shadow">
                  {mainGuide?.title ?? 'Guides Coming Soon'}
                </h3>
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                  {mainGuide?.description ?? 'More guides are on the way.'}
                </p>
                <div className="flex items-center justify-between pt-2 text-xs font-mono text-zinc-400 border-t border-white/10">
                  <span>{SITE_NAME}</span>
                  <span className="text-white group-hover:underline">Read Guide &rarr;</span>
                </div>
              </div>
            </Link>

            {/* Secondary Cards Column (5 Cols) */}
            <div className="md:col-span-5 flex flex-col gap-6">
              {secondary.map((g, i) => (
                <Link
                  key={g.slug}
                  href={`/${topicId}/guides/${g.slug}`}
                  className={`group relative h-[168px] rounded-xl border border-[#27272a] overflow-hidden transition-all duration-300 hover:border-zinc-400 ${g.slug.startsWith('guide-') ? 'pointer-events-none opacity-80' : ''}`}
                >
                  {g.img && (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${g.img}')` }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                  <div className="relative z-10 flex h-full flex-col justify-end p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="rounded bg-zinc-900/90 px-1.5 py-0.5 text-zinc-200 border border-zinc-700">
                        {g.slug.startsWith('guide-') ? 'SOON' : 'GUIDE'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors">
                      {g.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                      <span>{g.description?.slice(0, 40) ?? ''}</span>
                      <span className="text-white group-hover:underline">Read Guide &rarr;</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* SECTION 2: ESSENTIAL GUIDES & DATABASE — 只显示 Featured 之外的剩余篇；<3 篇时显示全部 */}
        {showSection2 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Guides &amp; Database &amp; Tools
            </h2>
            <Link href={`/${topicId}/guides`} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
              View All Guides &rarr;
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {section2Guides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/${topicId}/guides/${g.slug}`}
                  className="group relative h-[220px] rounded-xl border border-[#27272a] overflow-hidden transition-all duration-300 hover:border-zinc-400"
                >
                  {g.img && (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${g.img}')` }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

                  <div className="relative z-10 flex h-full flex-col justify-end p-5 space-y-1">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      GUIDE
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors">
                      {g.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {g.description ?? ''}
                    </p>
                  </div>
                </Link>
            ))}
          </div>
        </section>
        )}
      </main>
    </div>
  )
}
