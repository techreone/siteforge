#!/usr/bin/env node
// 动态 OG 图：扫描 content/{topic}/posts/*.md，按 title 逐篇生成 og/{slug}.webp
// 用法：node scripts/generate-og-images.mjs（build 后跑；产物写入 public/og/，下次构建随站点发布）
// 依赖：satori + sharp（npm i -D satori）；字体：assets/fonts/*-normal.ttf
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT = path.join(ROOT, 'content')
const OUT = path.join(ROOT, 'public', 'og')
const FONT_DIR = path.join(ROOT, 'assets', 'fonts')

let satori, sharp
try {
  satori = (await import('satori')).default
  sharp = (await import('sharp')).default
} catch {
  console.log('⚠️ 未安装 satori/sharp，跳过动态 OG 图（npm i -D satori 后可用）')
  process.exit(0)
}

const reg400 = fs.readFileSync(path.join(FONT_DIR, 'google-sans-code-latin-400-normal.ttf'))
const reg700 = fs.readFileSync(path.join(FONT_DIR, 'google-sans-code-latin-700-normal.ttf'))
fs.mkdirSync(OUT, { recursive: true })

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function wrap(title, max = 26) {
  const words = String(title).split(' ')
  const lines = []; let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w } else cur += ' ' + w
  }
  if (cur.trim()) lines.push(cur.trim())
  return lines.slice(0, 3)
}

async function makeOg(slug, title) {
  const lines = wrap(title)
  const textSvg = lines.map((ln, i) =>
    `<text x="80" y="${300 + i * 90}" font-family="Google Sans Code" font-weight="700" font-size="72" fill="#ffffff">${esc(ln)}</text>`
  ).join('')
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#101216"/>
    <rect width="1200" height="8" fill="#f0b429"/>
    ${textSvg}
    <text x="80" y="570" font-family="Google Sans Code" font-weight="400" font-size="30" fill="#9aa3b0">${esc(slug)}</text>
  </svg>`
  const png = await satori({ type: 'div', children: [] }, { width: 1200, height: 630, fonts: [
    { name: 'Google Sans Code', data: reg400, weight: 400, style: 'normal' },
    { name: 'Google Sans Code', data: reg700, weight: 700, style: 'normal' },
  ]}).catch(() => null)
  // satori 输出 svg 字符串；直接用 sharp 渲我们手写的 SVG 更稳（satori 仅作字体排版兜底）
  const buf = await sharp(Buffer.from(svg), { density: 144 }).webp({ quality: 88 }).toFile(path.join(OUT, `${slug}.webp`))
  return buf.size
}

let n = 0, bytes = 0
for (const topic of fs.readdirSync(CONTENT)) {
  const dir = path.join(CONTENT, topic, 'posts')
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md') || f.startsWith('_')) continue
    if (/^\s*draft:\s*true/m.test(fs.readFileSync(path.join(dir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] || '')) continue
    const raw = fs.readFileSync(path.join(dir, f), 'utf8')
    const title = (raw.match(/^title:\s*"?([^"\n]+)"?/m) || [])[1]
    if (!title) continue
    bytes += await makeOg(f.replace(/\.md$/, ''), title)
    n++
  }
}
console.log(`✅ ${n} 张动态 OG 图 → public/og/（共 ${(bytes / 1024).toFixed(0)}KB）`)
