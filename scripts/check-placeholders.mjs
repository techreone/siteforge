#!/usr/bin/env node
// 占位符门禁：扫描构建产物 out/ 与配置，任何 PLACEHOLDER 残留 = 非零退出
// 用法：node scripts/check-placeholders.mjs（build 之后跑；建议挂在 CI 或上线 checklist）
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'out')
const patterns = [/PLACEHOLDER_/i, /roguewiki/i, /example\.com/i]
const skipDirs = new Set(['_pagefind'])
let hits = []

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!skipDirs.has(e.name)) walk(path.join(dir, e.name))
      continue
    }
    if (!/\.(html|txt|xml|json)$/.test(e.name)) continue
    const f = path.join(dir, e.name)
    const text = fs.readFileSync(f, 'utf8')
    for (const rx of patterns) {
      const m = text.match(rx)
      if (m) hits.push(`${path.relative(ROOT, f)} → ${m[0]}`)
    }
  }
}

// 配置文件检查（无论是否已 build）
const cfg = fs.readFileSync(path.join(ROOT, 'lib', 'site-config.ts'), 'utf8')
for (const rx of patterns) {
  const m = cfg.match(rx)
  if (m) hits.push(`lib/site-config.ts → ${m[0]}`)
}
if (/PLACEHOLDER/i.test(fs.readFileSync(path.join(ROOT, 'scripts', 'indexnow-key.txt'), 'utf8'))) {
  hits.push('scripts/indexnow-key.txt → PLACEHOLDER key')
}

if (fs.existsSync(OUT)) walk(OUT)
else console.log('⚠️ out/ 不存在（先 npm run build 再跑本检查）——本次仅检查了配置文件')

if (hits.length) {
  console.error(`\n❌ 发现 ${hits.length} 处占位符残留，禁止上线：\n` + hits.slice(0, 40).map((h) => '  - ' + h).join('\n'))
  process.exit(1)
} else {
  console.log('✅ 占位符扫描通过：无残留')
}
