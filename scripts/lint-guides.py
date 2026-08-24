#!/usr/bin/env python3
"""内容站 Lint — 持续维护的页面质量自动检查
用法:
  python3 scripts/lint-guides.py               # 全站检查
  python3 scripts/lint-guides.py --game iron-nest   # 单游戏
  python3 scripts/lint-guides.py --fast        # 跳过 pHash 图片去重（更快）
  python3 scripts/lint-guides.py --fix-orphans # 列出死内链指向的缺失页

检查项（F=frontmatter/图片, L=链接/内容）:
  F01 frontmatter 必填字段完整 (title/mainKeyword/description/lastUpdated/date/img)
  F02 frontmatter img 指向的文件存在
  F03 每游戏内 frontmatter img 唯一（首页/游戏站展示图不重复）
  F04 正文图片引用 (![...](...)) 指向的文件存在
  F05 无 0 字节图片
  F06 每游戏图片 pHash 去重（--fast 跳过；相似距离 ≤8 视为重复）
  F07 正文含 CJK/中文标点（全站英文，LANGUAGE.md；CJK = [\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]）
  F08 frontmatter title/description 含 CJK 字符（全站英文，LANGUAGE.md）
  F09 frontmatter title 长度 >60 字符（Semrush title-too-long 门禁，2026-08-13 修复后防回归）
  F10 正文一级标题 # 数量 ≠1（Semrush Multiple-h1 门禁：正文 # 是全站唯一 H1 来源，数据页正文无 # 由模板 h1 承担）
  F11 frontmatter description 长度 >160 字符（Semrush meta 截断红线，2026-08-13 全站压缩后防回归）
  F12 frontmatter description 含未转义双引号（YAML 解析崩溃 → build 失败，2026-08-13 三篇事故后防回归）
  F13 正文词数 <600（谷歌薄内容判线；wiki 黄金线 600-2000，2026-08-13 全站扩写后防回归）
  F14 faq frontmatter 存在但正文无 FAQ 区（FAQPage schema 静默丢弃；2026-08-14 空答案事故防回归）
  F15 lastUpdated 日期格式非法（Article dateModified 依赖；兼容 YYYY-MM-DD 与 "August 12, 2026" 双格式）
  L12 frontmatter img 文件 >200KB（LCP 性能红线：展示图仅 ≤256px 显示，大图拖慢首屏）
  L13 正文图 >300KB（滚动加载慢；超限提示压缩，warning 级）
  L14 组件回归: LeftSidebar 游戏卡 img 缺 loading="lazy"（LCP 防回归：35 张 eager preload 曾拖垮 LCP 5.5s）
  L15 组件回归: GuideArticleView 缺 "More {Game} Guides" 卡片区（内链织网防回归，方向 D 产物）
  L01 底部 Related Guides 段落内链 ≥3（内链要够多）
  L02 正文内链 ≥3（Related 之外的同站链接；内链总量 ≥6）
  L03 权威外链 ≥3（http(s) 链接，Steam/IGN/官方站等）
  L04 无死内链（/slug/guides/slug 指向的文件存在）
  L05 callout 视觉组件 ≥1（> [!tip/warning/critical/note]）
  L06 正文图片 ≥1（每篇至少 1 张配图）
  L07 H1 包含 mainKeyword（一页一词）
  L08 FAQ 区块 ≥1 条（faq frontmatter 或正文 FAQ 章节）
  L09 无重复 slug / slug 为 kebab-case
  L10 侧边栏相关链接上限回归检查（组件须含 related.slice(0, 6)）
  L11 GEO 官方出处引用 ≥1（GEO/AI 搜索优化；> 引用块含官方链接，warning 级——存量不强制，新攻略必带）
"""
import sys, os, glob, re, csv, yaml, datetime
from PIL import Image
import imagehash

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

