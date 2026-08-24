'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SITE_NAME, SITE_LOGO_ICON as BRAND_ICON, SITE_LOGO_TEXT as BRAND_LOGO_TEXT } from '../lib/site-config'

export interface SidebarNavItem {
  slug: string
  title: string
  img: string
  href: string
}
export interface SidebarNavGroup {
  label: string
  items: SidebarNavItem[]
}

// 单游戏攻略导航：折叠=分组图标，展开=缩略图+标题
export default function LeftSidebar({ groups = [] }: { groups?: SidebarNavGroup[] }) {
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
        <Link href="/" className="flex items-center group" title={SITE_NAME}>
          <span className="sr-only">{SITE_NAME} Home</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_ICON}
            alt={SITE_NAME + " Logo"}
            className="w-9 h-9 object-contain flex-shrink-0 transition-transform group-hover:scale-105"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO_TEXT}
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

      {/* 攻略分组导航 */}
      <nav className="guide-nav flex-1 overflow-y-auto py-2 w-full" aria-label="Guides navigation">
        {groups.map((group) => (
          <div key={group.label} className="guide-nav-group mb-2">
            <ul>
              {group.items.map((item) => (
                <li key={item.slug} className="w-full">
                  <Link
                    href={item.href}
                    className="game-nav-row group"
                    title={item.title}
                  >
                    <div className="game-icon-item flex-shrink-0">
                      {item.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.img}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-zinc-900 text-[11px] font-bold text-zinc-600">
                          {item.title.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="font-sans text-[13px] font-medium text-[#808191] group-hover:text-white transition-colors sidebar-label leading-snug line-clamp-2 flex-1 min-w-0">
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
