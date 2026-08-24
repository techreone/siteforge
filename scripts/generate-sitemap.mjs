#!/usr/bin/env node
// 生成 sitemap.xml + llms.txt（与路由逻辑一致：data/ 目录 = 游戏，content/{topic}/posts = 攻略）
// 用法：node scripts/generate-sitemap.mjs（build 前跑，package.json prebuild 已挂）
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
// BASE 从 lib/site-config.ts 读取（唯一配置源），缺失 PLACEHOLDER 时报错拦截
const cfg = fs.readFileSync(path.join(ROOT, 'lib', 'site-config.ts'), 'utf-8')
const BASE = (cfg.match(/SITE_URL = '(https?:\/\/[^']+)'/) || [])[1]
const SITE_NAME = (cfg.match(/SITE_NAME = '([^']+)'/) || [])[1] || BASE
if (!BASE || BASE.includes('PLACEHOLDER')) {
  console.error('❌ lib/site-config.ts 的 SITE_URL 仍是占位符——先完成品牌配置再构建')
  process.exit(1)
}
const DATA_DIR = path.join(ROOT, 'data')
const CONTENT_DIR = path.join(ROOT, 'content')

// ── 收集 URL 列表 ──
const urls = []
const add = (loc, lastmod = '', freq = 'weekly', pri = '0.7') =>
  urls.push({ loc, lastmod, freq, pri })

// 游戏 + 攻略（目录列表）
const topics = fs.existsSync(DATA_DIR)
  ? fs.readdirSync(DATA_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
  : []

// ── 收集全部攻略的 lastUpdated（供首页/索引页 lastmod 使用，避免恒为"今天"）──
const allPostDates = [] // { topic, date }
for (const topic of topics) {
  const postsDir = path.join(CONTENT_DIR, topic, 'posts')
  if (!fs.existsSync(postsDir)) continue
  for (const f of fs.readdirSync(postsDir)) {
    if (!/.(md|mdx)$/.test(f)) continue
    try {
      const raw = fs.readFileSync(path.join(postsDir, f), 'utf-8')
      const m = raw.match(/^lastUpdated:\s*"?([^"\n]+)"?/m)
      if (!m) continue
      const d = new Date(m[1])
      if (isNaN(d)) continue
      allPostDates.push({ topic, date: d.toISOString().slice(0, 10) })
    } catch { /* 跳过 */ }
  }
}
const newestDate = (list) => (list.length ? list.map((x) => x.date).sort().at(-1) : '')
const topicNewest = (topic) => newestDate(allPostDates.filter((x) => x.topic === topic))

// 首页 lastmod = 全站最新攻略日期（无则留空，避免恒为"今天"）
add(`${BASE}/`, newestDate(allPostDates), 'daily', '1.0')

// 静态页：仅收录真实内容页（about + 法律页）；占位骨架页已删除（2026-08-13 审计修复）
for (const slug of ['about', 'privacy', 'tos']) {
  add(`${BASE}/${slug}`, '', 'monthly', '0.3')
}

for (const topic of topics) {
  if (topic.startsWith('_')) continue
  const postsDir = path.join(CONTENT_DIR, topic, 'posts')
  const hasGuides = fs.existsSync(postsDir)
  if (!hasGuides) continue // 只收录有 content 的游戏

  add(`${BASE}/${topic}`, topicNewest(topic), 'daily', '0.9')
  add(`${BASE}/${topic}/posts`, topicNewest(topic), 'daily', '0.8')

  const slugs = fs.readdirSync(postsDir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => f.replace(/\.(md|mdx)$/, ''))
    .sort()
  for (const slug of slugs) {
    // 从 frontmatter 取 lastUpdated（无则 lastmod 留空，不写当天日期）
    let lastmod = ''
    try {
      const raw = fs.readFileSync(path.join(postsDir, `${slug}.md`), 'utf-8')
      const m = raw.match(/^lastUpdated:\s*"?([^"\n]+)"?/m)
      if (m) {
        const d = new Date(m[1])
        if (!isNaN(d)) lastmod = d.toISOString().slice(0, 10)
      }
    } catch { /* mdx 或读取失败则留空 */ }
    add(`${BASE}/${topic}/posts/${slug}`, lastmod, 'weekly', '0.8')
  }
}

// ── 写 sitemap.xml ──
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), sitemap)
console.log(`✅ sitemap.xml（${urls.length} 个 URL）→ public/sitemap.xml`)

// ── 写 llms.txt（AI 搜索入口）──
const llms = []
llms.push('# ' + SITE_NAME)
llms.push('')
llms.push('> ' + ((cfg.match(/SITE_TAGLINE = '([^']+)'/) || [])[1] || SITE_NAME))
llms.push('')
llms.push('Last updated: ' + new Date().toISOString().slice(0, 10))
llms.push('')
llms.push('## Channels')
llms.push('')
for (const topic of topics) {
  if (topic.startsWith('_')) continue
  const postsDir = path.join(CONTENT_DIR, topic, 'posts')
  if (!fs.existsSync(postsDir)) continue
  llms.push(`### ${topic.replace(/-/g, ' ')}`)
  llms.push(`- [${topic} hub](${BASE}/${topic})`)
  llms.push(`- [${topic} guides index](${BASE}/${topic}/posts)`)
  const slugs = fs.readdirSync(postsDir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx?$/, ''))
    .sort()
  for (const slug of slugs) {
    llms.push(`  - [${slug.replace(/-/g, ' ')}](${BASE}/${topic}/posts/${slug})`)
  }
  llms.push('')
}
fs.writeFileSync(path.join(ROOT, 'public', 'llms.txt'), llms.join('\n'))
console.log(`✅ llms.txt（${topics.filter((g) => !g.startsWith('_') && fs.existsSync(path.join(CONTENT_DIR, g, 'posts'))).length} 游戏）→ public/llms.txt`)

// ── 写 feed.xml（RSS 2.0）──
const siteName = (cfg.match(/SITE_NAME = '([^']+)'/) || [])[1] || BASE
const items = urls
  .filter((u) => /\/posts\//.test(u.loc))
  .slice(0, 50)
  .map((u) => `    <item>
      <title>${u.loc.split('/').slice(-2, -1)[0]?.replace(/-/g, ' ') || u.loc}</title>
      <link>${u.loc}</link>
      <guid>${u.loc}</guid>${u.lastmod ? `\n      <pubDate>${new Date(u.lastmod).toUTCString()}</pubDate>` : ''}
    </item>`)
  .join('\n')
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteName}</title>
    <link>${BASE}/</link>
    <description>${(cfg.match(/SITE_TAGLINE = '([^']+)'/) || [])[1] || ''}</description>
${items}
  </channel>
</rss>
`
fs.writeFileSync(path.join(ROOT, 'public', 'feed.xml'), rss)
console.log(`✅ feed.xml（${items ? urls.filter((u) => /\/posts\//.test(u.loc)).length : 0} 条）→ public/feed.xml`)