REQUIRED_FM = ['title', 'mainKeyword', 'description', 'lastUpdated', 'date', 'img']
IMG_RE = re.compile(r'!\[[^\]]*\]\((/images/[^)]+)\)')
IMG_ALT_RE = re.compile(r'!\[([^\]]*)\]\((/images/[^)]+)\)')
GENERIC_ALT_WORDS = {'image', 'img', 'screenshot', 'photo', 'gameplay', 'pic', 'picture', 'figure'}
EXT_RE = re.compile(r'\((https?://[^)]+)\)')
INT_RE = re.compile(r"\]\((/[a-z0-9\-.]+/guides/[a-z0-9\-.]+)\)")
CJK_RE = re.compile(r"[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]")  # 含中文标点（LANGUAGE.md §2）
CALL_RE = re.compile(r'> \[!(tip|warning|critical|note)')
EMOJI_RE = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F]')

def frontmatter(text):
    """正则快速解析（值带引号）。
    需语义值时用 frontmatter_yaml()（yaml 解析，处理 \" 转义/多行）。"""
    m = re.match(r'^---\n(.*?)\n---', text, re.S)
    if not m: return {}
    fm = {}
    for line in m.group(1).split('\n'):
        mm = re.match(r'^([a-zA-Z]+):\s*(.*)$', line)
        if mm: fm[mm.group(1)] = mm.group(2).strip()
    return fm

def frontmatter_yaml(text):
    """YAML 语义解析 frontmatter；失败返回 (None, err)。"""
    m = re.match(r'^---\n(.*?)\n---', text, re.S)
    if not m: return {}, None
    try:
        return yaml.safe_load(m.group(1)) or {}, None
    except Exception as e:
        return None, str(e)

def find_guides(games=None):
    files = []
    for gdir in sorted(glob.glob('content/*/guides')):
        game = gdir.split('/')[1]
        if games and game not in games: continue
        for f in sorted(glob.glob(f'{gdir}/*.md')):
            files.append((game, f))
    return files

