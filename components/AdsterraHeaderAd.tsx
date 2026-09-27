import { ADS, ADSTERRA_HEADER_728_KEY } from '../lib/ads'
import AdsterraBanner from './AdsterraBanner'

// 文章头部 728×90 leaderboard — 标题下方、正文之前（Mistfall 8/18 实测位）。
// 直注（AdsterraBanner 串行队列），无 iframe；未配置不渲染。
export default function AdsterraHeaderAd() {
  if (!ADS.header728) return null
  return <AdsterraBanner idKey={ADSTERRA_HEADER_728_KEY} width={728} height={90} />
}
