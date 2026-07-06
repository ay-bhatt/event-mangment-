import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

type Props = {
  compact?: boolean
  showTagline?: boolean
  variant?: 'sidebar' | 'default'
  className?: string
}

export function CaumasBrand({
  compact = false,
  showTagline = true,
  variant = 'default',
  className,
}: Props) {
  const subtextClass =
    variant === 'sidebar'
      ? 'text-sidebar-foreground/75'
      : 'text-muted-foreground'
  const taglineClass =
    variant === 'sidebar'
      ? 'text-sidebar-foreground/55'
      : 'text-muted-foreground/80'
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src="/caumas-logo.png"
        alt={`${BRAND.name} logo`}
        className={cn(
          'rounded-lg object-contain shadow-sm ring-1 ring-white/10',
          compact ? 'h-9 w-9' : 'h-11 w-11',
        )}
      />
      <div className="min-w-0">
        <p
          className={cn(
            'font-bold leading-tight tracking-wide caumas-gradient-text',
            compact ? 'text-sm' : 'text-base',
          )}
        >
          {BRAND.name}
        </p>
        <p className={cn(subtextClass, compact ? 'text-[10px]' : 'text-xs')}>
          {BRAND.productName}
        </p>
        {showTagline && !compact && (
          <p
            className={cn(
              'mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em]',
              taglineClass,
            )}
          >
            {BRAND.tagline}
          </p>
        )}
      </div>
    </div>
  )
}

export function CaumasLogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/caumas-logo.png"
      alt={BRAND.name}
      className={cn('rounded-xl object-contain shadow-lg ring-2 ring-white/10', className)}
    />
  )
}
