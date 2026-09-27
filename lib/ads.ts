// ── 广告位唯一事实来源（Single Source of Truth）───────────────────────
// 出厂全是 PLACEHOLDER_；建站时填入本站自有广告位 ID。
// 约定（与主题/品牌占位同一哲学）：值仍含 PLACEHOLDER = 未配置，
// 对应组件与脚本一律不渲染（空=关闭）。绝不在代码里硬编码别站的广告 key。
// 检查：node scripts/check-placeholders.mjs 会软提示未填项（⚠️ 不阻塞）。

const configured = (s: string) => s.length > 0 && !s.includes('PLACEHOLDER')

/** Google AdSense 发布商 ID（各站共用同一账号时填同一值，如 ca-pub-XXXX） */
export const ADSENSE_CLIENT = 'PLACEHOLDER_ADSENSE_CLIENT'

/** Google Analytics 4 衡量 ID（每站独立，如 G-XXXXXXXXXX） */
export const GA4_ID = 'PLACEHOLDER_GA4_ID'

/** Adsterra Popunder 完整脚本 URL（_best_ 做法：整站 head 直载，无同意门控） */
export const ADSTERRA_POPUNDER_SRC = 'PLACEHOLDER_ADSTERRA_POPUNDER_SRC'

/** Adsterra Social Bar 完整脚本 URL */
export const ADSTERRA_SOCIALBAR_SRC = 'PLACEHOLDER_ADSTERRA_SOCIALBAR_SRC'

/** 正文穿插 Banner 300x250 的 Adsterra key（atOptions key） */
export const ADSTERRA_INARTICLE_KEY = 'PLACEHOLDER_ADSTERRA_INARTICLE_KEY'

/** Native Banner invoke.js 完整 URL（形如 https://<host>/<hex>/invoke.js） */
export const ADSTERRA_NATIVE_SRC = 'PLACEHOLDER_ADSTERRA_NATIVE_SRC'

/** 移动端底部吸顶 320x50 的 Adsterra key */
export const ADSTERRA_STICKY_KEY = 'PLACEHOLDER_ADSTERRA_STICKY_KEY'

/** 文章标题下方 728x90 leaderboard 的 Adsterra key（Mistfall 8/18 实测位） */
export const ADSTERRA_HEADER_728_KEY = 'PLACEHOLDER_ADSTERRA_HEADER_728_KEY'

/** 侧栏 TOC 160x600 摩天楼的 Adsterra key（Mistfall 8/18 实测位） */
export const ADSTERRA_SIDEBAR_160_KEY = 'PLACEHOLDER_ADSTERRA_SIDEBAR_160_KEY'

/** 各广告位是否已配置（组件层唯一判断入口，不要各自另写 includes 逻辑） */
export const ADS = {
  adsense: configured(ADSENSE_CLIENT),
  ga4: configured(GA4_ID),
  popunder: configured(ADSTERRA_POPUNDER_SRC),
  socialbar: configured(ADSTERRA_SOCIALBAR_SRC),
  inarticle: configured(ADSTERRA_INARTICLE_KEY),
  native: configured(ADSTERRA_NATIVE_SRC),
  sticky: configured(ADSTERRA_STICKY_KEY),
  header728: configured(ADSTERRA_HEADER_728_KEY),
  sidebar160: configured(ADSTERRA_SIDEBAR_160_KEY),
} as const

/** 从 Native invoke.js URL 派生容器 ID（Adsterra 按 container-<hex> 定位；URL 形如 …/<hex>/invoke.js） */
export function nativeContainerId(): string {
  const m = ADSTERRA_NATIVE_SRC.match(/\/([0-9a-f]{32})\/invoke\.js/i)
  return `container-${m ? m[1] : 'unconfigured'}`
}
