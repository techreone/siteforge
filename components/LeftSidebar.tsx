'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SITE_NAME } from '../lib/site-config'


// 游戏列表由 layout 传入（data/ 目录驱动），无则空
interface SidebarGame {
  id: string
  title: string
  img: string
}

export default function LeftSidebar({ topics = [] }: { topics?: SidebarGame[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = () => {
    const nextState = !isExpanded
    setIsExpanded(nextState)
    if (typeof document !== 'undefined') {
      if (nextState) {
        document.documentElement.classList.add('sidebar-expanded')
      } else {
        document.documentElement.classList.remove('sidebar-expanded')
      }
    }
  }

  return (
    <aside className={`left-sidebar ${isExpanded ? 'is-expanded' : ''}`}>
      {/* Brand shield logo */}
      <div className="brand-logo-container">
        <Link href="/" className="flex items-center group" title="{SITE_NAME} Home">
          <span className="sr-only">{SITE_NAME} Home</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/site/icon-256.webp"
            alt={SITE_NAME + " Logo"}
            className="w-9 h-9 object-contain flex-shrink-0 transition-transform group-hover:scale-105"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/site/logo-text.webp"
            alt={SITE_NAME + " Logo"}
            className="ml-3 h-5 w-auto object-contain sidebar-label opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </Link>
      </div>

      {/* Sidebar Collapse / Expand Toggle Button */}
      <button
        onClick={toggleExpand}
        className="collapse-btn"
        aria-label={isExpanded ? 'Collapse Navigation' : 'Expand Navigation'}
        title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 fill-current text-zinc-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>

      {/* Topic Icon Shortcuts */}
      <ul className="topic-nav-list">
        <li key="home" className="w-full">
          <Link
            href="/"
            className="topic-nav-row group"
            title="All Games Hub"
          >
            <div
              className="topic-icon-item flex-shrink-0 border-zinc-700 bg-zinc-900"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            </div>
            <span className="font-sans text-sm font-medium text-white sidebar-label truncate">
              All Games Hub
            </span>
          </Link>
        </li>
        {topics.map((topic) => (
          <li key={topic.id} className="w-full">
            <Link
              href={`/${topic.id}`}
              className="topic-nav-row group"
              title={topic.title}
            >
              <div className="topic-icon-item flex-shrink-0">
                {topic.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={topic.img}
                    alt={topic.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-zinc-900 text-[11px] font-bold text-zinc-600">
                    {topic.title.charAt(0)}
                  </span>
                )}
              </div>
              <span className="font-sans text-sm font-semibold text-[#808191] group-hover:text-white transition-colors sidebar-label truncate">
                {topic.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
