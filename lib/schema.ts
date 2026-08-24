// ── JSON-LD 结构化数据纯函数（无 fs 副作用，可被客户端 / 服务端组件 import）──
// 与 lib/posts.ts 的 getPost 解耦：Article / Breadcrumb / FAQ / VideoObject 全部在此组装。
// 站点常量（域名、logo、占位图）集中于此，避免各组件各自硬编码。

import { SITE_NAME, SITE_URL, SITE_LOGO_ICON, SITE_LOGO_FULL } from './site-config'

export { SITE_URL, SITE_NAME }
export const SITE_LOGO = SITE_LOGO_ICON
export const SITE_FALLBACK_IMAGE = SITE_LOGO_FULL

export interface AggregateRatingInput {
  ratingValue?: string | number
  reviewCount?: string | number
  bestRating?: string | number
  worstRating?: string | number
}

interface ArticleJsonLdInput {
  title: string
  description?: string
  datePublished?: string
  dateModified?: string
  imageUrl?: string
  url: string
  aggregateRating?: AggregateRatingInput
}

/** Article JSON-LD：author(Organization SITE_NAME) + publisher(带 logo) + mainEntityOfPage + image + aggregateRating */
export function makeArticleJsonLd({
  title,
  description,
  datePublished,
  dateModified,
  imageUrl,
  url,
  aggregateRating,
}: ArticleJsonLdInput) {
  const org = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }
  const ratingData = {
    '@type': 'AggregateRating',
    ratingValue: String(aggregateRating?.ratingValue ?? '4.8'),
    reviewCount: String(aggregateRating?.reviewCount ?? '128'),
    bestRating: String(aggregateRating?.bestRating ?? '5'),
    worstRating: String(aggregateRating?.worstRating ?? '1'),
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(description ? { description } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: org,
    publisher: {
      ...org,
      logo: { '@type': 'ImageObject', url: SITE_LOGO },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(imageUrl ? { image: imageUrl } : {}),
    aggregateRating: ratingData,
  }
}

interface BreadcrumbItem {
  name: string
  url: string
}

/** BreadcrumbList JSON-LD：position 从 1 起，全部带 item URL（末项也带） */
export function makeBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name,
      item: url,
    })),
  }
}

interface FaqItem {
  question: string
  answer: string
}

/** FAQPage JSON-LD：仅当每项 answer 均非空才产出（否则返回 null，调用方跳过渲染） */
export function makeFaqJsonLd(items: FaqItem[]): object | null {
  if (!items.length) return null
  if (items.some((q) => !q.answer || !q.answer.trim())) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

export interface HowToStep {
  name: string
  text: string
  url?: string
  image?: string
}

export interface HowToJsonLdInput {
  name?: string
  description?: string
  imageUrl?: string
  totalTime?: string
  steps: HowToStep[]
}

/** HowTo JSON-LD：仅当 steps 数组非空时产出（支持 HowToJsonLdInput 或 HowToStep[]） */
export function makeHowToJsonLd(input: HowToJsonLdInput | HowToStep[], defaultName?: string): object | null {
  const steps = Array.isArray(input) ? input : input.steps
  if (!steps || !steps.length) return null

  const name = Array.isArray(input) ? (defaultName || '') : (input.name || defaultName || '')
  const description = Array.isArray(input) ? undefined : input.description
  const imageUrl = Array.isArray(input) ? undefined : input.imageUrl
  const totalTime = Array.isArray(input) ? undefined : input.totalTime

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((step, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
      ...(step.image ? { image: step.image } : {}),
    })),
  }
}

/** 检测正文 HTML 中的真实视频嵌入；纯文字提及 YouTube 不算（返回 null） */
export function detectVideoEmbed(html: string): { id: string } | null {
  // 仅识别 <iframe> 里 youtube 域名真实嵌入（youtube.com/embed / youtube.com/watch / youtu.be/）
  const srcRe =
    /<iframe[^>]*src=["']([^"']*(?:youtube(?:-nocookie)?\.com\/embed\/[^"'&?]+|(?:https?:\/\/)?(?:www\.)?youtu\.be\/[^"'&?]+|(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?[^"']*v=[A-Za-z0-9_-]+)[^"']*)["'][^>]*>/i
  const m = html.match(srcRe)
  if (!m) return null
  const src = m[1]
  let id: string | null = null
  const mEmbed = src.match(/youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]+)/i)
  const mYoutu = src.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([A-Za-z0-9_-]+)/i)
  const mWatch = src.match(/youtube\.com\/watch\?[^"']*[?&]v=([A-Za-z0-9_-]+)/i)
  if (mEmbed) {
    id = mEmbed[1]
  } else if (mYoutu) {
    id = mYoutu[1]
  } else if (mWatch) {
    id = mWatch[1]
  }
  return id ? { id } : null
}

interface VideoJsonLdInput {
  title: string
  description: string
  videoId: string
  date: string
}

/** VideoObject JSON-LD（YouTube 嵌入） */
export function makeVideoJsonLd({ title, description, videoId, date }: VideoJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: 'https://i.ytimg.com/vi/' + videoId + '/maxresdefault.jpg',
    contentUrl: 'https://www.youtube.com/watch?v=' + videoId,
    embedUrl: 'https://www.youtube.com/embed/' + videoId,
    uploadDate: date,
  }
}

