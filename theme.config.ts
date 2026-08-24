// ── 个性化主题配置（唯一改这里）────────────────────────────
// ⚠️ 本文件是新站个性化的入口。出厂值全是 __PLACEHOLDER__ 标记，
//    不修改直接 build 会被 check-placeholders 拦下（lint 报错+修改指引）。
//
// 使用：把每个 '__...__' 占位值替换成你站点的真实值，然后跑：
//    npm run sync:theme   （把 token 注入 styles/globals.css）
//
// 参考实现：how-to-fish 站（海洋板岩蓝 + 天蓝/沙滩金主题）

export const THEME = {
  // ── 品牌身份 ──
  brandName: '__BRAND_NAME__',            // 站点名（页头/TDK/JSON-LD）
  brandTagline: '__BRAND_TAGLINE__',      // 一句话定位（hero 副标/llms.txt）
  brandIcon: '__BRAND_ICON_PATH__',       // 品牌图标路径（public/ 下，256x256 webp）

  // ── 底色体系（深色站：从黑到浅的 6 级表面色）──
  colorBg: '__THEME_BG__',                // 页面最底色
  colorSurface: '__THEME_SURFACE__',      // 卡片表面
  colorSurfaceAlt: '__THEME_SURFACE_ALT__', // 次级卡片表面
  colorSurfaceHover: '__THEME_SURFACE_HOVER__', // 按钮/hover 表面
  colorLine: '__THEME_LINE__',            // 1px 边线
  colorLineActive: '__THEME_LINE_ACTIVE__', // 激活/hover 边线

  // ── 文字灰阶 ──
  textMuted: '__THEME_TEXT_MUTED__',      // 弱化文字
  textSubtle: '__THEME_TEXT_SUBTLE__',    // 次级图标/元信息
  textDim: '__THEME_TEXT_DIM__',          // 最弱边框/提示

  // ── 双强调色（品牌个性所在，重点个性化项）──
  accent: '__THEME_ACCENT__',             // 主强调（链接/高亮/激活）
  accentHover: '__THEME_ACCENT_HOVER__',  // 主强调 hover
  accentDeep: '__THEME_ACCENT_DEEP__',    // 主强调深色变体
  accent2: '__THEME_ACCENT2__',           // 次强调（徽章/点缀/hover glow）
  accent2Soft: '__THEME_ACCENT2_SOFT__',  // 次强调浅底 rgba()
  accent2Border: '__THEME_ACCENT2_BORDER__', // 次强调边框 rgba()

  // ── 形状 ──
  radiusCard: '__THEME_RADIUS_CARD__',    // 卡片圆角（rounded-xl / rounded-none / …）
  radiusItem: '__THEME_RADIUS_ITEM__',    // 小件圆角（按钮/搜索结果行）

  // ── 主题图标（可选：components/icons/ThemeIcons.tsx 的导出名）──
  heroImage: '__THEME_HERO_IMAGE__',      // 首页 hero 背景图（public/ 路径，1920w webp）
} as const
