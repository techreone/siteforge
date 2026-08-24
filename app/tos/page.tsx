
import { CONTACT_EMAIL, SITE_NAME } from '../../lib/site-config'
export const metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: `Terms of Service page for ${SITE_NAME}.`,
}

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-zinc-300">
      <h1 className="text-3xl font-bold text-white">{`Terms of Service — ${SITE_NAME}`}</h1>
      <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-5 text-amber-300 space-y-2">
        <p className="font-bold uppercase tracking-wider text-sm">⚠️ PLACEHOLDER — 上线前必须替换</p>
        <p className="text-sm">PLACEHOLDER_TOS — 内容仅个人信息参考、商标归属免责、外链免责、责任限制。</p>
      </div>
      <p>
        Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
      </p>
    </main>
  )
}
