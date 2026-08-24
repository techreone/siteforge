import Link from 'next/link'

type CardProps = {
  title: string
  href: string
  description?: string
  meta?: React.ReactNode
  icon?: React.ReactNode
}

export default function Card({ title, href, description, meta, icon }: CardProps) {
  return (
    <Link
      href={href}
      className="group rounded-lg bg-card p-5 transition-colors hover:bg-card/70 hover:ring-1 hover:ring-border"
    >
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-1.5">{meta}</div>}
        </div>
      </div>
    </Link>
  )
}
