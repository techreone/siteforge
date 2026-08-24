import type { Metadata } from 'next'
import Link from 'next/link'
import { Fragment } from 'react'
import TopicSubHeader from '../../../components/TopicSubHeader'
import { getCatalog, getTopicTabs, listTopics } from '../../../lib/data'
import { getPost, listPosts } from '../../../lib/posts'
import { SITE_NAME, SITE_URL } from '../../../lib/site-config'


const SITE = SITE_URL

export function generateStaticParams() {
  return listTopics()
    .filter((topic) => topic !== 'favicon.ico' && !topic.startsWith('_'))
    .map((topic) => ({ topic }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>
}): Promise<Metadata> {
  const { topic } = await params
  const catalog = getCatalog(topic)
  const title = catalog.name + ` Posts — ${SITE_NAME}`
  const description = 'Guides and puzzle solutions for ' + catalog.name + '.'
  const url = SITE + '/' + topic + '/guides'
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function GuidesIndexPage({
  params,
}: {
  params: Promise<{ topic: string }>
}) {
  const { topic } = await params
  const catalog = getCatalog(topic)
  const slugs = listPosts(topic)
  const guides = slugs
    .map((slug) => ({ slug, guide: getPost(topic, slug) }))
    .filter((g) => g.guide !== null)

  // SEO 结构化数据：BreadcrumbList + ItemList（攻略 ≤100 项）
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: catalog.name, item: SITE + '/' + topic },
      { '@type': 'ListItem', position: 3, name: 'Guides', item: SITE + '/' + topic + '/guides' },
    ],
  }
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: guides.slice(0, 100).map(({ slug, guide }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: guide!.frontmatter.title ?? slug.replace(/-/g, ' '),
      url: SITE + '/' + topic + '/posts/' + slug,
    })),
  }

  return (
    <div className="min-h-screen bg-[var(--dark-1)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {guides.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
      <TopicSubHeader topicId={topic} topicName={catalog.name} activeCategory="posts" tabs={getTopicTabs(topic)} sectionLabel="Posts" />
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{catalog.name} Guides</h1>
        <p className="mt-2 text-sm text-zinc-400">{catalog.description}</p>

        {guides.length === 0 ? (
          <p className="mt-10 text-sm text-zinc-500">Guides coming soon.</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {guides.map(({ slug, guide }) => (
              <Link
                key={slug}
                href={`/${topic}/posts/${slug}`}
                className="group rounded-[var(--radius-item)] border border-[var(--dark-5)] bg-[var(--dark-2)] p-5 shadow-lg transition-all hover:border-zinc-500"
              >
                <h2 className="font-heading text-base font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {guide!.frontmatter.title ?? slug.replace(/-/g, ' ')}
                </h2>
                {guide!.frontmatter.description && (
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-2">
                    {guide!.frontmatter.description}
                  </p>
                )}
                {guide!.frontmatter.lastUpdated && (
                  <div className="mt-3 text-[11px] font-mono text-zinc-500">
                    Last Updated: {guide!.frontmatter.lastUpdated}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
