import Link from 'next/link'
import TopicSubHeader, { type TopicTab } from '../TopicSubHeader'

interface ItemEntry {
  slug: string
  name: string
  type: string
  rarity: string
  stats: string
  affix: string
}

interface DatabaseTemplateProps {
  topicId: string
  topicName: string
  tabs?: TopicTab[]
  items?: ItemEntry[]
}

export default function DatabaseTemplate({
  topicId,
  topicName,
  tabs = [],
  items = [],
}: DatabaseTemplateProps) {
  return (
    <div className="w-full min-h-screen bg-[var(--dark-1)] text-white selection:bg-zinc-800 selection:text-white">
      {/* Sub Header */}
      <TopicSubHeader topicId={topicId} topicName={topicName} activeCategory="items" tabs={tabs} />

      {/* Header Section */}
      <section className="border-b border-[#27272a] bg-[#09090b] px-8 py-10">
        <div className="mx-auto max-w-[1360px] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Database Index</span>
            <span>&bull;</span>
            <span>Items &amp; Affixes</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {topicName} <span className="font-normal text-zinc-500">Item Database</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            Search unique weapons, armor, amulets, and crafting base items.
          </p>

          {/* Search Box & Category Filters */}
          <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder={`Search ${topicName} items, stats or affixes...`}
                className="w-full rounded-lg border border-[#27272a] bg-[#121212] px-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button className="rounded-md border border-white bg-white px-3 py-1 font-semibold text-black">
                All Items
              </button>
              <button className="rounded-md border border-[#27272a] bg-[#121212] px-3 py-1 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors">
                Weapons
              </button>
              <button className="rounded-md border border-[#27272a] bg-[#121212] px-3 py-1 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors">
                Armor
              </button>
              <button className="rounded-md border border-[#27272a] bg-[#121212] px-3 py-1 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors">
                Jewelry
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Database Grid */}
      <main className="mx-auto max-w-[1360px] px-8 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/${topicId}/db/items/${item.slug}`}
              className="group rounded-xl border border-[#27272a] bg-[#09090b] p-5 transition-all hover:border-zinc-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-zinc-400">{item.type}</span>
                <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-300">
                  {item.rarity}
                </span>
              </div>

              <h2 className="mt-2 text-base font-semibold text-white group-hover:text-zinc-200 transition-colors">
                {item.name}
              </h2>

              <div
                className="mt-2 text-xs font-mono text-zinc-400"
                dangerouslySetInnerHTML={{ __html: item.stats }}
              />

              <p className="mt-3 border-t border-[#27272a] pt-3 text-xs leading-relaxed text-zinc-300 font-sans">
                {item.affix}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
