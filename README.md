# SiteForge — 通用内容站/工具站前端框架

> 源自 RogueWiki 前端（Next.js 15 静态导出 + MDX + Pagefind + 集中式 JSON-LD）。
> 一站一目录复制使用，SEO 基建开箱即用：sitemap / llms.txt / robots(AI 放行) /
> Article+Breadcrumb+FAQ Schema / IndexNow / 占位符门禁。

## 快速开始（新站 5 步）

```bash
cp -r _template-next-content ../{新站slug}
cd ../{新站slug}
rm -rf .git && git init
npm install
# ↓ 按下方【上线前检查清单】替换占位符，然后：
npm run build && npm run check:placeholders
```

## 目录契约

```
lib/site-config.ts          ← 品牌配置唯一来源（站点名/域名/邮箱/品牌图/tagline）
data/{topic}/catalog.json   ← 频道元数据（name/description/categories/icon）
data/{topic}/theme.config.ts← 可选：频道 accent 色与子导航
content/{topic}/posts/*.md  ← 文章（frontmatter 契约见 scripts/check-frontmatter.mjs）
public/images/site/         ← 品牌图四件套（全部是 PLACEHOLDER 占位图，必须替换）
```

路由语义：`/[topic]`（频道 hub）、`/[topic]/posts`（列表）、`/[topic]/posts/[slug]`（文章）。

---

## ⛔ 上线前检查清单（逐项打勾，缺一不可）

### A. 配置文件（改完跑 `node scripts/check-placeholders.mjs` 必须通过）

- [ ] `lib/site-config.ts`：
  - [ ] `SITE_NAME` — 站点品牌名
  - [ ] `SITE_URL` — 正式域名（https://…，结尾无斜杠）
  - [ ] `CONTACT_EMAIL`
  - [ ] `SITE_TAGLINE` — 一句话定位（进 llms.txt 和默认 TDK）
- [ ] `scripts/indexnow-key.txt` — 换成真实 IndexNow key（Bing Webmaster 生成）
- [ ] `package.json` 的 `name` 字段改为站点 slug

### B. 品牌资产（public/images/site/ 四件套全是占位图）

- [ ] `icon-256.webp` — 站点图标（另需 favicon.ico / apple-touch-icon）
- [ ] `logo-full.webp` — 全宽 logo / 默认分享兜底图
- [ ] `logo-text.webp` — 页头文字 logo
- [ ] `og-default.webp` — 默认 OG 分享图（1200×630）

### C. 内容占位（全部要删/重写）

- [ ] 删除整个 `data/sample-topic/` 与 `content/sample-topic/`
- [ ] 重写 `app/about/page.tsx`（E-E-A-T 核心页：覆盖什么/给谁看/质量如何保证）
- [ ] 重写 `app/privacy/page.tsx`（数据收集 + 广告 Cookie 说明）
- [ ] 重写 `app/tos/page.tsx`
- [ ] `public/robots.txt` 无需改动（AI 放行已配置）；确认 sitemap.xml 由构建生成

### D. 构建与部署门禁

```bash
npm run build                 # 绿 = sitemap/llms.txt/RSS 已生成 + frontmatter 校验过
npm run check:placeholders    # out/ 中无任何 PLACEHOLDER/example.com/roguewiki 残留
ls out/*.html | wc -l         # 页面数 = 预期内容页数 + 系统页数
npx pagefind --site out --output-path out/_pagefind   # postbuild 已自动跑
node scripts/submit-indexnow.mjs                      # 上线后提交收录
```

- [ ] build 绿且 dist 页数正确（防 draft/时间戳过滤导致缺页）
- [ ] `check:placeholders` 通过（**这是硬门禁，占位符上线 = 白站**）
- [ ] 线上抽查 3 页渲染正确
- [ ] GSC 提交域名 + sitemap；手动请求首页索引
- [ ] Bing Webmaster 导入

---

## SEO 基建说明（已内置，无需重复造）

| 能力 | 实现 | 备注 |
|---|---|---|
| JSON-LD | `lib/schema.ts`：Article/Breadcrumb/FAQ/VideoObject | 集中组装，组件层调用 |
| TDK/OG | `lib/seo.ts` + 各页 metadata | Title≤60 / Desc≤160 自查 |
| sitemap | prebuild 自动生成 | lastmod 取自 frontmatter lastUpdated |
| llms.txt | 同上脚本生成 | 定位语来自 SITE_TAGLINE |
| RSS | 同上脚本生成 `/feed.xml` | |
| AI 爬虫 | robots.txt 显式放行 GPTBot/ClaudeBot/PerplexityBot 等 | 勿拦 |
| 站内搜索 | Pagefind（postbuild 自动索引） | |
| frontmatter 校验 | `check-frontmatter.mjs`（prebuild 挂载） | description>160 直接 fail |
| 占位符门禁 | `check-placeholders.mjs` | **上线前必跑** |

## 已知地雷（沿用 roguewiki 实测教训）

1. 静态导出模式：dev 与 build 行为差异——新增依赖服务端能力的库前先想清楚 export 兼容
2. 字体本地化（public/fonts/）：别引 Google Fonts 外链——LCP 与 GDPR 双输
3. 收录后 URL 永不改名；已有排名的页面禁止改 H1/H2/TDK 结构
4. 广告位用 components/Adsterra*.tsx，别内联脚本
