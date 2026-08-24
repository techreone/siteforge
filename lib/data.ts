import fs from 'node:fs'
import path from 'node:path'
import type { DbEntry, TopicCatalog, TopicTheme } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')

/** 所有已存在的游戏 slug（目录名） */
export function listTopics(): string[] {
  return fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

export function getCatalog(topic: string): TopicCatalog {
  const filePath = path.join(DATA_DIR, topic, 'catalog.json')
  if (!fs.existsSync(filePath)) {
    return {
      slug: topic,
      name: topic.toUpperCase().replace(/[-_]/g, ' '),
      description: `Comprehensive build guides, items, and mechanics for ${topic}.`,
      categories: [
        { slug: 'posts', name: 'Guides', description: 'Comprehensive guides — builds, mechanics, and walkthroughs' },
        { slug: 'builds', name: 'Builds & Tier List', description: 'Endgame build guides and tier ranking' },
        { slug: 'items', name: 'Item Database', description: 'Unique items, weapons, and affixes' },
        { slug: 'mechanics', name: 'Mechanics & Tools', description: 'Calculators and topic mechanics' },
      ],
    }
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as TopicCatalog
}

/** 读取 data/{topic}/theme.config.ts（主题配置；文件缺失或解析失败时返回默认）
 * 注：Node 运行时 require 不支持 .ts，故用 fs 读取 + 正则提取（theme.config.ts 为纯 JSON 对象格式） */
export function getTopicTheme(topic: string): TopicTheme {
  const filePath = path.join(DATA_DIR, topic, 'theme.config.ts')
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const slug = raw.match(/slug['"]?\s*[:=]\s*['"]([^'"]+)['"]/)?.[1]
      const accent = raw.match(/accent['"]?\s*[:=]\s*['"]([^'"]+)['"]/)?.[1]
      if (slug && accent) {
        return { slug, accent }
      }
    } catch {
      // fall through to default
    }
  }
  return { slug: topic, accent: '#e2b93f' }
}

export function getDb(topic: string): DbEntry[] {
  const filePath = path.join(DATA_DIR, topic, 'db.json')
  if (!fs.existsSync(filePath)) return []
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as DbEntry[]
}

export function getEntries(topic: string, category: string): DbEntry[] {
  const catalog = getCatalog(topic)
  const categoryExists = catalog.categories.some((c) => c.slug === category)
  if (!categoryExists) return []
  return getDb(topic)
}

export function getEntry(topic: string, category: string, slug: string): DbEntry | undefined {
  return getEntries(topic, category).find((e) => e.slug === slug)
}

/** 子导航 tabs：overview + 有内容的分类（空页面不显示入口） */
import { listPosts } from './posts'
export function getTopicTabs(topic: string) {
  const catalog = getCatalog(topic)
  const tabs: { slug: string; label: string; href: string }[] = []
  for (const c of catalog.categories) {
    if (c.slug === 'posts') {
      if (listPosts(topic).length > 0) tabs.push({ slug: 'posts', label: c.name, href: `/${topic}/guides` })
    } else if (getDb(topic).length > 0) {
      tabs.push({ slug: c.slug, label: c.name, href: `/${topic}/db/${c.slug}` })
    }
  }
  return tabs
}
