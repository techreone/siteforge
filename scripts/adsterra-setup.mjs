#!/usr/bin/env node
// Adsterra 一条龙：建站（等价面板 Add new Website）→ 取 10 个广告位代码 → 自动写进 lib/ads.ts。
//
// 用法（在新站仓库根目录跑）：
//   node scripts/adsterra-setup.mjs                    # 域名取自 lib/site-config.ts 的 SITE_URL，直接建站+埋码
//   node scripts/adsterra-setup.mjs --dry-run          # 只打印计划，不建站不写文件
//   node scripts/adsterra-setup.mjs --domain x.com     # 手动指定域名（默认读 SITE_URL）
//   node scripts/adsterra-setup.mjs --json out.json    # 额外把广告位+代码落成 JSON 存档
//
// 幂等：域名已在 Adsterra 站点列表里 → 跳过建站，只补缺的广告位并刷新 ads.ts。
//
// 端点来自后台前端 bundle 逆向（2026-10-24 实测打通，48 站 471 位全中）：
//   POST /api/site                      body {zone, ad_units, b_feed_erotic_ads_exclude, id_zone, category_id}
//   GET  /api/sites?limit=200           站点列表
//   GET  /api/placements/{id}/extended? 广告位 + codes[]（codes[].code 就是脚本原文）
// 鉴权：X-Access-Token = 后台 JWT（tkn_3），**不是**公开 API 的 X-API-Key。
//   取新 token：见 cf-deploy skill「凭据」段 / SECRETS.local.md。
// 注意：服务端限流「每 1 分钟最多 5 个 ad unit」，所以 10 个位要分 2 批、中间等 62s。
//       后台**没有删除站点的接口**，域名写错只能人工在面板删——--dry-run 先用非法域名探校验。

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE = 'https://beta.publishers.adsterra.com/api'
const TOKEN_FILE = path.join(os.homedir(), '.config/agents/skills/cf-deploy/.adsterra-access-token')

// ad_unit id → 面板上的广告位类型（48 站 471 位实测一致）
const AD_UNITS = {
  5: '300x250',
  23: '728x90',
  25: '160x600',
  26: '160x300',
  27: '468x60',
  28: 'Popunder',
  29: 'SocialBar',
  32: '320x50(sticky)',
  49: 'NativeBanner',
  10001: 'Smartlink',
}

// 舰队统一做法：10 个位全开、不接成人流量、category_id=3（与 47/48 个存量站一致）
const FLEET_AD_UNITS = [5, 23, 25, 26, 27, 28, 29, 32, 49, 10001]
const FLEET_CATEGORY_ID = 3
const BATCH_SIZE = 5
const BATCH_WAIT_S = 62

// ad_unit → lib/ads.ts 常量（与底座 lib/ads.ts 的槽位一一对应）
const SLOTS = {
  28: { name: 'ADSTERRA_POPUNDER_SRC', how: 'src' },
  29: { name: 'ADSTERRA_SOCIALBAR_SRC', how: 'src' },
  49: { name: 'ADSTERRA_NATIVE_SRC', how: 'src' },
  5: { name: 'ADSTERRA_INARTICLE_KEY', how: 'key' },
  32: { name: 'ADSTERRA_STICKY_KEY', how: 'key' },
  23: { name: 'ADSTERRA_HEADER_728_KEY', how: 'key' },
  25: { name: 'ADSTERRA_SIDEBAR_160_KEY', how: 'key' },
  // 26 / 27 / 10001 在底座没有槽位，建着备用（舰队存量站同样如此）
}

const args = process.argv.slice(2)
const flag = (n) => args.includes(n)
const opt = (n) => {
  const i = args.indexOf(n)
  return i >= 0 ? args[i + 1] : null
}
const DRY = flag('--dry-run')
const JSON_OUT = opt('--json')

const fail = (msg) => {
  console.error(`❌ ${msg}`)
  process.exit(1)
}

function token() {
  if (process.env.ADSTERRA_ACCESS_TOKEN) return process.env.ADSTERRA_ACCESS_TOKEN.trim()
  if (fs.existsSync(TOKEN_FILE)) return fs.readFileSync(TOKEN_FILE, 'utf-8').trim()
  fail(`缺少 Adsterra 后台 token：设 ADSTERRA_ACCESS_TOKEN，或写入 ${TOKEN_FILE}（见 cf-deploy 技能）`)
}

