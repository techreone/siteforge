import Link from 'next/link'

export interface TopicTab {
  slug: string
  label: string
  href: string
}

interface TopicSubHeaderProps {
  topicId: string
  topicName: string
  activeCategory?: string
  /** 有内容的分类 tab（数据驱动，空页面不显示入口）；不传则只有 Overview */
  tabs?: TopicTab[]
  /** 当前页所属分类段名（如 "Guides"）；有则渲染为面包屑第三级 */
  sectionLabel?: string
  /** sectionLabel 的链接地址；有则渲染为链接，否则为纯文本 */
  sectionHref?: string
  /** 当前页标题（纯文本，面包屑末级） */
  pageTitle?: string
}

export default function TopicSubHeader({ topicId, topicName, activeCategory = 'overview', tabs = [], sectionLabel, sectionHref, pageTitle }: TopicSubHeaderProps) {
  return (
    <div className="w-full border-b border-[#27272a] bg-[#09090b] text-zinc-300">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumb & Topic Name */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-medium">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-zinc-600">/</span>
          <Link href={`/${topicId}`} className="text-white font-semibold hover:underline">
            {topicName}
          </Link>
          {sectionLabel && (
            <>
              <span className="text-zinc-600">/</span>
              {sectionHref ? (
                <Link href={sectionHref} className="text-zinc-500 hover:text-white transition-colors">
                  {sectionLabel}
                </Link>
              ) : (
                <span className="text-zinc-500">{sectionLabel}</span>
              )}
            </>
          )}
          {pageTitle && (
            <>
              <span className="text-zinc-600">/</span>
              <span className="text-white font-semibold">{pageTitle}</span>
            </>
          )}
        </nav>

        {/* Sub-Header Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto text-xs font-medium scrollbar-none">
          {/* Overview 固定入口 */}
          <Link
            href={`/${topicId}`}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeCategory === 'overview'
                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Overview
          </Link>
          {tabs.map((cat) => {
            const isActive = activeCategory === cat.slug
            return (
              <Link
                key={cat.slug}
                href={cat.href}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {cat.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
