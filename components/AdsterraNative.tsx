'use client'

import { useEffect, useRef } from 'react'

interface AdsterraNativeProps {
  className?: string
  label?: string
}

export default function AdsterraNative({
  className = '',
  label = '',
}: AdsterraNativeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // 容器 ID 由 Adsterra 广告位绑定（invoke.js 按此 ID 定位），不能改
    const containerId = 'container-e873068467612259b0fdb89a913a2a76'
    const scriptSrc = 'https://pl30827622.effectivecpmnetwork.com/e873068467612259b0fdb89a913a2a76/invoke.js'

    // 幂等：脚本已加载则只复用容器，不重复注入（防 StrictMode 双调 / 多实例重复加载）
    if (!document.querySelector(`script[data-adsterra-native="${containerId}"]`)) {
      let adDiv = document.getElementById(containerId)
      if (!adDiv) {
        adDiv = document.createElement('div')
        adDiv.id = containerId
        container.appendChild(adDiv)
      }
      const script = document.createElement('script')
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.setAttribute('data-adsterra-native', containerId)
      script.src = scriptSrc
      container.appendChild(script)
    }
  }, [])

  return (
    <div className={`my-6 rounded-none border border-[#1f1f23] bg-[#0c0c0e] p-4 shadow-md ${className}`}>
      {label && (
        <div className="mb-3 border-b border-[#1f1f23] pb-2 text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
          {label}
        </div>
      )}
      <div ref={containerRef} className="min-h-[100px] w-full" />
    </div>
  )
}