async function api(p, method = 'GET', body = null, retries = 3) {
  const headers = {
    'X-Access-Token': token(),
    'X-Requested-With': 'XMLHttpRequest',
    Origin: 'https://beta.publishers.adsterra.com',
    Referer: 'https://beta.publishers.adsterra.com/websites',
    Accept: 'application/json',
  }
  if (body) headers['Content-Type'] = 'application/json'
  for (let i = 0; i < retries; i += 1) {
    const res = await fetch(BASE + p, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => null)
    if (!res) {
      await sleep(1000 * (i + 1))
      continue
    }
    const raw = await res.text()
    let payload
    try {
      payload = raw.trim() ? JSON.parse(raw) : {}
    } catch {
      payload = { raw }
    }
    if ([429, 500, 502, 503].includes(res.status) && i + 1 < retries) {
      console.error(`   … [${res.status}] 重试 ${i + 2}/${retries}`)
      await sleep(1500 * (i + 1))
      continue
    }
    return { status: res.status, payload }
  }
  return { status: 0, payload: { message: 'network' } }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 域名归一：去掉协议/www/尾斜杠，小写 */
function normDomain(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

function domainFromSiteConfig() {
  const f = 'lib/site-config.ts'
  if (!fs.existsSync(f)) fail('找不到 lib/site-config.ts（请在站点仓库根目录运行，或用 --domain 指定）')
  const src = fs.readFileSync(f, 'utf-8')
  const url = (src.match(/SITE_URL\s*=\s*['"`]([^'"`]+)['"`]/) || [])[1]
  if (!url) fail('lib/site-config.ts 里没解析到 SITE_URL，用 --domain 指定域名')
  return normDomain(url)
}

async function listSites() {
  const { status, payload } = await api('/sites?limit=200')
  if (status !== 200) fail(`拉站点列表失败 [${status}] ${JSON.stringify(payload).slice(0, 300)}`)
  const items = payload?.data?.items || payload?.data || []
  return Array.isArray(items) ? items : []
}

async function createSite(domain, adUnits) {
  const batches = []
  for (let i = 0; i < adUnits.length; i += BATCH_SIZE) batches.push(adUnits.slice(i, i + BATCH_SIZE))

  const body = {
    zone: DRY ? 'not-a-url' : domain, // dry-run 用非法域名：服务端只报域名错，其余字段照样校验，不会真建
    ad_units: batches[0],
    b_feed_erotic_ads_exclude: true,
    id_zone: null,
    category_id: FLEET_CATEGORY_ID,
  }
  console.log(`→ POST /site  zone=${body.zone}  分 ${batches.length} 批 ${JSON.stringify(batches)}`)
  const first = await api('/site', 'POST', body)
  console.log(`← [${first.status}] ${JSON.stringify(first.payload).slice(0, 300)}`)
  // dry-run 的判据：服务端只对 zone 报错（因为我们故意传了 not-a-url），说明 ad_units / 分类 / 成人开关全过
  const data = first.payload?.data
  const onlyZoneErr =
    first.status === 422 && data && typeof data === 'object' && Object.keys(data).every((k) => k === 'zone')
  if (DRY) {
    if ([200, 201].includes(first.status) || onlyZoneErr) {
      console.log('✔ dry-run 通过：除域名外的字段全部被服务端接受（未建站、未改文件）。')
      return null
    }
    fail('dry-run 失败：除域名外还有字段被拒，看上面返回')
  }
  if (![200, 201].includes(first.status)) {
    fail('建站被拒：看上面服务端返回（常见：域名不可注册 / ad_unit 非法 / 1 分钟内超过 5 个位）')
  }

  await sleep(1500)
  let site = (await listSites()).find((s) => normDomain(s.domain) === domain)
  if (!site) fail(`建站请求成功但列表里没找到 ${domain}，去面板确认`)
  console.log(`✔ 站点已建：id=${site.id} status=${site.status}（1=Pending / 2=Approved）`)

  for (let i = 1; i < batches.length; i += 1) {
    console.log(`… 等 ${BATCH_WAIT_S}s 再补第 ${i + 1} 批（限流：5 个 ad unit/分钟）`)
    await sleep(BATCH_WAIT_S * 1000)
    const r = await api('/site', 'POST', { ...body, zone: domain, ad_units: batches[i], id_zone: site.id })
    console.log(`← [${r.status}] ${JSON.stringify(r.payload).slice(0, 200)}`)
    if (![200, 201].includes(r.status)) fail('补广告位失败：看上面返回')
  }
  return site
}

/** 已在 Fleet 里的站点但广告位不全 → 只补缺的（每批 ≤5） */
async function topUpUnits(site, want) {
  const have = new Set(site.ad_units || [])
  const missing = want.filter((u) => !have.has(u))
  if (!missing.length) return
  console.log(`→ 补广告位：已有 ${have.size} 个，缺 ${JSON.stringify(missing)}`)
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    if (i > 0) await sleep(BATCH_WAIT_S * 1000)
    const batch = missing.slice(i, i + BATCH_SIZE)
    const r = await api('/site', 'POST', {
      zone: normDomain(site.domain),
      ad_units: batch,
      b_feed_erotic_ads_exclude: site.b_feed_erotic_ads_exclude ?? true,
      id_zone: site.id,
      category_id: site.category_id ?? FLEET_CATEGORY_ID,
    })
    console.log(`← [${r.status}] ${JSON.stringify(r.payload).slice(0, 200)}`)
    if (![200, 201].includes(r.status)) fail('补广告位失败：看上面返回')
  }
}

function pick(code, how) {
  if (how === 'src') {
    const m = code.match(/src="([^"]+)"/) || code.match(/src='([^']+)'/)
    return m ? m[1] : null
  }
  const m = code.match(/'key'\s*:\s*'([0-9a-f]{32})'/) || code.match(/"key"\s*:\s*"([0-9a-f]{32})"/)
  return m ? m[1] : null
}

/** 把常量值写进 lib/ads.ts（只替换 export const 那一行，保留注释与其余结构） */
function patchAdsTs(updates) {
  const f = 'lib/ads.ts'
  if (!fs.existsSync(f)) fail('找不到 lib/ads.ts')
  let src = fs.readFileSync(f, 'utf-8')
  const changed = []
  for (const [name, value] of Object.entries(updates)) {
    const re = new RegExp(`(export const ${name}\\s*=\\s*)'[^']*'`)
    if (!re.test(src)) {
      console.log(`   ⚠️ lib/ads.ts 没有 ${name}，跳过`)
      continue
    }
    const before = src.match(re)[0]
    const after = `$1'${value}'`
    if (before.endsWith(`'${value}'`)) continue
    src = src.replace(re, after)
    changed.push(name)
  }
  // Native 容器正则：老写法强制 /invoke.js，而 Adsterra 现在发的是不带后缀的短链 → 必须兼容两种
  const oldRe = '.match(/\\/([0-9a-f]{32})\\/invoke\\.js/i)'
  if (src.includes(oldRe)) {
    src = src.replace(
      oldRe,
      '.match(/\\/([0-9a-f]{32})(?:\\/invoke\\.js)?$/i)'
    )
    changed.push('nativeContainerId 正则')
  }
  if (!changed.length) {
    console.log('✔ lib/ads.ts 已是最新，无需改动')
    return []
  }
  if (DRY) {
    console.log(`dry-run：将更新 ${changed.join(' / ')}`)
    return changed
  }
  fs.writeFileSync(f, src)
  console.log(`✔ lib/ads.ts 已更新：${changed.join(' / ')}`)
  return changed
}

async function main() {
  const domain = normDomain(opt('--domain') || domainFromSiteConfig())
  console.log(`Adsterra 一条龙：${domain}${DRY ? '（dry-run）' : ''}`)

  const sites = await listSites()
  let site = sites.find((s) => normDomain(s.domain) === domain)

  if (!site) {
    site = await createSite(domain, FLEET_AD_UNITS)
    if (!site) return
  } else {
    console.log(`✔ 站点已存在：id=${site.id} status=${site.status}，已挂 ${(site.ad_units || []).length} 个广告位`)
    if (!DRY) await topUpUnits(site, FLEET_AD_UNITS)
  }
  if (DRY) return

  // 建完/补完再回查一次，拿到最终 ad_units 与 status
  const fresh = (await listSites()).find((s) => normDomain(s.domain) === domain) || site
  console.log(`   回查：status=${fresh.status} ad_units=${JSON.stringify(fresh.ad_units)} category_id=${fresh.category_id}`)

  const { status, payload } = await api(`/placements/${fresh.id}/extended?`)
  if (status !== 200) fail(`取广告位失败 [${status}] ${JSON.stringify(payload).slice(0, 300)}`)
  const placements = payload?.data || []
  if (!placements.length) fail('广告位列表为空：站点可能还在审核，稍后重跑本脚本（幂等）')

  const picked = {}
  const archive = []
  for (const p of placements) {
    const unit = Number(p.ad_unit)
    const type = AD_UNITS[unit] || `ad_unit ${unit}`
    const codes = (p.codes || []).map((c) => c.code).filter(Boolean)
    const slot = SLOTS[unit]
    let value = null
    if (slot) {
      for (const c of codes) {
        value = value || pick(c, slot.how)
      }
    }
    archive.push({ id: p.id, title: p.title, ad_unit: unit, type, placement_key: p.placement_key, codes })
    const shown = slot ? (value || '未取到') : '备用（底座无槽位）'
    console.log(`   ${String(type).padEnd(16)} key=${p.placement_key || '-'} → ${shown}`)
    if (slot) {
      if (!value) fail(`${type} 没解析出代码，人工看 --json 存档`)
      picked[slot.name] = value
    }
  }

  patchAdsTs(picked)

  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify({ domain, site_id: fresh.id, status: fresh.status, ad_units: fresh.ad_units, placements: archive, picked }, null, 2))
    console.log(`✔ 存档 → ${JSON_OUT}`)
  }

  console.log(`
下一步：npm run build && git add -A && git commit -m "feat(ads): 接入本站 Adsterra 广告位" && git push
        （部署后跑 node scripts/check-placeholders.mjs 确认广告位不再报未配置）`)
}

main().catch((e) => fail(e?.stack || String(e)))
