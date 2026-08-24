import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ── MDX 攻略读取管线（服务端构建时解析，SSG 兼容，零运行时成本）──

export interface PostFrontmatter {
  title: string
  mainKeyword?: string
  description?: string
  lastUpdated?: string
  date?: string
  related?: string[]
  [key: string]: unknown
}

export interface TocItem {
  id: string
  label: string
  level: number
}

export interface FaqItem {
  question: string
  answer: string
}

export interface Post {
  slug: string
  topic: string
  frontmatter: PostFrontmatter
  html: string
  toc: TocItem[]
  faq: FaqItem[]
}

const CONTENT_DIR = path.join(process.cwd(), 'content')

/** 列出某游戏的全部攻略（slug 列表，按文件名排序） */
export function listPosts(topic: string): string[] {
  const dir = path.join(CONTENT_DIR, topic, 'posts')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((f) => f.replace(/\.(mdx|md)$/, ''))
    .sort()
}

/** 读取并解析一篇攻略（frontmatter + HTML + TOC） */
export function getPost(topic: string, slug: string): Post | null {
  const file = path.join(CONTENT_DIR, topic, 'posts', `${slug}.mdx`)
  const fileMd = path.join(CONTENT_DIR, topic, 'posts', `${slug}.md`)
  const target = fs.existsSync(file) ? file : fs.existsSync(fileMd) ? fileMd : null
  if (!target) return null

  const raw = fs.readFileSync(target, 'utf-8')
  const { data, content } = matter(raw)

  // 提取 H2/H3 生成 TOC，并给标题加锚点 id
  const toc: TocItem[] = []
  const processor: any = unified()
  processor.use(remarkParse)
  processor.use(remarkGfm)
  processor.use(() => (tree: unknown) => {
      const seen = new Map<string, number>()
      visit(tree as never, 'heading', (node: any) => {
        if (node.depth < 2 || node.depth > 3) return
        const label = node.children.map((c: any) => c.value ?? '').join('').trim()
        if (!label) return
        // id 生成：保留 Unicode 字母/数字（含中文标题），清理非法字符，
        // 去首尾横杠；空 id（纯符号标题等）用 index 兜底，避免 href="#" 无法定位
        const baseId = label
          .toLowerCase()
          .trim()
          .replace(/[^\p{L}\p{N}\s-]/gu, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')
        let id = baseId || `section-${toc.length + 1}`
        const dup = seen.get(id) ?? 0
        if (dup > 0) {
          id = `${id}-${dup + 1}`
        }
        seen.set(id, dup + 1)
        toc.push({ id, label, level: node.depth })
        // 关键：给标题加 id 锚点（否则 TOC 跳转找不到目标）
        node.data = { ...(node.data ?? {}), hProperties: { ...((node.data as any)?.hProperties ?? {}), id } }
      })
    })
    .use(remarkRehype)
    .use(rehypeCallout)
    .use(rehypeImageFigure)
    .use(rehypeTableWrap)
    .use(rehypeStringify)

  const result = processor.processSync(content)
  const html = String(result)

  return {
    slug,
    topic,
    frontmatter: data as PostFrontmatter,
    html,
    toc,
    faq: extractFaq(content),
  }
}

// ── FAQ 问答提取（markdown 原文阶段，产出结构化问答对）──
// FAQ 区 = 标题匹配词 "faq" 或 "frequently asked"（如 "## FAQ"、"## Frequently Asked Questions"）。
// 区边界 = 下一个 depth <= 区标题 depth 的标题（同级或更高级）或 EOF；区内的 H3/H2 子标题视为问题。
// 区内问题两种句式：
//   1) 加粗句式：段落以 "**" 开头且含闭合 "**"（如 "**Is ReStory on Switch?** No — ..."）；
//      question = 首对 ** 之间的文本，answer = ** 之后剩余文本 + 后续非问题段。
//   2) 子标题句式：区内的 H3/H2 子标题本身即问题，其下段落为答案。
// 仅保留 answer 非空的问答对（answer trim 后为空则丢弃）。
const faqSectionRe = /^#{2,3}\s+(.*\bfaq\b.*|.*frequently asked.*)$/i
const faqHeadingRe = /^(#{1,3})\s+(.+)$/

// 清理 markdown 行内语法（加粗/斜体/链接/行内代码），返回纯文本
function cleanInline(text: string): string {
  const BK = String.fromCharCode(96) // 反引号
  return text
    .replace(/\*\*([^*]+?)\*\*/g, '$1') // **bold**
    .replace(/\*([^*]+?)\*/g, '$1') // *italic*
    .replace(/\[([^\[\]]+)\]\([^)]*\)/g, '$1') // [link](url) -> link
    .replace(new RegExp(BK + '([^' + BK + ']+?)' + BK, 'g'), '$1') // `code`
    .trim()
}

function extractFaq(content: string): FaqItem[] {
  const lines = content.split(String.fromCharCode(10))
  const results: FaqItem[] = []
  let i = 0
  while (i < lines.length) {
    const secHead = lines[i].match(faqSectionRe)
    if (!secHead) {
      i++
      continue
    }
    // 区标题深度：H2 或 H3
    const secDepth = (secHead[0].match(/^#{1,3}/) || ['##'])[0].length
    // 区边界：下一个 depth <= secDepth 的标题（不含本行），或 EOF
    let j = i + 1
    while (j < lines.length) {
      const hm = lines[j].match(/^(#{1,3})\s+\S/)
      if (hm && hm[1].length <= secDepth) break
      j++
    }
    // 收集区内容行（不含 FAQ 区标题本身）
    const seg = lines.slice(i + 1, j).filter((l) => l.trim() !== '')

    let curQ: { question: string; answerBuf: string[] } | null = null
    const pushCur = () => {
      if (!curQ) return
      const answer = curQ.answerBuf.join(' ').trim()
      if (answer) {
        results.push({ question: cleanInline(curQ.question), answer })
      }
      curQ = null
    }
    for (const raw of seg) {
      const line = raw.trim()
      // 子标题（H3/H2）→ 新问题
      const head = line.match(faqHeadingRe)
      if (head) {
        pushCur()
        curQ = { question: head[2], answerBuf: [] }
        continue
      }
      // 加粗句式（以 ** 开头且含闭合 **）
      const bold = line.match(/^\*\*(.+?)\*\*?([\s\S]*)$/)
      if (bold && bold[1].trim()) {
        pushCur()
        curQ = { question: bold[1], answerBuf: bold[2] && bold[2].trim() ? [bold[2]] : [] }
        continue
      }
      // 其余为当前问题的答案续行
      if (curQ) curQ.answerBuf.push(line)
    }
    pushCur()
    i = j
  }
  return results
}
/** 是否某游戏存在任何攻略 */
export function hasPosts(topic: string): boolean {
  return listPosts(topic).length > 0
}


// ── MDX 视觉组件插件 ──
// callout 语法（Obsidian 风格）：> [!tip] 标题 \n > 内容（内容支持 markdown）
// 类型：tip / warning / critical / note
function rehypeCallout() {
  return (tree: any) => {
    function walk(node: any) {
      if (node.type === 'element' && node.tagName === 'blockquote') {
        const firstP = node.children?.find((c: any) => c.tagName === 'p')
        const textNode = firstP?.children?.find((c: any) => c.type === 'text')
        const m = textNode ? String(textNode.value).match(/^\[!(tip|warning|critical|note)\](?:\s*([^\n]*))?/i) : null
        if (m) {
          const type = m[1].toLowerCase()
          const titleRaw = (m[2] ?? '').trim()
          // 移除 textNode 开头的 "[!type] 标题" 前缀（保留后续内容）
          const raw = String(textNode.value)
          const nl = raw.indexOf('\n')
          const consume = nl >= 0 ? nl + 1 : raw.length
          textNode.value = raw.slice(consume).replace(/^\n/, '')
          // body = 全部 children，去掉纯空白文本
          const body = node.children.filter((c: any) => !(c.type === 'text' && /^\s*$/.test(c.value)))
          // 转为 div.callout
          node.tagName = 'div'
          node.properties = { className: ['callout', `callout-${type}`] }
          node.children = [
            ...(titleRaw ? [{ type: 'element', tagName: 'div', properties: { className: ['callout-title'] }, children: [{ type: 'text', value: titleRaw }] }] : []),
            { type: 'element', tagName: 'div', properties: { className: ['callout-body'] }, children: body },
          ]
        }
        return
      }
      if (node.children) for (const c of node.children) walk(c)
    }
    walk(tree)
    return tree
  }
}

// 图片：hast 阶段包 figure（单行大图）；alt 含 #wrap → 文本环绕小图
function rehypeImageFigure() {
  return (tree: any) => {
    function walk(node: any, parent: any) {
      if (node.type === 'element' && node.tagName === 'img') {
        const altRaw = String(node.properties?.alt ?? '')
        const wrap = altRaw.includes('#wrap')
        const alt = altRaw.replace('#wrap', '').trim()
        node.properties = { ...(node.properties ?? {}), alt }
        const fig = {
          type: 'element',
          tagName: 'figure',
          properties: { className: [wrap ? 'figure-wrap' : 'figure-block'] },
          children: [
            node,
            ...(alt ? [{ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: alt }] }] : []),
          ],
        }
        if (parent) {
          const i = parent.children.indexOf(node)
          parent.children[i] = fig
        }
        return
      }
      if (node.children) for (const c of node.children) walk(c, node)
    }
    walk(tree, null)
    return tree
  }
}

// 表格：hast 阶段包 div.table-wrapper（移动端横向滚动，防破版）
function rehypeTableWrap() {
  return (tree: any) => {
    function walk(node: any, parent: any) {
      if (node.type === 'element' && node.tagName === 'table') {
        const wrap = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrapper'] },
          children: [node],
        }
        if (parent) {
          const i = parent.children.indexOf(node)
          parent.children[i] = wrap
        }
        return
      }
      if (node.children) for (const c of node.children) walk(c, node)
    }
    walk(tree, null)
    return tree
  }
}
