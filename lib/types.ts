// ── 通用内容站数据契约（DATA-CONTRACT.md 的唯一实现，改契约三处同步：types + 文档 + 生成器）──

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** db.json：单个数据条目（物品/装备/实体） */
export interface DbEntry {
  /** 数据源内部标识（解包 id 映射预留） */
  id?: string
  name: string
  /** 可选：不同游戏稀有度体系不同（以撒无稀有度） */
  rarity?: Rarity
  slug: string
  type?: string
  desc: string
  /** 键值对字段（详情页语义区块卡片呈现） */
  fields?: Record<string, string | number>
}

/** catalog.json：频道目录（每游戏一个 data/[topic]/） */
export interface TopicCategory {
  slug: string
  name: string
  description?: string
}

export interface TopicCatalog {
  slug: string
  name: string
  description: string
  categories: TopicCategory[]
  /** 游戏区顶图（hub banner，优先 bannerImg → icon → 空） */
  bannerImg?: string
  /** 游戏图标（侧边栏/顶栏） */
  icon?: string
}

/** TopicTheme：data/{topic}/theme.config.ts 契约（频道主题配置，视觉差异化不写死全局） */
export interface TopicTheme {
  slug: string
  accent: string
  rarity?: Record<string, string>
}
/** theme.config.ts：频道主题配置（视觉差异化，不写死全局） */
export interface TopicTheme {
  /** 品牌/主题色（CSS 变量驱动） */
  primary?: string
  /** 稀有度 → 色值映射（各频道不同） */
  rarityColors?: Partial<Record<Rarity, string>>
  /** 游戏内导航（顶栏/子导航项） */
  nav?: { label: string; href: string }[]
  /** sitemap 分级：哪些路径优先 */
  sitemapTiers?: Record<string, number>
  /** 广告 key（空置 = 不接） */
  adKey?: string
}
