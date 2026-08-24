#!/usr/bin/env node
// ── 静态预览服务器（预览 build 产物 out/，生产版入口）──
// 无依赖的 node 静态服务器。用法：node scripts/serve-static.mjs [port]
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'out')
const port = Number(process.argv[2] ?? process.env.PORT ?? 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
    // 漂亮 URL：/foo → /foo.html（Next 静态导出惯例）
    let file = path.join(root, urlPath)
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const html = path.join(root, `${urlPath}.html`)
      if (fs.existsSync(html)) file = html
      else file = path.join(file, 'index.html')
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('404 Not Found')
      return
    }
    const ext = path.extname(file).toLowerCase()
    res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  } catch {
    res.writeHead(500)
    res.end('500')
  }
})

server.listen(port, () => {
  console.log(`\n  ✅ 生产版预览（build 产物 out/）`)
  console.log(`  →  http://localhost:${port}\n`)
  console.log(`  这是 build 的入口——dev 出问题时用它看效果（静态版，无缓存污染问题）\n`)
})
