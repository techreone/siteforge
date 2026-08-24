'use client'

import { useState } from 'react'
import { SITE_NAME, SITE_URL } from '../lib/site-config'

export default function RightSidebar() {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <aside className="right-sidebar flex flex-col items-center">
      {/* {`Share ${SITE_NAME}`} Card */}
      <div className="social-card w-full">
        <div className="social-card-title">{`Share ${SITE_NAME}`}</div>
        <div className="social-buttons">
          {/* Share to X / Twitter */}
          <a
            href={`${SITE_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn"
            title="Share on X / Twitter"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>

          {/* Share to Reddit */}
          <a
            href={`https://www.reddit.com/submit?title=${encodeURIComponent(SITE_NAME)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn"
            title="Share on Reddit"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.956 0 1.733.776 1.733 1.731.001.696-.412 1.294-1.002 1.56.015.163.022.327.022.491 0 2.508-2.909 4.542-6.495 4.542-3.587 0-6.496-2.034-6.496-4.542 0-.164.007-.328.022-.491A1.73 1.73 0 0 1 4.015 12c0-.955.777-1.731 1.733-1.731.466 0 .888.182 1.196.491 1.194-.856 2.85-1.418 4.674-1.488l.983-4.606 3.238.683c.08-.4.437-.705.867-.705z"/></svg>
          </a>

          {/* Copy Page Link */}
          <button
            onClick={handleCopyLink}
            className="social-btn"
            title={copied ? 'Link Copied!' : 'Copy Page Link'}
          >
            {copied ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-green-600"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            )}
          </button>

          {/* Discord Community Link */}
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn"
            title="Join Discord Community"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
          </a>
        </div>

        {/* ROGUE WIKI Embedded Gaming Shield Logo */}
        <div className="flex justify-center mt-2" title="Site Shield">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/site/icon-256.webp"
            alt="Site emblem"
            className="w-14 h-14 object-contain transition-transform hover:scale-105"
          />
        </div>
      </div>

      {/* Quick Topic Guides & Tools Launchpad */}
      <div className="quick-tools-card w-full">
        <div className="quick-tools-title">Topic Guides &amp; Tools</div>
        <a href="/#all-topics" className="tool-item-btn group">
          <span>All Topic Guides</span>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-zinc-400 group-hover:text-white transition-colors"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </a>
      </div>

    </aside>
  )
}
