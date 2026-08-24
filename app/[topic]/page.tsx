import type { Metadata } from 'next'
import { Fragment } from 'react'
import TopicHubTemplate from '../../components/templates/TopicHubTemplate'
import { getCatalog, getTopicTabs, getTopicTheme, listTopics } from '../../lib/data'
import { getPost, listPosts } from '../../lib/posts'
import { SITE_LOGO_FULL, SITE_NAME, SITE_URL } from '../../lib/site-config'


const SITE = SITE_URL
const FALLBACK_IMG = SITE_LOGO_FULL

function absoluteImg(p: string | undefined): string | undefined {
  if (!p) return undefined
  return p.startsWith('http') ? p : SITE + (p.startsWith('/') ? p : '/' + p)
}

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
  const hubUrl = SITE + '/' + topic
  const img = absoluteImg(catalog.bannerImg || catalog.icon) ?? FALLBACK_IMG
  return {
    title: catalog.name + ` Wiki & Guides | ${SITE_NAME}`,
    description: catalog.description,
    alternates: { canonical: hubUrl },
    openGraph: {
      title: catalog.name + ` Wiki & Guides | ${SITE_NAME}`,
      description: catalog.description,
      url: hubUrl,
      type: 'website',
      images: [{ url: img }],
    },
    twitter: {
      card: 'summary_large_image',
      title: catalog.name + ` Wiki & Guides | ${SITE_NAME}`,
      description: catalog.description,
      images: [img],
    },
  }
}

export default async function GameHubPage({
  params,
}: {
  params: Promise<{ topic: string }>
}) {
  const { topic } = await params
  const catalog = getCatalog(topic)
  const theme = getTopicTheme(topic)

  // 真实攻略（含首图，无则占位）
  const guides = listPosts(topic)
    .map((slug) => ({ slug, guide: getPost(topic, slug) }))
    .filter((g) => g.guide !== null)
    .map((g) => ({
      slug: g.slug,
      title: g.guide!.frontmatter.title ?? g.slug.replace(/-/g, ' '),
      description: g.guide!.frontmatter.description,
      img: (g.guide!.frontmatter as { img?: string }).img,
    }))

  // SEO 结构化数据：BreadcrumbList + ItemList（攻略 ≤20 项）
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: catalog.name, item: SITE + '/' + topic },
    ],
  }
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: guides.slice(0, 20).map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: g.title,
      url: SITE + '/' + topic + '/posts/' + g.slug,
    })),
  }

  return (
    <Fragment>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {guides.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
      <TopicHubTemplate
        topicId={topic}
        topicName={catalog.name}
        description={catalog.description}
        about={(catalog as { about?: string }).about ?? ''}
        bannerImg={catalog.bannerImg || catalog.icon || ''}
        guides={guides}
        categories={catalog.categories}
        tabs={getTopicTabs(topic)}
        accent={theme.accent}
      />
    </Fragment>
  )
}
