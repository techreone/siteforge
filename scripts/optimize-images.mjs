// SEO v2 LCP 优化：批量压缩 public/images
// keyart/header/icon → 长边 256px（显示 ≤200px）；正文大图 → 长边 1280px
// 用法：node scripts/optimize-images.mjs
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const IMG = 'public/images'
let saved = 0, total = 0, skipped = 0

function files(dir) {
  let out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...files(p))
    else if (/\.(webp|jpe?g|png)$/i.test(e.name)) out.push(p)
  }
  return out
}

for (const f of files(IMG)) {
  const name = path.basename(f)
  const size = fs.statSync(f).size
  const isSmall = /(keyart|header|icon|logo|avatar)/i.test(name)
  const maxSide = isSmall ? 256 : 1280
  const quality = isSmall ? 78 : 75
  if (size < 12 * 1024 && !isSmall) { skipped++; continue } // 已小的跳过
  const tmp = f + '.opt.webp'
  try {
    execSync(`magick "${f}" -auto-orient -resize "${maxSide}x${maxSide}>" -quality ${quality} "${tmp}"`, { stdio: 'pipe' })
    const newsize = fs.statSync(tmp).size
    if (newsize < size * 0.9) { // 至少省 10% 才替换
      fs.renameSync(tmp, f)
      saved += size - newsize
      total++
    } else { fs.unlinkSync(tmp); skipped++ }
  } catch { try { fs.unlinkSync(tmp) } catch {} }
}
console.log(`✅ 压缩 ${total} 张，节省 ${(saved/1024/1024).toFixed(1)}MB，跳过 ${skipped}`)
