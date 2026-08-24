// ── 站点配置：唯一事实来源（Single Source of Truth）────────────────────────
// 新站上线前必须替换所有 PLACEHOLDER_ 值。检查命令：
//   node scripts/check-placeholders.mjs   （构建产物扫描，必须 0 命中）

/** 站点品牌名（页头/页脚/TDK/JSON-LD publisher） */
export const SITE_NAME = 'PLACEHOLDER_SITE_NAME'

/** 正式域名（含协议，结尾无斜杠）。本地开发可临时用 http://localhost:3000，上线前必须改回正式域 */
export const SITE_URL = 'https://PLACEHOLDER_DOMAIN.example'

/** 联系邮箱（about/privacy 页脚） */
export const CONTACT_EMAIL = 'hello@PLACEHOLDER_DOMAIN.example'

/** 品牌资源路径（public/ 下） */
export const SITE_LOGO_ICON = '/images/site/icon-256.webp'
export const SITE_LOGO_FULL = '/images/site/logo-full.webp'
export const SITE_LOGO_TEXT = '/images/site/logo-text.webp'
export const DEFAULT_OG_IMAGE = '/images/site/og-default.webp'

/** 站点一句话定位（llms.txt / TDK 默认值） */
export const SITE_TAGLINE = 'PLACEHOLDER_TAGLINE — 一句话说明这个站是做什么的、给谁看'

/** 站点类型语义：wiki | guide | news | tool —— 影响 TDK 后缀与 JSON-LD 措辞 */
export const SITE_KIND = 'guide'

/** 默认 TDK 标题（layout metadata default） */
export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`
