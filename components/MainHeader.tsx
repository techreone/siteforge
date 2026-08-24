'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITE_NAME } from '../lib/site-config'


interface HeaderGame {
  id: string
  title: string
  img?: string
}

interface SearchResult {
  url: string
  meta?: { title?: string }
}

export default function MainHeader({ topics = [] }: { topics?: HeaderGame[] }) {
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  // 当前频道：路径第一段命中真实游戏 → 显示其图标+名
  const seg = pathname?.split('/')[1] ?? ''
  const currentGame = topics.find((g) => g.id === seg)

  // 关闭点击外部（搜索结果）
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setResults([])
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // pagefind 搜索（生产 build 后有效；dev 无索引时优雅降级）
  const runSearch = async (q: string) => {
    const text = q.trim()
    if (!text) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      // pagefind.js 是 ESM，浏览器运行时原生 import（import.meta 自动定位 wasm/索引）。
      // webpackIgnore: true —— 跳过构建期静态解析（/_pagefind 在 out/，构建期不存在会 TypeError）
      const pfUrl = '/_pagefind/pagefind.js'
      const pagefind: any = await import(/* webpackIgnore: true */ pfUrl)
      const res = await pagefind.search(text)
      // pagefind v1.x 的 search() 结果只有 { id, score, words, data }——
      // url/meta 必须通过 await result.data() 获取（data() 返回含 url/meta 的 fragment）。
      // 直接读 r.url 是 undefined，render 里 r.url.replace 会 TypeError 崩掉整页。
      const items: SearchResult[] = []
      for (const r of (res?.results ?? []).slice(0, 6)) {
        const d = await r.data()
        items.push({
          url: d.url ?? '',
          meta: { title: d.meta?.title ?? d.url ?? '' },
        })
      }
      setResults(items)
      setSearchError(false)
    } catch {
      setSearchError(true)
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const onQueryChange = (value: string) => {
    setQuery(value)
    runSearch(value)
  }

  return (
    <header ref={rootRef} className="main-header">
      <div className="main-header-inner">
        <div className="header-left">
          {/* 当前频道（图标+名，链接到 hub）；非频道页显示 站点品牌 */}
          {currentGame ? (
            <Link
              href={`/${currentGame.id}`}
              className="browse-topics group"
            >
              {currentGame.img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentGame.img}
                  alt={currentGame.title}
                  className="h-5 w-5 flex-shrink-0 rounded-[var(--radius-item)] object-cover"
                />
              )}
              <span className="font-sans font-semibold text-[15px] text-[#808191] group-hover:text-white transition-colors">
                {currentGame.title}
              </span>
            </Link>
          ) : (
            <Link href="/" className="browse-topics group flex items-center">
              <span className="sr-only">{SITE_NAME} Home</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/site/logo-text.webp"
                alt={SITE_NAME}
                className="h-5 w-auto object-contain opacity-85 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          )}

          <div className="v-divider"></div>

          {/* Search Bar（pagefind 站内搜索） */}
          <div className="relative flex-1 min-w-0">
            <div className="search-box w-full">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#808191] flex-shrink-0">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder={`Search ${SITE_NAME}`}
                aria-label={`Search ${SITE_NAME}`}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="font-sans text-[15px]"
              />
            </div>

            {(results.length > 0 || searching || searchError) && (
              <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[280px] rounded-[var(--radius-item)] border border-[var(--dark-5)] bg-[var(--dark-2)] p-2 shadow-2xl">
                {searching && <div className="px-3 py-2 text-xs text-zinc-500">Searching…</div>}
                {!searching && searchError && (
                  <div className="px-3 py-2 text-xs text-zinc-500">
                    Search index not ready — run <code className="text-zinc-400">npm run build</code> first.
                  </div>
                )}
                {!searching && !searchError && results.length === 0 && query.trim() && (
                  <div className="px-3 py-2 text-xs text-zinc-500">No results.</div>
                )}
                {results.map((r) => (
                  <Link
                    key={r.url || r.meta?.title || 'result'}
                    href={(r.url ?? '').replace(/\.html$/, '')}
                    onClick={() => setResults([])}
                    className="block rounded-[var(--radius-item)] px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    {r.meta?.title || r.url || '(untitled)'}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation Links */}
        <div className="header-right hidden md:flex">
          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="header-action font-sans text-sm font-semibold text-[#808191] hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="header-action font-sans text-sm font-semibold text-[#808191] hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/tos"
              className="header-action font-sans text-sm font-semibold text-[#808191] hover:text-white transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
