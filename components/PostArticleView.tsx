'use client'

import { Fragment, memo, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Link2, List } from 'lucide-react'
import TopicSubHeader, { type TopicTab } from './TopicSubHeader'
import type { TocItem } from '../lib/posts'
import {
  SITE_URL,
  makeArticleJsonLd,
  makeBreadcrumbJsonLd,
  makeFaqJsonLd,
  makeVideoJsonLd,
  makeHowToJsonLd,
  type AggregateRatingInput,
  type HowToJsonLdInput,
  type HowToStep,
} from '../lib/schema'
import AdsterraBanner from './AdsterraBanner'
import AdsterraNative from './AdsterraNative'


// ── PostArticleView：真实攻略渲染（视觉照搬雏形，内容动态化）──
// 保留：三栏布局 / sticky 居中侧栏 / 锐角卡片 / 色调字体 / Get Link / Follow Us
// 动态化：正文 contentHtml / TOC / Related / Last Updated

interface PostArticleViewProps {
  topicId?: string
  topicName?: string
  title?: string
  description?: string
  /** 发布日期（frontmatter.date 原样，如 2026-08-12） */
  date?: string
  /** 展示图绝对 URL（frontmatter.img 已绝对化；无则省略 Article.image） */
  imageUrl?: string
  lastUpdated?: string
  contentHtml?: string
  toc?: TocItem[]
  related?: { slug: string; title: string; href: string; summary?: string }[]
  tabs?: TopicTab[]
  mainKeyword?: string
  /** FAQ 问答对（服务端从 markdown 提取，生成正确 FAQPage；无则为空数组） */
  faq?: { question: string; answer: string }[]
  /** 当前页完整 URL（用于 canonical / OG / Breadcrumb 末项） */
  canonicalUrl?: string
  /** 正文真实视频嵌入检测结果（{ id } | null，父组件传入） */
  video?: { id: string } | null
  /** SERP 评级数据（自定义星级；未传则使用默认 4.8 星 / 128 评价） */
  aggregateRating?: AggregateRatingInput
  /** HowTo 教程步骤（转为 HowTo Schema） */
  howTo?: HowToJsonLdInput | HowToStep[]
}

