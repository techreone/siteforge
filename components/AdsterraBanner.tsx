'use client'

import { useEffect, useRef } from 'react'

interface AdsterraBannerProps {
  idKey: string
  width: number
  height: number
  className?: string
  label?: string
}

// Adsterra banner invoke host for this template family (from dashboard GET CODE).
const INVOKE_HOST = 'https://www.highperformanceformat.com'

interface BannerJob {
  key: string
  width: number
  height: number
  el: HTMLDivElement
  dead: boolean
}

declare global {
  interface Window {
    __awBannerQueue?: BannerJob[]
    __awBannerBusy?: boolean
    __awWritePatched?: boolean
    __awWriteTarget?: HTMLElement | null
    __awBannerSink?: HTMLElement | null
    atOptions?: { key: string; format: string; height: number; width: number; params: Record<string, never> }
  }
}

/**
 * Direct-injection banner unit — NO iframe (2026-09-27).
 *
 * Why not iframe: iframe swallows clicks and crushes CPM (measured: iframe
 * build did 15,804 impressions with 0 clicks; native-in-iframe CPM fell to
 * the 0.04 range vs 10+ direct). Policy-safe: visible + original size + one
 * code per placement.
 *
 * Two races solved without an iframe:
 * 1. `window.atOptions` clobbering — every unit shares the global, so jobs
 *    run through a page-level SERIAL queue: one atOptions set + one invoke
 *    script at a time, next starts only after onload/onerror/10s timeout.
 * 2. `document.write` page wipe — invoke.js renders via document.write,
 *    which clears a loaded document. A one-time capture routes writes into
 *    the slot. The capture stays installed permanently: any late write lands
 *    in the sink instead of wiping the page (strictly safer than native).
 */
function pumpBannerQueue() {
  if (typeof window === 'undefined' || window.__awBannerBusy) return
  window.__awBannerBusy = true
  const step = () => {
    const job = (window.__awBannerQueue ?? []).shift()
    if (!job) {
      window.__awBannerBusy = false
      return
    }
    if (job.dead || !job.el.isConnected) {
      step()
      return
    }
    loadBannerJob(job).then(step)
  }
  step()
}

function loadBannerJob(job: BannerJob): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (!settled) {
        settled = true
        window.__awWriteTarget = null
        resolve()
      }
    }
    if (!window.__awWritePatched) {
      window.__awWritePatched = true
      const sink = document.createElement('div')
      sink.style.display = 'none'
      document.body.appendChild(sink)
      window.__awBannerSink = sink
      window.__awWriteTarget = null
      document.write = (...args: string[]) => {
        const target = window.__awWriteTarget ?? window.__awBannerSink
        target?.insertAdjacentHTML('beforeend', args.join(''))
      }
      document.writeln = (...args: string[]) => {
        const target = window.__awWriteTarget ?? window.__awBannerSink
        target?.insertAdjacentHTML('beforeend', `${args.join('')}\n`)
      }
    }
    window.__awWriteTarget = job.el
    window.atOptions = { key: job.key, format: 'iframe', height: job.height, width: job.width, params: {} }
    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = `${INVOKE_HOST}/${job.key}/invoke.js`
    const timer = window.setTimeout(finish, 10000)
    script.onload = () => {
      window.setTimeout(() => {
        window.clearTimeout(timer)
        finish()
      }, 300)
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      finish()
    }
    ;(document.head ?? document.body).appendChild(script)
  })
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
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''
    // StrictMode double-mount guard: same key already queued for this node.
    if (container.dataset.awQueued === idKey) return
    container.dataset.awQueued = idKey
    const job: BannerJob = { key: idKey, width, height, el: container, dead: false }
    window.__awBannerQueue = window.__awBannerQueue ?? []
    window.__awBannerQueue.push(job)
    pumpBannerQueue()
    return () => {
      job.dead = true
      if (container.dataset.awQueued === idKey) delete container.dataset.awQueued
    }
  }, [idKey, width, height])

  return (
    <div className={`my-4 flex max-w-full flex-col items-center justify-center overflow-hidden rounded-[var(--radius-item)] border border-[var(--dark-5)] bg-[var(--dark-2)] p-2 shadow-md ${className}`}>
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
