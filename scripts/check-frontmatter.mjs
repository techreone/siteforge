#!/usr/bin/env node
// frontmatter 门禁：content/{topic}/posts/*.md 必备字段校验（draft 文章仅警告）
// 必备：title（非空）、mainKeyword、description（≤160）、lastUpdated
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT = path.join(ROOT, 'content')
let errors = [], warns = []

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { walk(path.join(dir, e.name)); continue }
    if (!/\.(md|mdx)$/.test(e.name)) continue
    const f = path.join(dir, e.name)
    const raw = fs.readFileSync(f, 'utf8')
    const m = raw.match(/^---\n([\s\S]*?)\n---/)
    if (!m) { errors.push(`${f}: 缺 frontmatter`); continue }
    const fm = m[1]
    const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, 'm')) || [])[1]
    const draft = /^\s*draft:\s*true/m.test(fm)
    const rel = path.relative(ROOT, f)
    if (!get('title')) errors.push(`${rel}: 缺 title`)
    if (!get('mainKeyword')) (draft ? warns : errors).push(`${rel}: 缺 mainKeyword`)
    const desc = get('description')
    if (!desc) (draft ? warns : errors).push(`${rel}: 缺 description`)
    else if (desc.length > 160) errors.push(`${rel}: description ${desc.length} > 160`)
    if (!get('lastUpdated') && !get('date')) warns.push(`${rel}: 无 lastUpdated/date（sitemap lastmod 将留空）`)
  }
}

if (fs.existsSync(CONTENT)) walk(CONTENT)
if (warns.length) console.log('⚠️ ' + warns.join('\n⚠️ '))
if (errors.length) { console.error('❌ ' + errors.join('\n❌ ')); process.exit(1) }
console.log('✅ frontmatter 校验通过')
