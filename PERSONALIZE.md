# SiteForge 个性化指南（含 how-to-fish 回写差异分析）

## 流程（新站三步）
1. **填 `theme.config.ts`**：把所有 `__XXX__` 占位值替换为站点真实值（品牌/色板/圆角/hero 图）
2. **`npm run sync:theme`**：token 自动注入 `styles/globals.css`（标记块自动维护，勿手改）
3. **`npm run build`**：`check-placeholders` 会提示未个性化项（⚠️ 警告不阻塞），附参考案例

## 参考案例：how-to-fish 站（2026-08 用户个性化实测）

用户对 how-to-fish 站做的设计系统级个性化（commit 5f963a2，33 文件），已抽象回母模板：

| Token | 母模板出厂（中性） | how-to-fish 个性化值 | 说明 |
|---|---|---|---|
| colorBg | #000000 | `#0f172a` | 纯黑→海洋板岩蓝，非纯黑更耐看 |
| colorSurface | #09090b | `#162638` | 卡片底 |
| colorLine | #27272a | `#1e3a5f` | 边线带色相 |
| accent | #ffffff | `#38bdf8` | 白→天蓝 |
| accent2 | #ffffff | `#fbbf24` | 次强调沙滩金 |
| radiusCard | 1rem | `1rem` | 锐角 rounded-none → 圆角 xl |
| radiusItem | 0.5rem | `0.5rem` | |

**经验教训（为什么要有占位符体系）**：
- 母模板 one-shot 出厂是"纯黑单色锐角"风，实际每个站都需要主题个性化——
  没有占位符时个性化=手改 8 个组件 100+ 处硬编码色值（用户实际改了 283 行 CSS）
- 硬编码色值已全部 token 化（`var(--dark-*)`/`var(--accent*)`/`var(--radius-*)`），
  换主题只动 theme.config.ts 一个文件

## 差异清单（5f963a2 → 回写决定）
| 部件 | 改动 | 决定 |
|---|---|---|
| globals.css | 设计系统重构（283行）：色板/圆角/hover glow | ✅ token 化回写（变量+sync 机制） |
| MainHeader | 搜索下拉圆角/配色/hover | ✅ 经变量回写 |
| PostArticleView | TOC 卡/标签/相关文章卡配色圆角 | ✅ 经变量回写 |
| TopicSubHeader | 面包屑配色 | ✅ 经变量回写 |
| templates/* | 卡片配色 | ✅ 经变量回写 |
| LeftSidebar | groups 数据驱动导航、game-nav-row/game-icon-item 类名、去硬编码图标、rounded-full 缩略图 | ✅ 已回写（结构泛化：href 由数据提供，品牌图走 site-config） |
| components/icons/ | 主题图标库（FishingIcons.tsx） | 📁 约定回写：icons/ 目录留给各站自建 |
| app/page.tsx | 首页 hero/卡片布局翻新 | 🔒 站点特定，不回写（各站自定） |
| 图片 30 张 | 站点配图 | 🔒 站点特定 |

## 门禁分层（2026-08-24 用户指令存档）

用户原话：「lint不建议拦截，但是要提示，并且给出参考的案例。（skill同样要有案例）」

据此 check-placeholders 实现两层：
- **硬门禁（exit 1）**：仅扫 `out/` 构建产物中的 `PLACEHOLDER_ / roguewiki / example.com` 残留——
  即"已构建、具备上线意图但站点仍是占位符"才拦截
- **软提示（exit 0）**：母模板出厂配置（site-config / indexnow-key / theme.config 未填）→
  ⚠️ 警告 + how-to-fish 参考案例，不阻塞母模板自身开发

双模式验证：出厂态 EXIT=0；含残留产物的未个性化场景 EXIT=1。