def main():
    args = sys.argv[1:]
    fast = '--fast' in args
    games = None
    if '--game' in args:
        games = [args[args.index('--game') + 1]]
    if '--fix-orphans' in args:
        orphans = check_dead_links()
        for o in orphans: print('  ', o)
        return

    guides = find_guides(games)
    errors, warnings = [], []
    per_game_imgs = {}
    img_hashes = {} if not fast else None
    all_guide_paths = {f for _, f in guides}
    all_slugs = {os.path.basename(f)[:-3] for _, f in guides}

    for game, f in guides:
        base = os.path.basename(f)
        text = open(f, encoding='utf-8').read()
        fm = frontmatter(text)

        # F01 frontmatter 必填
        missing = [k for k in REQUIRED_FM if k not in fm]
        if missing: errors.append(f'F01 {game}/{base}: frontmatter 缺 {missing}')

        # F02 img 存在
        img = fm.get('img', '').strip('"')
        if img and not os.path.exists('public' + img):
            errors.append(f'F02 {game}/{base}: img 不存在 {img}')

        # F03 唯一性
        if img: per_game_imgs.setdefault(game, {}).setdefault(img, []).append(base)

        # F04 正文图存在
        for m in IMG_RE.finditer(text):
            p = 'public' + m.group(1)
            if not os.path.exists(p):
                errors.append(f'F04 {game}/{base}: 正文图不存在 {m.group(1)}')

        # F07 正文含 CJK（全站英文，LANGUAGE.md）
        body = text.split('---', 2)[2] if text.startswith('---') else text
        if CJK_RE.search(body):
            errors.append(f'F07 {game}/{base}: 正文含中文字符')

        # F08 frontmatter title/description 含 CJK
        for field in ('title', 'description'):
            val = fm.get(field, '')
            if CJK_RE.search(val):
                errors.append(f'F08 {game}/{base}: frontmatter {field} 含中文字符')

        # F09 frontmatter title ≤60 字符（Semrush title-too-long 防回归）
        title_val = (fm.get('title', '') or '').strip().strip('"')
        if len(title_val) > 60:
            errors.append(f'F09 {game}/{base}: title 长度 {len(title_val)} > 60（Semrush 阈值）')

        # F10 正文一级标题恰 1 个（全站唯一 H1 来源；数据页正文无 # 由模板 h1 承担）
        body = text.split('---', 2)[2] if text.startswith('---') else text
        n_h1 = len(re.findall(r'^# ', body, re.M))
        if n_h1 != 1:
            errors.append(f'F10 {game}/{base}: 正文一级标题 # 数量 {n_h1}（应为 1）')

        # F12 description YAML 安全（yaml 解析失败 → build 崩溃；裸双引号是主因）
        fm_y, yerr = frontmatter_yaml(text)
        if fm_y is None:
            errors.append(
                f'F12 {game}/{base}: frontmatter YAML 解析失败（{yerr[:60]}）→ build 崩溃——'
                f'检查引号转义：内部双引号改单引号（It\'s "down" → It\'s \'down\'），反斜杠用 \\\\')

        # F11 description ≤160（YAML 语义长度，2026-08-13 全站压缩后防回归）
        if fm_y is not None:
            desc_val = str(fm_y.get('description', '') or '')
            if len(desc_val) > 160:
                errors.append(
                    f'F11 {game}/{base}: description 长度 {len(desc_val)} > 160（SERP 截断损 CTR）——'
                    f'压缩到 150-160：保留游戏名+主关键词+核心答案（Yes/No/数字/平台），砍冗余修饰与尾部细节')

        # F13 正文词数 ≥600（谷歌薄内容判线；wiki 黄金线 600-2000）
        body = text.split('---', 2)[2] if text.startswith('---') else text
        n_words = len(re.findall(r'[A-Za-z0-9]+', body))
        if n_words < 600:
            errors.append(
                f'F13 {game}/{base}: 正文词数 {n_words} < 600（谷歌薄内容判线）——'
                f'扩写到 600-2000：补 How to Get/具体数值/对比/FAQ，多源验证不编造')

        # F14 faq frontmatter 存在 → 正文必须有 FAQ 区（extractFaq 能提取 → FAQPage schema 才有答案）
        # （2026-08-14 防回归：1076 篇 FAQ 空答案事故根因=frontmatter 有问句但正文无答案）
        if 'faq' in fm and not re.search(r'^#{2,3}\s+.*(?:\bfaq\b|frequently asked).*$', body, re.M | re.I):
            errors.append(
                f'F14 {game}/{base}: faq frontmatter 存在但正文无 FAQ 区（## FAQ / ## Frequently Asked Questions）——'
                f'补充 FAQ 区（**问句？** 答案。格式）或删除 faq frontmatter（否则 FAQPage schema 不渲染）')

        # F15 lastUpdated/date 日期格式（Article dateModified / OG modifiedTime 依赖）
        # 接受两种格式：%Y-%m-%d 与 %B %d, %Y（2026-08-14 实测 scrap-mechanic 系 76 篇用 ISO 格式）
        lu_val = (fm.get('lastUpdated', '') or '').strip().strip('"')
        if lu_val:
            lu_ok = False
            for fmt in ('%Y-%m-%d', '%B %d, %Y'):
                try:
                    datetime.datetime.strptime(lu_val, fmt)
                    lu_ok = True
                    break
                except ValueError:
                    pass
            if not lu_ok:
                errors.append(
                    f'F15 {game}/{base}: lastUpdated 格式无法解析 "{lu_val}"——'
                    f'须 YYYY-MM-DD 或 "August 12, 2026"（否则 Article.dateModified 静默缺失）')

        # L01 Related 内链 ≥3（同游戏攻略 ≤3 时降 warning）
        peer_total = len([x for x in all_guide_paths if f'content/{game}/guides/' in x]) - 1
        rm = re.search(r'## Related Guides\n(.*?)(\n## |\n---|\Z)', text, re.S)
        if not rm:
            (warnings if peer_total < 3 else errors).append(f'L01 {game}/{base}: 无 Related Guides 段落')
        else:
            n_rel = len(re.findall(r'^\- \[.*?\]\(.*?\)$', rm.group(1), re.M))
            if n_rel < 3: (warnings if peer_total < 3 else errors).append(f'L01 {game}/{base}: Related 内链 {n_rel} < 3')

        # L02 总内链 ≥5（同游戏攻略 ≤3 时降 warning）
        n_int = len(INT_RE.findall(text))
        if n_int < min(5, peer_total): (warnings if peer_total < 3 else errors).append(f'L02 {game}/{base}: 总内链 {n_int} < {min(5, peer_total)}')

        # L03 外链 ≥3
        n_ext = len(EXT_RE.findall(text))
        if n_ext < 3: errors.append(f'L03 {game}/{base}: 外链 {n_ext} < 3')

        # L05 callout ≥1
        n_call = len(CALL_RE.findall(text))
        if n_call < 1: errors.append(f'L05 {game}/{base}: 无 callout 视觉组件')

        # L06 正文图 ≥1（frontmatter img 不算）
        n_img = len(IMG_RE.findall(text))
        if n_img < 1: errors.append(f'L06 {game}/{base}: 正文无配图')

        # L07 H1 含主词
        mkw = fm.get('mainKeyword', '').strip('"').lower()
        h1 = re.search(r'^# (.+)$', text, re.M)
        if mkw and h1 and mkw not in h1.group(1).lower():
            warnings.append(f'L07 {game}/{base}: H1 未含主词 "{mkw}"')

        # L08 FAQ
        if 'faq' not in fm and '## Frequently Asked' not in text and '## FAQ' not in text:
            warnings.append(f'L08 {game}/{base}: 无 FAQ 区块')

        # L09 slug 规范
        if not re.match(r'^[a-z0-9]+(-[a-z0-9]+\.?\d*)*\.md$', base):
            errors.append(f'L09 {game}/{base}: slug 非 kebab-case')

        # L11 GEO 官方出处引用（warning 级：新攻略必带，存量不强制）
        # 引用块（> 开头的 markdown 引用）内含 http 链接即视为出处引用
        geo_refs = re.findall(r'^>.*https?://', body, re.M)
        if not geo_refs:
            warnings.append(f'L11 {game}/{base}: 无 GEO 官方出处引用块（> ... 官方链接）')

        # L12 frontmatter img >200KB（LCP 性能红线：展示图 ≤256px 显示）
        img_path = (fm.get('img', '') or '').strip().strip('"')
        if img_path and os.path.exists('public' + img_path):
            sz = os.path.getsize('public' + img_path)
            if sz > 200 * 1024:
                errors.append(
                    f'L12 {game}/{base}: 展示图 {sz//1024}KB > 200KB（LCP 红线）——'
                    f'运行 node scripts/optimize-images.mjs 或 magick resize 1024 q72 压缩')

        # L13 正文图 >300KB（warning 级：滚动加载慢）
        for m in IMG_RE.finditer(text):
            p = 'public' + m.group(1)
            if os.path.exists(p) and os.path.getsize(p) > 300 * 1024:
                warnings.append(
                    f'L13 {game}/{base}: 正文图 {m.group(1)} {os.path.getsize(p)//1024}KB > 300KB——'
                    f'运行 node scripts/optimize-images.mjs 压缩')

        # L16 Image Alt 泛词与极短 Alt 拦截（Image SEO 拦截）
        for m in IMG_ALT_RE.finditer(text):
            raw_alt = m.group(1).strip()
            src = m.group(2).strip()
            clean_alt = re.sub(r'#\w+$', '', raw_alt).strip()
            words = re.findall(r"[A-Za-z0-9\'-]+", clean_alt)
            words_lower = [w.lower() for w in words]
            word_cnt = len(words)
            if len(clean_alt) == 0 or word_cnt == 0:
                errors.append(
                    f'L16 {game}/{base}: 正文图 "{src}" Alt 留空 —— '
                    f'补充有效描述语义 (≥3 词，如 "Player exploring desert biome in Rust")')
            elif word_cnt < 3:
                gen_match = [w for w in words_lower if w in GENERIC_ALT_WORDS]
                if gen_match:
                    errors.append(
                        f'L16 {game}/{base}: 正文图 "{src}" Alt "{raw_alt}" 含泛词 ({gen_match[0]}) 且词数 {word_cnt} < 3 —— '
                        f'补充有效描述语义 (≥3 词，禁止空/极短/单泛词如 image/screenshot/gameplay)')
                else:
                    errors.append(
                        f'L16 {game}/{base}: 正文图 "{src}" Alt "{raw_alt}" 词数 {word_cnt} < 3 —— '
                        f'补充有效描述语义 (≥3 词，禁止极短 Alt)')
            elif all(w in GENERIC_ALT_WORDS for w in words_lower):
                errors.append(
                    f'L16 {game}/{base}: 正文图 "{src}" Alt "{raw_alt}" 全为泛词 —— '
                    f'补充有效描述语义 (≥3 词)')

    # F03 汇总
    for game, d in per_game_imgs.items():
        for img, files in d.items():
            if len(files) > 1:
                errors.append(f'F03 {game}: 展示图重复 {img} ← {len(files)} 篇')

    # L09 重复 slug
    seen = {}
    for _, f in guides:
        s = os.path.basename(f)[:-3]
        seen.setdefault(s, []).append(f)
    for s, fs in seen.items():
        if len(fs) > 1: errors.append(f'L09 重复 slug: {s}')

    # L04 死内链
    for game, f in guides:
        text = open(f, encoding='utf-8').read()
        for m in INT_RE.finditer(text):
            path = m.group(1)
            # /game/guides/slug → content/game/guides/slug.md
            parts = path.strip('/').split('/')
            if len(parts) == 3 and parts[1] == 'guides':
                target = f'content/{parts[0]}/guides/{parts[2]}.md'
                if not os.path.exists(target):
                    errors.append(f'L04 {os.path.basename(f)}: 死内链 {path}')
            elif len(parts) == 2:  # /game/slug 或 /game/guides
                target = f'content/{parts[0]}/guides/{parts[1]}.md'
                if os.path.exists(target): continue
                errors.append(f'L04 {os.path.basename(f)}: 死内链 {path}')

    # F05 0 字节图片
    for p in glob.glob('public/images/*/*.webp') + glob.glob('public/images/*/*.jpg'):
        if os.path.getsize(p) == 0:
            errors.append(f'F05 0 字节图片: {p}')

    # F06 pHash 去重（全站每游戏内）
    if not fast:
        for gdir in sorted(glob.glob('public/images/*')):
            if not os.path.isdir(gdir): continue
            imgs = sorted(glob.glob(f'{gdir}/*.webp') + glob.glob(f'{gdir}/*.jpg'))
            if len(imgs) < 2: continue
            hs = []
            for p in imgs:
                try: hs.append((p, imagehash.phash(Image.open(p).convert('RGB'))))
                except Exception: pass
            for i in range(len(hs)):
                for j in range(i + 1, len(hs)):
                    if hs[i][1] - hs[j][1] <= 8:
                        errors.append(f'F06 图片重复(距离{hs[i][1]-hs[j][1]}): {os.path.basename(hs[i][0])} ≈ {os.path.basename(hs[j][0])}')

    # L10 侧边栏回归检查
    comp = open('components/GuideArticleView.tsx', encoding='utf-8').read()
    if 'related.slice(0, 6)' not in comp:
        errors.append('L10 组件回归: GuideArticleView 侧边栏未限制 related.slice(0, 6)')

    # L14 组件回归: LeftSidebar 游戏卡 img loading="lazy"（LCP 防回归）
    sidebar = open('components/LeftSidebar.tsx', encoding='utf-8').read()
    if 'loading="lazy"' not in sidebar:
        errors.append(
            'L14 组件回归: LeftSidebar 游戏卡 img 缺 loading="lazy"（LCP 防回归：35 张 eager preload 曾拖垮 LCP 5.5s）——'
            '给 <img> 加 loading="lazy" decoding="async"')

    # L15 组件回归: GuideArticleView "More {Game} Guides" 卡片（内链织网防回归）
    if 'More ' not in comp or 'related.slice(6, 14)' not in comp:
        errors.append(
            'L15 组件回归: GuideArticleView 缺 "More {Game} Guides" 卡片区（内链织网防回归）——'
            '保留 related.slice(6, 14) 卡片渲染（8 卡网格带摘要）')

    print(f'检查 {len(guides)} 篇攻略')
    if errors:
        print(f'\n❌ {len(errors)} 个错误:')
        for e in sorted(set(errors)): print('  ', e)
    else:
        print('\n✅ 0 错误')
    if warnings:
        print(f'\n⚠️ {len(warnings)} 个警告:')
        for w in sorted(set(warnings)): print('  ', w)
    sys.exit(1 if errors else 0)

if __name__ == '__main__':
    main()
