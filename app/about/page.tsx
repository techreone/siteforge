
import { CONTACT_EMAIL, SITE_NAME } from '../../lib/site-config'
export const metadata = {
  title: `About — ${SITE_NAME}`,
  description: `About page for ${SITE_NAME}.`,
}

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-zinc-300">
      <h1 className="text-3xl font-bold text-white">{`About — ${SITE_NAME}`}</h1>
      <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-5 text-amber-300 space-y-2">
        <p className="font-bold uppercase tracking-wider text-sm">⚠️ PLACEHOLDER — 上线前必须替换</p>
        <p className="text-sm">PLACEHOLDER_ABOUT — 用 2-3 段介绍：这个站覆盖什么主题、为谁服务、内容如何保证质量（一手经验/多源核实）。这是 E-E-A-T 的核心页面，禁止留空上线。</p>
      </div>
      <p>
        Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
      </p>
    </main>
  )
}
