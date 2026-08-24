'use client'

import { useEffect, useRef } from 'react'

interface AdsterraBannerProps {
  idKey: string
  width: number
  height: number
  className?: string
  label?: string
}

export default function AdsterraBanner({
  idKey,
  width,
  height,
  className = '',
  label = '',
}: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const iframe = document.createElement('iframe')
    iframe.width = `${width}`
    iframe.height = `${height}`
    iframe.style.border = 'none'
    iframe.style.overflow = 'hidden'
    iframe.style.display = 'block'
    iframe.scrolling = 'no'

    containerRef.current.appendChild(iframe)

    // iframe.contentWindow 在异步挂载下可能暂不可用（React 18 并发），重试直到可写
    let attempts = 0
    const writeAd = () => {
      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) {
        if (attempts++ < 10) setTimeout(writeAd, 50)
        return
      }
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; display: flex; justify-content: center; align-items: center; }
          </style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : '${idKey}',
              'format' : 'iframe',
              'height' : ${height},
              'width' : ${width},
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highperformanceformat.com/${idKey}/invoke.js"></script>
        </body>
        </html>
      `)
      iframeDoc.close()
    }
    writeAd()
  }, [idKey, width, height])

  return (
    <div className={`my-4 flex max-w-full flex-col items-center justify-center overflow-hidden rounded-none border border-[#1f1f23] bg-[#0c0c0e] p-2 shadow-md ${className}`}>
      {label && (
        <span className="mb-1 text-[9px] font-mono font-bold tracking-widest text-zinc-600 uppercase">
          {label}
        </span>
      )}
      <div
        ref={containerRef}
        className="flex items-center justify-center overflow-hidden"
        style={{ width: `${width}px`, maxWidth: '100%', minHeight: `${height}px` }}
      />
    </div>
  )
}
