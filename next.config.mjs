import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出到 out/，供 Cloudflare Pages 托管（纯静态，零 ISR 消耗）
  // 注意：仅 build 时启用 export；dev 模式保持正常 server 渲染，
  // 否则 Next 15 在 dev 下也强制所有动态路由必须被 generateStaticParams 覆盖，
  // 访问任何未声明组合（如骨架期的假链接）会直接 500。
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  reactStrictMode: true,
  devIndicators: false,
  // 避免 /home/piyoko 下的 package-lock.json 被推断为 workspace root 导致缓存错位
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

export default nextConfig
