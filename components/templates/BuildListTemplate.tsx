import Link from 'next/link'
import TopicSubHeader, { type TopicTab } from '../TopicSubHeader'

interface BuildItem {
  slug: string
  title: string
  class: string
  tier: 'S+' | 'S' | 'A' | 'B'
  playstyle: string
  dps: string
  budget: 'Low' | 'Medium' | 'High'
  desc: string
  img?: string
}

interface BuildListTemplateProps {
  topicId: string
  topicName: string
  tabs?: TopicTab[]
  builds?: BuildItem[]
}

export default function BuildListTemplate({
  topicId,
  topicName,
  tabs = [],
  builds = [],
}: BuildListTemplateProps) {
  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] text-white selection:bg-zinc-800 selection:text-white">
      {/* Sub Header */}
      <TopicSubHeader topicId={topicId} topicName={topicName} activeCategory="builds" tabs={tabs} />

      {/* Header Title Section */}
      <section className="border-b border-[#27272a] bg-[#09090b] px-8 py-10">
        <div className="mx-auto max-w-[1360px] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Tier List Matrix</span>
            <span>&bull;</span>
            <span>Endgame Builds</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {topicName} <span className="font-normal text-zinc-500">Build Guides &amp; Tier List</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            Curated endgame build guides tested for mapping speed, boss damage, and budget accessibility.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="rounded-md border border-white bg-white px-3 py-1 font-semibold text-black">
              All Builds
            </span>
            <button className="rounded-md border border-[#27272a] bg-[#121212] px-3 py-1 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors">
              League Starters
            </button>
            <button className="rounded-md border border-[#27272a] bg-[#121212] px-3 py-1 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors">
              Pinnacle Boss Killers
            </button>
            <button className="rounded-md border border-[#27272a] bg-[#121212] px-3 py-1 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors">
              Hardcore Viable
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1360px] px-8 py-10 space-y-10">
        {/* Tier Group: S-Tier */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-[#27272a] pb-3">
            <span className="rounded bg-white px-2 py-0.5 text-xs font-bold text-black font-mono">
              S-TIER BUILDS
            </span>
            <span className="text-xs text-zinc-400 font-mono">Highest Clear Speed &amp; Scaling</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {builds
              .filter((b) => b.tier.startsWith('S'))
              .map((build) => (
                <Link
                  key={build.slug}
                  href={`/${topicId}/db/builds/${build.slug}`}
                  className="group relative h-[240px] rounded-xl border border-[#27272a] overflow-hidden transition-all duration-300 hover:border-zinc-400"
                >
                  {/* Vibrant Full-Bleed Artwork Image Background */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${build.img || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-transparent" />

                  <div className="relative z-10 flex h-full flex-col justify-end p-6 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-white font-semibold">{build.class}</span>
                        <span>&bull;</span>
                        <span className="text-zinc-300" dangerouslySetInnerHTML={{ __html: build.playstyle }} />
                      </div>
                      <span className="rounded border border-zinc-700 bg-black/80 backdrop-blur-sm px-2 py-0.5 text-xs font-mono font-bold text-white">
                        {build.tier}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-zinc-100 transition-colors drop-shadow">
                      {build.title}
                    </h3>

                    <p className="text-xs leading-relaxed text-zinc-300 line-clamp-2">
                      {build.desc}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs font-mono text-zinc-400">
                      <div>DPS: <strong className="text-white font-semibold">{build.dps}</strong></div>
                      <div>Budget: <strong className="text-white font-semibold">{build.budget}</strong></div>
                      <div className="text-white group-hover:underline">Read Guide &rarr;</div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* Tier Group: A-Tier */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-3 border-b border-[#27272a] pb-3">
            <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-bold text-zinc-300 font-mono">
              A-TIER STRONG
            </span>
            <span className="text-xs text-zinc-400 font-mono">Solid Endgame Performers</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {builds
              .filter((b) => b.tier === 'A')
              .map((build) => (
                <Link
                  key={build.slug}
                  href={`/${topicId}/db/builds/${build.slug}`}
                  className="group relative h-[240px] rounded-xl border border-[#27272a] overflow-hidden transition-all duration-300 hover:border-zinc-400"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${build.img || 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80'}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-transparent" />

                  <div className="relative z-10 flex h-full flex-col justify-end p-6 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-white font-semibold">{build.class}</span>
                        <span>&bull;</span>
                        <span className="text-zinc-300" dangerouslySetInnerHTML={{ __html: build.playstyle }} />
                      </div>
                      <span className="rounded border border-zinc-700 bg-black/80 backdrop-blur-sm px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300">
                        {build.tier}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-zinc-100 transition-colors drop-shadow">
                      {build.title}
                    </h3>

                    <p className="text-xs leading-relaxed text-zinc-300 line-clamp-2">
                      {build.desc}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs font-mono text-zinc-400">
                      <div>DPS: <strong className="text-white font-semibold">{build.dps}</strong></div>
                      <div>Budget: <strong className="text-white font-semibold">{build.budget}</strong></div>
                      <div className="text-white group-hover:underline">Read Guide &rarr;</div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </main>
    </div>
  )
}
