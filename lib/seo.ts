import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE, CONTACT_EMAIL } from './site-config'
export { SITE_URL }

export { DEFAULT_OG_IMAGE }

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : '/' + path}`
}

export interface OpenGraphArgs {
  title: string
  description: string
  url: string
  image?: string
  type?: string
}

export function makeOpenGraph({ title, description, url, image, type = 'website' }: OpenGraphArgs) {
  return {
    title,
    description,
    url: absoluteUrl(url),
    type,
    siteName: SITE_NAME,
    images: [{ url: absoluteUrl(image ?? DEFAULT_OG_IMAGE) }],
  }
}

export function makeTwitter({ title, description, image }: { title: string; description: string; image?: string }) {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl(image ?? DEFAULT_OG_IMAGE)],
  }
}
