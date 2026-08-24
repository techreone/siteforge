import fs from 'fs'
import path from 'path'

// 域名从 lib/site-config.ts 读取；key 从 scripts/indexnow-key.txt 读取（上线前必须替换占位 key）
import { readFileSync } from 'fs'
const cfg = readFileSync(path.join(process.cwd(), 'lib', 'site-config.ts'), 'utf-8')
const host = (cfg.match(/SITE_URL = 'https:\/\/([^'.]+)\./) || [])[1] ? (cfg.match(/SITE_URL = 'https:\/\/([^'/]+)'/) || [])[1].replace('https://','') : ''
if (!host || host.includes('PLACEHOLDER')) {
  console.error('❌ site-config.ts 的 SITE_URL 仍是占位符，跳过 IndexNow 提交')
  process.exit(0)
}
let key
try {
  key = fs.readFileSync(path.join(process.cwd(), 'scripts', 'indexnow-key.txt'), 'utf-8').trim()
  if (/PLACEHOLDER/i.test(key)) throw new Error('placeholder')
} catch {
  console.error('⚠️ scripts/indexnow-key.txt 缺失或仍是占位符，跳过 IndexNow 提交')
  process.exit(0)
}
const keyLocation = `https://${host}/indexnow-${key}.txt`

// 收集全站静态页面 URL
const urls = [
  `https://${host}`,
  `https://${host}/about`,
  `https://${host}/privacy`,
  `https://${host}/tos`
]

const contentDir = path.join(process.cwd(), 'content')
if (fs.existsSync(contentDir)) {
  const topics = fs.readdirSync(contentDir)
  for (const topic of topics) {
    if (topic.startsWith('.')) continue
    urls.push(`https://${host}/${topic}`)
    urls.push(`https://${host}/${topic}/posts`)
    
    const guidesDir = path.join(contentDir, topic, 'guides')
    if (fs.existsSync(guidesDir)) {
      const files = fs.readdirSync(guidesDir)
      for (const file of files) {
        if (file.endsWith('.md')) {
          const slug = file.replace(/\.md$/, '')
          urls.push(`https://${host}/${topic}/posts/${slug}`)
        }
      }
    }
  }
}

console.log(`[IndexNow] 共收集到 ${urls.length} 个 URL 准备提交给 Bing/IndexNow API...`)

const payload = {
  host: host,
  key: key,
  keyLocation: keyLocation,
  urlList: urls
}

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(payload)
  })

  console.log(`[IndexNow API 响应状态]: ${res.status} ${res.statusText}`)
  if (res.status === 200 || res.status === 202) {
    console.log(`✅ 成功向 IndexNow 广播提交了 ${urls.length} 个 URL！Bing 将快速刷新索引。`)
  } else {
    const text = await res.text()
    console.log(`⚠️ IndexNow 返回状态码 ${res.status}: ${text}`)
  }
} catch (err) {
  console.error(`❌ POST IndexNow API 失败:`, err)
}
