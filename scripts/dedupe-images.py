#!/usr/bin/env python3
"""内容站图片去重与展示图唯一性检查
用法:
  python3 scripts/dedupe-images.py public/images/{game}/   # 检测相似图片（pHash > 0.90 视为重复）
  python3 scripts/dedupe-images.py --check-frontmatter      # 检查每游戏 frontmatter img 唯一性
"""
import sys, os, glob, re
from PIL import Image
import imagehash

SIM_THRESHOLD = 8  # 相似度 ~0.93 才算重复  # hamming distance: 0 = identical, >32 完全不同; 12 ≈ 相似度 0.90

def phash(path):
    try:
        return imagehash.phash(Image.open(path).convert('RGB'))
    except Exception as e:
        return None

def scan_duplicates(dirpath):
    imgs = sorted(glob.glob(os.path.join(dirpath, '*.webp')) + glob.glob(os.path.join(dirpath, '*.jpg')))
    if len(imgs) < 2:
        print(f"✅ {dirpath}: 图片 <2 张，跳过")
        return
    hashes = [(p, phash(p)) for p in imgs]
    hashes = [(p, h) for p, h in hashes if h is not None]
    print(f"扫描 {len(hashes)} 张: {dirpath}")
    dupes = []
    for i in range(len(hashes)):
        for j in range(i + 1, len(hashes)):
            d = hashes[i][1] - hashes[j][1]
            if d <= SIM_THRESHOLD:
                dupes.append((d, hashes[i][0], hashes[j][0]))
    if dupes:
        for d, a, b in sorted(dupes):
            print(f"  ⚠️ 相似(距离{d}): {os.path.basename(a)} ≈ {os.path.basename(b)}")
    else:
        print(f"  ✅ 无重复（全部互异）")

def check_frontmatter():
    bad = []
    total_games = 0
    for gdir in sorted(glob.glob('content/*/guides')):
        game = gdir.split('/')[1]
        imgs = {}
        for f in sorted(glob.glob(f'{gdir}/*.md')):
            t = open(f).read()
            m = re.search(r'^img:\s*"(/images/[^"]+)"', t, re.M)
            if m:
                imgs.setdefault(m.group(1), []).append(os.path.basename(f))
        dup = {k: v for k, v in imgs.items() if len(v) > 1}
        total_games += 1
        if dup:
            bad.append((game, dup))
    if bad:
        print(f"❌ {len(bad)}/{total_games} 游戏有展示图重复:")
        for game, dup in bad:
            for k, v in dup.items():
                print(f"  {game}: {k} ← {v}")
        sys.exit(1)
    else:
        print(f"✅ 全部 {total_games} 游戏 frontmatter img 唯一（每攻略展示图互不相同）")

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--check-frontmatter' in args:
        check_frontmatter()
    elif args:
        for d in args:
            if os.path.isdir(d):
                scan_duplicates(d)
    else:
        # 默认扫描全站图片
        for g in sorted(os.listdir('public/images')):
            scan_duplicates(f'public/images/{g}')
        print()
        check_frontmatter()
