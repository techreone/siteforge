import { ADS, ADSTERRA_SIDEBAR_160_KEY } from '../lib/ads'
import AdsterraBanner from './AdsterraBanner'

// 侧栏 160×600 摩天楼 — TOC 栏下方、sticky 跟随（Mistfall 8/18 实测位）。
// 直注（AdsterraBanner 串行队列），无 iframe；未配置不渲染。
export default function AdsterraSideAd() {
  if (!ADS.sidebar160) return null
  return <AdsterraBanner idKey={ADSTERRA_SIDEBAR_160_KEY} width={160} height={600} />
}
