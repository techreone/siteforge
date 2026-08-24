#!/usr/bin/env node
// ── 图片抓取/本地化脚本 ──
// 用途：从权威网站抓取图片 → 本地化到 public/images/{game}/
// 用法：node scripts/fetch-image.mjs <image-url> <alt?> --game <game> [--name <slug>]
// 说明：alt/tag 文本与文章内容的相关性校验由调用方（写作 Agent）判断，
//       本脚本负责下载 + 本地存储 + 输出安全的本地引用路径（保证 SSG 可访问）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

const url = args.find((a) => a.startsWith('http'))
const alt = args[args.indexOf('--alt') + 1] ?? ''
const game = args[args.indexOf('--game') + 1]
let name = args[args.indexOf('--name') + 1] ?? ''

if (!url || !game) {
  console.error('用法: node scripts/fetch-image.mjs <image-url> --alt "<alt>" --game <game> [--name <slug>]')
  process.exit(1)
}

// 从 URL 推断扩展名
const extMatch = url.match(/\.(png|jpe?g|webp|gif|avif)(\?|$)/i)
if (!extMatch) {
  console.error('⚠️  无法从 URL 推断图片格式，跳过:', url)
  process.exit(1)
}
const ext = extMatch[1].toLowerCase().replace('jpeg', 'jpg')

// 默认文件名：alt 去特殊字符 或 用户指定
if (!name) {
  name = (alt || 'image').toLowerCase().replace(/[^\w]+/g, '-').replace(/-+/g, '-').slice(0, 48)
}

const dir = path.join(root, 'public', 'images', game)
fs.mkdirSync(dir, { recursive: true })
const outPath = path.join(dir, `${name}.${ext}`)

// 用 curl 走代理下载（Node fetch 不走系统代理，curl -x 稳定）
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'

const PROXY = process.env.https_proxy || process.env.HTTP_PROXY || 'http://127.0.0.1:7897'

function dl() {
  try {
    // 下载后检查文件头是否为图片
    execFileSync('curl', ['-sL', '-f', '--max-time', '25', '-x', PROXY,
      '-A', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', url, '-o', outPath],
      { stdio: ['ignore', 'ignore', 'pipe'] })
    const sig = fs.readFileSync(outPath)
    const head = sig.subarray(0, 12).toString('hex')
    const isImage = /^ffd8|^89504e47|^52494646|^0000001c66747970|^47494638/.test(head)
    if (!isImage) throw new Error(`非图片文件头: ${head}`)
    return true
  } catch (e) {
    if (e.stderr) console.error('  curl stderr:', String(e.stderr).trim().slice(0, 200))
    if (e.stdout) console.error('  curl stdout:', String(e.stdout).trim().slice(0, 200))
    return false
  }
}

async function main() {
  if (!dl()) {
    console.error(`❌ 下载失败: ${url}`)
    process.exit(1)
  }
  try {
    // 统一转 WebP（缩到 ≤1600 宽、quality 80），规范见 IMAGE-ASSETS.md
    const outWebp = outPath.replace(/\.(jpe?g|png)$/i, '.webp')
    const meta = await sharp(outPath).metadata()
    await sharp(outPath)
      .resize({ width: Math.min(meta.width || 1920, 1600), withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outWebp)
    fs.unlinkSync(outPath) // 删除原始下载文件
    const size = fs.statSync(outWebp).size
    console.log(`✅ 已下载并转 WebP ${size} bytes → public/images/${game}/${name}.webp`)
    console.log(`引用路径: /images/${game}/${name}.webp`)
  } catch (e) {
    console.error(`⚠️  转 WebP 失败（保留原文件）: ${e.message}`)
    const size = fs.statSync(outPath).size
    console.log(`引用路径: /images/${game}/${name}.${ext}`)
  }
}

main()
