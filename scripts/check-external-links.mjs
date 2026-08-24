#!/usr/bin/env node
// 外链健康检测：解析 content/**/guides/*.md 的外部链接，批量请求状态码，
// 输出失效（4xx/5xx/超时/无法解析）清单，区分"真失效"与"目标站反爬（403）"。
// 用法：
//   node scripts/check-external-links.mjs                # 全站检测，输出报告到 /tmp
//   node scripts/check-external-links.mjs --pages f.txt  # 只检测 f.txt 中的页面（每行一个 URL）
//   node scripts/check-external-links.mjs --json         # 输出 JSON 报告
// 说明：403 不一定等于链接失效——wiki.gg / truesteamachievements / gamespot 等站点
// 对 SEO 爬虫 UA 返回 403 但对真实浏览器 200。脚本用浏览器 UA 检测，
// 仍 403 的标记为 "likely-botblock"（反爬），需人工判断是否替换为官方源。
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content')
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const CONCURRENCY = 8
const TIMEOUT_MS = 20000
const SKIP_HOSTS = new Set(['store.steampowered.com', 'steamcommunity.com', 'github.com', 'en.wikipedia.org']) // 本机网络/反爬高发，默认跳过（--all 强制检测）

const args = process.argv.slice(2)
const onlyJson = args.includes('--json')
const forceAll = args.includes('--all')
let pageFilter = null
const pi = args.indexOf('--pages')
if (pi !== -1 && args[pi + 1]) {
  pageFilter = new Set(fs.readFileSync(args[pi + 1], 'utf-8').split('\n').map((l) => l.trim()).filter(Boolean))
}

// ── 收集外链 ──
const links = new Map() // url -> Set(pagePath)
const games = fs.existsSync(CONTENT_DIR)
  ? fs.readdirSync(CONTENT_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : []
for (const game of games) {
  if (game.startsWith('_')) continue
  const guidesDir = path.join(CONTENT_DIR, game, 'guides')
  if (!fs.existsSync(guidesDir)) continue
  for (const f of fs.readdirSync(guidesDir)) {
    if (!/\.md$/.test(f)) continue
    const page = game + '/guides/' + f.replace(/\.md$/, '')
    if (pageFilter && ![...pageFilter].some((u) => u.includes(page))) continue
    let raw
    try {
      raw = fs.readFileSync(path.join(guidesDir, f), 'utf-8')
    } catch {
      continue
    }
    const body = raw.replace(/^---[\s\S]*?---/, '') // 去掉 frontmatter（避免抓 faq/description 里的 URL）
    const markdownLinks = [...body.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1])
    const bareLinks = [...body.matchAll(/(?<![\]("'])https?:\/\/[^\s)\]"',.]+\.[a-z]{2,}[^\s)\]"',.]*/gi)].map((m) => m[0])
    for (const u of new Set([...markdownLinks, ...bareLinks])) {
      // 规范化：去掉尾部标点
      const clean = u.replace(/[.,;:!?]+$/, '')
      if (!/^https?:\/\//.test(clean)) continue
      if (!links.has(clean)) links.set(clean, new Set())
      links.get(clean).add(page)
    }
  }
}

// ── 检测 ──
async function check(u) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const r = await fetch(u, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
    })
    clearTimeout(t)
    return { status: r.status, url: u }
  } catch (e) {
    return { status: e.name === 'AbortError' ? 'TIMEOUT' : 'ERR', url: u }
  }
}

const queue = [...links.keys()].filter((u) => forceAll || !SKIP_HOSTS.has(new URL(u).host))
const results = []
async function worker() {
  while (queue.length) {
    const u = queue.shift()
    results.push(await check(u))
  }
}
console.log('检测 ' + queue.length + ' 个外链（并发 ' + CONCURRENCY + '，跳过 SKIP_HOSTS ' + (links.size - queue.length) + ' 个）…')
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

// ── 报告 ──
const byStatus = {}
for (const r of results) {
  const key = String(r.status)
  byStatus[key] = (byStatus[key] || 0) + 1
}
const bad = results.filter((r) => r.status !== 200)
const report = {
  generatedAt: new Date().toISOString(),
  checked: results.length,
  summary: byStatus,
  bad: bad.map((r) => ({
    status: r.status,
    url: r.url,
    pages: [...(links.get(r.url) || [])],
  })),
}
const outPath = '/tmp/site-extlinks-' + Date.now() + '.json'
fs.writeFileSync(outPath, JSON.stringify(report, null, 1))
console.log('状态码汇总:', JSON.stringify(byStatus))
console.log('报告已保存: ' + outPath)
if (onlyJson) {
  console.log(JSON.stringify(report, null, 1))
} else {
  console.log('\n=== 非 200 外链（含所在页面）===')
  for (const r of report.bad) {
    const kind = r.status === 403 ? '[可能反爬]' : r.status === 'ERR' || r.status === 'TIMEOUT' ? '[网络/超时]' : '[失效]'
    console.log(kind + ' ' + r.status + ' ' + r.url)
    for (const pg of r.pages.slice(0, 3)) console.log('         └ ' + pg)
  }
}
