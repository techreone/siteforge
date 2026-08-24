import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PostArticleView from '../../../../components/PostArticleView'
import { getCatalog, getTopicTabs, listTopics } from '../../../../lib/data'
import { getPost, listPosts } from '../../../../lib/posts'
import { SITE_FALLBACK_IMAGE, detectVideoEmbed } from '../../../../lib/schema'
import { SITE_NAME, SITE_URL } from '../../../../lib/site-config'

export function generateStaticParams() {
  const params: { topic: string; slug: string }[] = []
  for (const topic of listTopics()) {
    if (topic === 'favicon.ico' || topic.startsWith('_')) continue
    for (const slug of listPosts(topic)) {
      params.push({ topic, slug })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string; slug: string }>
}): Promise<Metadata> {
  const { topic, slug } = await params
  const catalog = getCatalog(topic)
  const post = getPost(topic, slug)
  // title 规则：frontmatter.title 直接作 title（h1 一致）；长度 ≤46 时追加品牌后缀
  // （避免 >60 字符被 Google 截断；h1 保持原样不受影响）
  const baseTitle = post?.frontmatter.title
    ? post.frontmatter.title
    : `${slug.replace(/-/g, ' ')} — ${catalog.name} Guide`
  // canonical / OG 用当前页完整 URL（frontmatter.img 为相对路径，需加站点前缀）
  const pageUrl = `${SITE_URL}/${topic}/posts/${slug}`
  const featured = post?.frontmatter.img
  const ogImage = typeof featured === 'string' && featured
    ? `${SITE_URL}/${featured.replace(/^\//, '')}`
    : SITE_FALLBACK_IMAGE
  return {
    title: baseTitle.length <= 46 ? `${baseTitle} | ${SITE_NAME}` : baseTitle,
    description: post?.frontmatter.description ?? `Guide for ${slug.replace(/-/g, ' ')} in ${catalog.name}.`,
    alternates: post ? { canonical: pageUrl } : undefined,
    openGraph: post
      ? {
          title: baseTitle,
          description: post.frontmatter.description ?? `Guide for ${slug.replace(/-/g, ' ')} in ${catalog.name}.`,
          url: pageUrl,
          type: 'article',
          images: [{ url: ogImage }],
          ...(post.frontmatter.date ? { publishedTime: post.frontmatter.date } : {}),
          ...(post.frontmatter.lastUpdated
            ? (() => {
                const d = new Date(post.frontmatter.lastUpdated)
                return Number.isNaN(d.getTime()) ? {} : { modifiedTime: d.toISOString() }
              })()
            : {}),
        }
      : undefined,
    twitter: post
      ? {
          card: 'summary_large_image',
          title: baseTitle,
          description: post.frontmatter.description ?? `Guide for ${slug.replace(/-/g, ' ')} in ${catalog.name}.`,
          images: [ogImage],
        }
      : undefined,
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ topic: string; slug: string }>
}) {
  const { topic, slug } = await params
  const catalog = getCatalog(topic)
  const post = getPost(topic, slug)
  if (!post) notFound()

  // 同游戏其他攻略（Related Posts / Similar Guides 数据源）
  // 相关性排序：当前页 mainKeyword 与候选页 mainKeyword/标题的词 token 重叠越多越靠前
  // （Canva 模式：同主题环形互链，权重传递给最相关页；语义上比字母序更符合"Similar"）
  const currentKw = (post.frontmatter.mainKeyword ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const tokenize = (s: string) => new Set((s ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean))
  const related = listPosts(topic)
    .filter((s) => s !== slug)
    .map((s) => ({ slug: s, post: getPost(topic, s) }))
    .filter((r) => r.post !== null)
    .map((r) => {
      const g = r.post!
      const candKw = tokenize(g.frontmatter.mainKeyword ?? '')
      const candTitle = tokenize(g.frontmatter.title ?? '')
      const overlap = currentKw.reduce((acc, w) => acc + (candKw.has(w) ? 3 : candTitle.has(w) ? 1 : 0), 0)
      return {
        slug: r.slug,
        title: g.frontmatter.title ?? r.slug.replace(/-/g, ' '),
        summary: g.frontmatter.description ?? '',
        href: `/${topic}/posts/${r.slug}`,
        score: overlap,
      }
    })
    .sort((a, b) => b.score - a.score)

  // 当前页完整 URL + 展示图（frontmatter.img 为相对路径，需加站点前缀）
  const canonicalUrl = `${SITE_URL}/${topic}/posts/${slug}`
  const featured = post.frontmatter.img
  const imageUrl = typeof featured === 'string' && featured
    ? `${SITE_URL}/${featured.replace(/^\//, '')}`
    : undefined

  return (
    <PostArticleView
      topicId={topic}
      topicName={catalog.name}
      title={post.frontmatter.title}
      description={post.frontmatter.description}
      date={post.frontmatter.date}
      imageUrl={imageUrl}
      lastUpdated={post.frontmatter.lastUpdated}
      contentHtml={post.html}
      toc={post.toc}
      related={related}
      tabs={getTopicTabs(topic)}
      mainKeyword={post.frontmatter.mainKeyword}
      faq={post.faq}
      canonicalUrl={canonicalUrl}
      video={detectVideoEmbed(post.html)}
    />
  )
}
