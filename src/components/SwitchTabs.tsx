import { cn } from '@/lib/utils'

export type SwitchTabItem<T extends string = string> = {
  value: T
  label: string
}

type SwitchTabsProps<T extends string = string> = {
  items: SwitchTabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SwitchTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: SwitchTabsProps<T>) {
  return (
    <div className={cn('switch-tabs', className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn('switch-tab', active && 'switch-tab-active')}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
