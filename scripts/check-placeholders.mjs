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

// ── theme.config.ts 个性化检查（警告模式：提示+参考案例，不阻塞）──
const REF_EXAMPLE = `参考案例（how-to-fish 站海洋主题）:
  brandName:    'How to Fish Guide'
  brandTagline: 'Guides, boss strategies, fish locations and money tips for How to Fish'
  colorBg:      '#0f172a'   // 海洋板岩蓝
  colorSurface: '#162638'
  accent:       '#38bdf8'   // 天蓝
  accent2:      '#fbbf24'   // 沙滩金
  radiusCard:   '1rem'
完整文件: theme.config.ts ｜ 文档: PERSONALIZE.md`
function checkTheme() {
  const tp = path.join(ROOT, 'theme.config.ts')
  if (!fs.existsSync(tp)) { console.log('⚠️  theme.config.ts 不存在（个性化入口缺失）'); return }
  const t = fs.readFileSync(tp, 'utf8')
  const unfilled = [...t.matchAll(/(\w+):\s*'(__[^']*)'/g)]
  if (unfilled.length === 0) { console.log('✅ theme.config 个性化完成'); return }
  console.log(`\n⚠️  个性化提示：theme.config.ts 有 ${unfilled.length} 个占位符未修改（不阻塞构建，但强烈建议个性化）:`)
  for (const [, k, v] of unfilled) console.log(`   ${k} = ${v}`)
  console.log('\n' + REF_EXAMPLE + '\n')
}
checkTheme()

// ── 门禁分层 ──
// 硬门禁（exit 1）：仅当 out/ 存在（站点已构建、具备上线意图）时扫产物残留
// 软提示（exit 0）：出厂配置占位 / theme.config 未个性化 → ⚠️ 警告 + 参考案例
// 依据用户指令（2026-08-24 原话见 PERSONALIZE.md「门禁分层」节）
const hasBuild = fs.existsSync(OUT)

// 配置检查：出厂占位 = 软提示（母模板出厂态必须可通过）；产物残留 = 硬门禁
const cfg = fs.readFileSync(path.join(ROOT, 'lib', 'site-config.ts'), 'utf8')
const configWarn = []
for (const rx of patterns) {
  const m = cfg.match(rx)
  if (m) configWarn.push(`lib/site-config.ts → ${m[0]}（出厂占位，建站时替换）`)
}
if (/PLACEHOLDER/i.test(fs.readFileSync(path.join(ROOT, 'scripts', 'indexnow-key.txt'), 'utf8'))) {
  configWarn.push('scripts/indexnow-key.txt → PLACEHOLDER key（建站时生成）')
}

if (hasBuild) {
  walk(OUT)
  if (hits.length) {
    console.error(`\n❌ 发现 ${hits.length} 处占位符残留，禁止上线：\n` + hits.slice(0, 40).map((h) => '  - ' + h).join('\n'))
    process.exit(1)
  }
  console.log('✅ 产物占位符扫描通过（硬门禁）')
} else {
  console.log('ℹ️  out/ 不存在（母模板出厂态）——跳过产物硬扫，仅提示配置个性化')
}
if (configWarn.length) {
  console.log('\n⚠️  配置个性化提示（不阻塞）:')
  console.log(configWarn.map((h) => '  - ' + h).join('\n'))
}
if (!hasBuild && !configWarn.length) console.log('✅ 占位符扫描全部通过')
