#!/usr/bin/env node
// ── 主题同步：theme.config.ts → styles/globals.css ─────────────────
// 用法：npm run sync:theme（prebuild 自动跑）
// 机制：把 THEME token 写入 globals.css 的 /* __THEME_TOKENS__ */ 标记块，
//       组件/CSS 全部只引用 CSS 变量，换主题=改 theme.config 一个文件。
// 占位符值（__XXX__）会原样写入 → check-placeholders 在 build 后拦截。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const cfgPath = path.join(root, 'theme.config.ts')
const cssPath = path.join(root, 'styles', 'globals.css')

const cfg = fs.readFileSync(cfgPath, 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')

// 从 TS 配置里抽 key: 'value' 对
const tokens = {}
for (const m of cfg.matchAll(/(brandName|brandTagline|brandIcon|colorBg|colorSurface|colorSurfaceAlt|colorSurfaceHover|colorLine|colorLineActive|textMuted|textSubtle|textDim|accent|accentHover|accentDeep|accent2|accent2Soft|accent2Border|radiusCard|radiusItem|heroImage):\s*'([^']*)'/g)) {
  tokens[m[1]] = m[2]
}

// CSS 变量映射（key → :root 变量名）
const MAP = {
  colorBg: '--dark-1',
  colorSurface: '--dark-2',
  colorSurfaceAlt: '--dark-3',
  colorSurfaceHover: '--dark-4',
  colorLine: '--dark-5',
  colorLineActive: '--dark-6',
  textMuted: '--grey-1',
  textSubtle: '--grey-2',
  textDim: '--grey-3',
  accent: '--accent-main',
  accentHover: '--accent-hover',
  accentDeep: '--accent-deep',
  accent2: '--accent2-main',
  accent2Soft: '--accent2-soft',
  accent2Border: '--accent2-border',
  radiusCard: '--radius-card',
  radiusItem: '--radius-item',
  brandIcon: '--brand-icon',
  heroImage: '--hero-image',
}

const missing = Object.keys(MAP).filter((k) => !tokens[k])
if (missing.length) {
  console.error('❌ theme.config.ts 缺少 token:', missing.join(', '))
  process.exit(1)
}

// brandName/brandTagline 不进 CSS（TS 侧 site-config 消费），但校验存在
for (const k of ['brandName', 'brandTagline']) {
  if (!tokens[k]) { console.error(`❌ theme.config.ts 缺少 ${k}`); process.exit(1) }
}

const lines = Object.entries(MAP)
  .map(([k, v]) => `  ${v}: ${tokens[k]};`)
  .join('\n')

const BLOCK_START = '/* __THEME_TOKENS__ */'
const BLOCK_END = '/* __/THEME_TOKENS__ */'
const block = `${BLOCK_START}\n:root {\n${lines}\n}\n${BLOCK_END}`

let next
if (css.includes(BLOCK_START)) {
  next = css.replace(new RegExp(`${BLOCK_START.replace(/[*/]/g, '\\$&')}[\\s\\S]*?${BLOCK_END.replace(/[*/]/g, '\\$&')}`), block)
} else {
  // 首次注入：插到 :root 定义段之后
  next = css.replace(/(:root\s*\{[\s\S]*?\n\})/, `$1\n\n${block}`)
}

fs.writeFileSync(cssPath, next)

const unfilled = Object.entries(tokens).filter(([, v]) => /^__.*__$/.test(v))
if (unfilled.length) {
  console.log(`⚠️  sync-theme 完成，但有 ${unfilled.length} 个占位符未个性化:`)
  for (const [k, v] of unfilled) console.log(`   ${k} = ${v}`)
  console.log('   → 编辑 theme.config.ts 填入真实值后重跑 npm run sync:theme')
  console.log('   → build 不阻塞，但 check-placeholders 会持续提示，直到全部填完')
} else {
  console.log('✅ sync-theme 完成：全部 token 已注入 globals.css')
}