// ── GuideContent：正文容器独立 memo 化（浏览器翻译保护）──
// 实证：dangerouslySetInnerHTML 容器在父组件每次重渲染时都会被 React 重建全部子节点
// （滚动越界/Get Link/移动端 TOC 折叠等任意 setState 触发重渲染 → 正文 69 个节点全量销毁重建）。
// Chrome 翻译的实现正是把翻译文本包成替换文本节点（<font> 等）——正文节点被重建即翻译打回原文。
// memo 化后：contentHtml 不变则正文 fiber 不重渲染、DOM 零触碰，翻译在任意交互下存活。
// ── InArticleAds：正文穿插广告（按段落切分，服务端渲染防 CLS）──
// 策略：正文每 6 段插 1 个 300x250（<p> 计数），上限 5 个；<6 段不插
// 保持 memo：contentHtml 不变则 DOM 零触碰（浏览器翻译保护，与原 GuideContent 一致）
const InArticleAds = memo(function InArticleAds({ contentHtml }: { contentHtml: string }) {
  const { parts, hasAds } = useMemo(() => {
    const BLOCK_START = /(?=<h[1-4]|<p|<ul|<ol|<table|<pre|<blockquote|<img|<div|<hr)/
    const blocks = contentHtml.split(BLOCK_START).filter((b) => b.trim().length > 0)
    const MAX_ADS = 5
    // 容器标签配对：blockquote/ul/ol/table/pre/figure/div 开闭标签
    // 切分后把「未闭合容器内的碎块」合并回上一块，保证 blockquote/callout/table 结构完整
    // （曾把 blockquote/callout 切碎成空壳 + 游离内容 → 渲染出怪异长条 + 广告插进容器，2026-08-13 实测）
    const NESTED_OPEN = /<(?:blockquote|ul|ol|table|pre|figure|div)\b/gi
    const NESTED_CLOSE = /<\/(?:blockquote|ul|ol|table|pre|figure|div)>/gi
    const count = (s: string, re: RegExp) => (s.match(re) ?? []).length

    // 1. 合并成完整顶层块：累积直到容器深度回到 0
    const merged: string[] = []
    let depth = 0
    let current = ''
    for (const b of blocks) {
      current += b
      depth += count(b, NESTED_OPEN) - count(b, NESTED_CLOSE)
      if (depth <= 0) {
        merged.push(current)
        current = ''
        depth = 0
      }
    }
    if (current.trim()) merged.push(current)

    // 2. 每 6 个内容块插广告（标题 h1-h4 与纯图片/分隔线不计段）；FAQ 之后不再插
    let pCount = 0
    let lastAdP = 0
    let adsInserted = 0
    let inFaq = false
    const out: { html: string; adAfter: boolean }[] = []
    for (const b of merged) {
      if (!inFaq && /<h[1-4][^>]*id=["']faq/i.test(b)) inFaq = true
      const isHeading = /^<h[1-4]/.test(b)
      const isFigure = /^<(img|hr)/.test(b)
      if (!inFaq && !isHeading && !isFigure) pCount++
      const targetP = pCount >= 6 ? Math.floor(pCount / 6) * 6 : 0
      const adAfter = !inFaq && targetP > lastAdP && adsInserted < MAX_ADS
      if (adAfter) {
        lastAdP = targetP
        adsInserted++
      }
      out.push({ html: b, adAfter })
    }
    return { parts: out, hasAds: adsInserted > 0 }
  }, [contentHtml])

  if (!hasAds) {
    return (
      <div
        id="guide-content"
        className="guide-prose space-y-5 text-base text-zinc-300"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    )
  }

  return (
    <div id="guide-content" className="guide-prose space-y-5 text-base text-zinc-300">
      {parts.map((part, i) => (
        <Fragment key={i}>
          <div dangerouslySetInnerHTML={{ __html: part.html }} />
          {part.adAfter && (
            <AdsterraBanner idKey="18c170d146cf3594deef4b20c1940e98" width={300} height={250} />
          )}
        </Fragment>
      ))}
    </div>
  )
})

export default function PostArticleView({
  topicId = 'poe2',
  topicName = 'Path of Exile 2',
  title = '',
  description = '',
  date,
  imageUrl,
  lastUpdated,
  contentHtml = '',
  toc = [],
  related = [],
  tabs = [],
  mainKeyword,
  faq = [],
  canonicalUrl,
  video = null,
  aggregateRating,
  howTo,
}: PostArticleViewProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)

  const isClickScrollingRef = useRef(false)
  const clickLockTimerRef = useRef<NodeJS.Timeout | null>(null)
  const navContainerRef = useRef<HTMLElement | null>(null)
  // TOC 高亮不经过 React 状态：滚动时 setState → 整组件重渲染 →
  // dangerouslySetInnerHTML 正文被重建全部子节点 → 浏览器翻译打回原文。
  // 改用 ref + classList 命令式切换高亮，滚动路径零 React 重渲染。
  const activeTocRef = useRef('')

  // TOC 高亮唯一入口：ref + classList 命令式更新（零 setState），
  // 并保持原 useEffect#2 的"高亮项自动滚入侧栏视野"逻辑（合并于此）
  const applyActiveToc = (id: string) => {
    activeTocRef.current = id
    const nav = navContainerRef.current
    if (!nav) return
    nav.querySelectorAll<HTMLElement>('a[data-toc-id]').forEach((a) => {
      a.classList.toggle('toc-active', a.dataset.tocId === id)
    })
    // 高亮项滚入侧栏视野：仅当 nav 容器自身可滚动时，用容器 scrollTo 操作（绝不滚动页面）。
    // 原实现 activeAnchor.scrollIntoView() 在移动端（nav 无高度约束、容器不可滚动时）会向上
    // 找到页面作为滚动容器 → scrollspy 每次滚动都 smooth 滚动画页面，把用户从广告/正文中段
    // 拉回 TOC 区块（第一个标题附近）——滚动监听回调里执行页面滚动 = 反馈环，已移除。
    if (nav.scrollHeight > nav.clientHeight) {
      try {
        const activeAnchor = nav.querySelector<HTMLElement>(`a[data-toc-id="${CSS.escape(id)}"]`)
        if (activeAnchor) {
          nav.scrollTo({ top: Math.max(activeAnchor.offsetTop - nav.clientHeight / 2, 0), behavior: 'smooth' })
        }
      } catch {
        // 容错处理（非法 id）
      }
    }
  }

  // 1. ScrollSpy 滚动高亮监听
  useEffect(() => {
    if (!toc.length) return
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>('#guide-content h2, #guide-content h3')
    )
    if (!headings.length) return

    const OFFSET = 120 // 锚区 offset：视口顶部下方 120px

    let rafId = 0
    const computeActive = () => {
      rafId = 0
      // 若处于点击平滑滚动锁定中，跳过 scrollspy 计算
      if (isClickScrollingRef.current) return

      // 仅选取具有有效 id 的 h2/h3 标题节点
      const headings = Array.from(
        document.querySelectorAll<HTMLElement>('#guide-content h2[id], #guide-content h3[id]')
      ).filter((h) => h.id.trim() !== '')

      if (!headings.length) return

      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      )

      const OFFSET = 120 // 锚区 offset：视口顶部下方 120px

      // 1. 从上到下寻找 top <= OFFSET 的最后一个 heading
      let current = headings[0].id
      for (let i = 0; i < headings.length; i++) {
        const top = headings[i].getBoundingClientRect().top
        if (top <= OFFSET) {
          current = headings[i].id
        } else {
          // 遇到第一个 top > OFFSET 的标题，终止循环
          break
        }
      }

      // 2. 只有在页面存在足够的可滚动高度 (> 100px)，且用户真正滑到了物理底端（距底 < 5px）时，才触发终点高亮
      const canScroll = documentHeight > windowHeight + 100
      const isAtBottom = canScroll && windowHeight + scrollY >= documentHeight - 5
      if (isAtBottom) {
        current = headings[headings.length - 1].id
      }

      if (current !== activeTocRef.current) applyActiveToc(current)
    }

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(computeActive)
    }

    // 手动滚动事件：如果用户在点击锁定期内主动拖拽/滚动，立即取消锁定
    const onUserInteract = () => {
      if (isClickScrollingRef.current) {
        isClickScrollingRef.current = false
        if (clickLockTimerRef.current) clearTimeout(clickLockTimerRef.current)
      }
    }

    // 挂载时初始计算（或 URL 含 #hash 时初始化）
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = decodeURIComponent(window.location.hash.substring(1))
      if (headings.some((h) => h.id === hashId)) {
        applyActiveToc(hashId)
      } else {
        computeActive()
      }
    } else {
      computeActive()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    window.addEventListener('wheel', onUserInteract, { passive: true })
    window.addEventListener('touchmove', onUserInteract, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('wheel', onUserInteract)
      window.removeEventListener('touchmove', onUserInteract)
      if (rafId) cancelAnimationFrame(rafId)
      if (clickLockTimerRef.current) clearTimeout(clickLockTimerRef.current)
    }
  }, [contentHtml, toc.length])

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // 3. 点击 TOC 项跳转处理
  const handleTocClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setTocOpen(false)
    applyActiveToc(id)

    // 锁定 ScrollSpy，防止平滑滚动过程中的 scroll 事件抢走高亮
    isClickScrollingRef.current = true
    if (clickLockTimerRef.current) clearTimeout(clickLockTimerRef.current)

    // 更新 URL Hash 方便分享/前进后退
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`)
    }

    const el = document.getElementById(id)
    if (el) {
      const targetTop = el.getBoundingClientRect().top + window.scrollY - 96
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' })

      // 清理之前的闪烁节点
      document.querySelectorAll('#guide-content .toc-flash').forEach((node) => {
        node.classList.remove('toc-flash')
      })

      // 延迟 120ms 待平滑滚动启动并进入视野后添加/播放闪烁高亮类
      setTimeout(() => {
        const target = document.getElementById(id)
        if (target) {
          target.classList.remove('toc-flash')
          void target.offsetWidth // 强制重排
          target.classList.add('toc-flash')
          setTimeout(() => target.classList.remove('toc-flash'), 2400)
        }
      }, 120)
    }

    // 900ms 后平滑滚动完成，解除 ScrollSpy 锁定
    clickLockTimerRef.current = setTimeout(() => {
      isClickScrollingRef.current = false
    }, 900)
  }


  // SEO 结构化数据：Article + Breadcrumb + FAQPage + VideoObject + HowTo（lib/schema 纯函数组装）
  // dateModified：lastUpdated（如 "August 12, 2026"）解析为 ISO；解析失败则 undefined
  let dateModifiedIso: string | undefined
  if (lastUpdated) {
    const parsed = new Date(lastUpdated)
    if (!Number.isNaN(parsed.getTime())) dateModifiedIso = parsed.toISOString()
  }
  const articleUrl = canonicalUrl || (topicId ? SITE_URL + '/' + topicId : SITE_URL)
  const articleJsonLd = makeArticleJsonLd({
    title: title || mainKeyword || topicName,
    description,
    datePublished: date,
    dateModified: dateModifiedIso,
    imageUrl,
    url: articleUrl,
    aggregateRating,
  })
  const breadcrumbJsonLd = makeBreadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: topicName, url: SITE_URL + '/' + topicId },
    { name: 'Guides', url: SITE_URL + '/' + topicId + '/posts' },
    { name: title || topicName, url: articleUrl },
  ])
  const faqJsonLd = makeFaqJsonLd(faq)
  const videoJsonLd =
    video && video.id
      ? makeVideoJsonLd({
          title: title || mainKeyword || topicName,
          description: description ?? '',
          videoId: video.id,
          date: dateModifiedIso ?? date ?? '',
        })
      : null
  const howToJsonLd = howTo ? makeHowToJsonLd(howTo, title || mainKeyword || topicName) : null

  return (
    <div className="min-h-screen bg-[var(--dark-1)] text-white selection:bg-zinc-800 selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      {videoJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }} />
      )}
      {howToJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      )}
      {/* Universal Sub Header Navigation */}
      <TopicSubHeader
        topicId={topicId}
        topicName={topicName}
        activeCategory="posts"
        tabs={tabs}
        sectionLabel="Guides"
        sectionHref={`/${topicId}/guides`}
        pageTitle={title || topicName}
      />

      {/* Main 3-Column Container */}
      <main className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* =========================================================================
             LEFT COLUMN (250px / 3 Cols): Table of Contents
             ========================================================================= */}
          <aside className="lg:col-span-3 lg:self-start lg:sticky lg:top-24 lg:max-h-[80vh] lg:flex lg:flex-col">
            {/* 移动端：TOC 折叠按钮 */}
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="mb-4 flex w-full items-center justify-between rounded-[var(--radius-item)] border border-[var(--dark-5)] bg-[var(--dark-2)] px-4 py-3 text-xs font-mono uppercase tracking-wider text-zinc-400 lg:hidden"
            >
              <span className="flex items-center gap-2">
                <List className="w-4 h-4" /> Table of Contents
              </span>
              <span>{tocOpen ? '−' : '+'}</span>
            </button>

            {/* TOC CARD（锐角方形，sticky 居中跟随滚动） */}
            <div className={`flex flex-col rounded-[var(--radius-item)] border border-[var(--dark-5)] bg-[var(--dark-2)] p-5 shadow-lg lg:flex-1 lg:min-h-0 ${tocOpen ? 'flex' : 'hidden lg:flex'}`}>
              <div className="shrink-0 text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold border-b border-[var(--dark-5)] pb-2 font-heading">
                TABLE OF CONTENTS
              </div>

              {toc.length > 0 ? (
                <nav ref={navContainerRef} className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto text-xs">
                  {toc.map((item) => {
                    // 按 level 明确区分缩进与字重；高亮类 .toc-active 由 applyActiveToc
                    // 命令式 classList 切换（不进 React 渲染，避免重渲染重建正文 DOM）
                    const levelClass =
                      item.level === 3
                        ? 'pl-6 text-[11.5px]'
                        : item.level >= 4
                        ? 'pl-9 text-[11px]'
                        : 'pl-3 text-xs font-medium'

                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        data-toc-id={item.id}
                        onClick={(e) => handleTocClick(e, item.id)}
                        className={`block rounded-[var(--radius-item)] py-1.5 pr-2 transition-all leading-snug border-l-2 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60 ${levelClass}`}
                      >
                        <span className="flex items-center gap-1.5">
                          {item.level === 3 && (
                            <span className="shrink-0 text-zinc-600 text-[10px] font-mono select-none">├</span>
                          )}
                          {item.level >= 4 && (
                            <span className="shrink-0 text-zinc-600 text-[10px] font-mono select-none">└</span>
                          )}
                          <span className="line-clamp-2">{item.label}</span>
                        </span>
                      </a>
                    )
                  })}
                </nav>
              ) : (
                <p className="text-xs text-zinc-500">No sections in this guide yet.</p>
              )}
            </div>
          </aside>

          {/* =========================================================================
             CENTER COLUMN (630px / 6 Cols): Main Guide Article Content
             ========================================================================= */}
          <article className="lg:col-span-6 space-y-6">
            {/* Article Main Title
                H1 唯一性：正文含一级标题（攻略页）时模板出 div（H1 由正文 # 承担）；
                正文无一级标题（数据页）时模板出 h1。 */}
            {contentHtml?.match(/<h1[\s>]/) ? (
              <div className="text-3xl font-bold tracking-tight text-white sm:text-4xl leading-tight">
                {title}
              </div>
            ) : (
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl leading-tight">
                {title}
              </h1>
            )}

            {/* Description + Last Updated */}
            <div className="space-y-0.5 text-zinc-400">
              {description && <p className="text-sm leading-relaxed">{description}</p>}
              {lastUpdated && (
                <div className="text-[11px] text-zinc-500 font-mono">
                  Last Updated: {lastUpdated}
                </div>
              )}
            </div>

            {/* Get Link Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--dark-5)] pb-4 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-[var(--radius-item)] border border-[var(--dark-5)] bg-[var(--dark-3)] px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Get Link'}</span>
                </button>
              </div>
            </div>

            {/* Guide Content (MDX → HTML) —— memo 化：父级重渲染不重建正文 DOM（保护浏览器翻译） */}
            <InArticleAds contentHtml={contentHtml} />

            {/* Adsterra In-Article Banner 300x250 (ID: 30727127) */}
            <AdsterraBanner idKey="18c170d146cf3594deef4b20c1940e98" width={300} height={250} />

            {/* Adsterra Native Banner (ID: 30727123) */}
            <AdsterraNative />

            {/* Similar Guides 卡片（Canva 模式：同游戏环形互链，正文底部内链密度提升） */}
            {related.length > 6 && (
              <section aria-label="More posts" className="border-t border-[var(--dark-5)] pt-6">
                <h2 className="font-heading text-base font-semibold text-white">
                  More {topicName} Guides
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {related.slice(6, 14).map((post) => (
                    <Link
                      key={post.slug}
                      href={post.href}
                      className="group rounded-lg border border-[var(--dark-5)] bg-[var(--dark-2)] p-4 transition-colors hover:border-zinc-600"
                    >
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {post.title}
                      </div>
                      {post.summary && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                          {post.summary}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* =========================================================================
             RIGHT COLUMN (300px / 3 Cols): Related Posts + Socials
             ========================================================================= */}
          <aside className="lg:col-span-3 space-y-5 lg:self-start lg:sticky lg:top-24 lg:max-h-[80vh] lg:overflow-y-auto">
            {/* RELATED POSTS CARD（始终渲染，空时占位——后续有攻略可链） */}
            <div className="rounded-[var(--radius-item)] border border-[var(--dark-5)] bg-[var(--dark-2)] p-5 space-y-4 shadow-lg">
              <div className="shrink-0 text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold border-b border-[var(--dark-5)] pb-2 font-heading">
                RELATED POSTS
              </div>

              {related.length > 0 ? (
                <div className="space-y-3">
                  {related.slice(0, 6).map((post) => (
                    <Link
                      key={post.slug}
                      href={post.href}
                      className="group flex items-center gap-3 rounded-[var(--radius-item)] border border-[var(--dark-5)] bg-[var(--dark-3)] p-2 transition-all hover:border-zinc-500"
                    >
                      <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors line-clamp-2 leading-tight">
                        {post.title}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 leading-relaxed">
                  More {topicName} posts are on the way. Check back soon.
                </p>
              )}
            </div>

          </aside>
        </div>
      </main>
    </div>
  )
}
