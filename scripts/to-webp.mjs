import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const root = 'process.cwd()'
const imgDir = path.join(root, 'public', 'images')
let total = 0, saved = 0

for (const game of fs.readdirSync(imgDir)) {
  if (!fs.statSync(path.join(imgDir, game)).isDirectory()) continue
  for (const f of fs.readdirSync(path.join(imgDir, game))) {
    if (!/\.(jpe?g|png)$/i.test(f)) continue
    const src = path.join(imgDir, game, f)
    const out = path.join(imgDir, game, f.replace(/\.(jpe?g|png)$/i, '.webp'))
    if (fs.existsSync(out)) continue // 已转换
    const before = fs.statSync(src).size
    const meta = await sharp(src).metadata()
    // 缩到宽度 ≤1600（Steam 截图 1920 宽对文章展示过大），quality 80
    await sharp(src)
      .resize({ width: Math.min(meta.width || 1920, 1600), withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(out)
    const after = fs.statSync(out).size
    total++
    saved += before - after
    console.log(`  ${game}/${f} → ${(after/1024).toFixed(0)}KB (was ${(before/1024).toFixed(0)}KB, -${(100-after/before*100).toFixed(0)}%)`)
  }
}
console.log(`\n转换 ${total} 张，共节省 ${(saved/1024/1024).toFixed(1)}MB`)
