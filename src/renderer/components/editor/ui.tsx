/**
 * Primitive ทั้งหมดของ UI ชั้นแก้ไข (แผน UX/UI ข้อ 6)
 *
 * กฎที่บังคับในไฟล์นี้:
 *  1. ห้ามมีสี hardcode — ทุกสีมาจาก token ใน index.css
 *  2. ขอบของสิ่งที่กดได้ต้องเป็น `line-strong` เสมอ · `line` ใช้เป็นเส้นแบ่งตกแต่งเท่านั้น
 *  3. ระยะห่างอยู่ในสเกล 6 ขั้น · ความสูงของ control อยู่ใน 3 ขั้น (sm/md/lg)
 *  4. ปุ่มไอคอนล้วนต้องมี `aria-label` — บังคับผ่าน type ของ `IconButton`
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as RSelect from '@radix-ui/react-select'
import * as RSwitch from '@radix-ui/react-switch'
import * as RAccordion from '@radix-ui/react-accordion'
import * as RTooltip from '@radix-ui/react-tooltip'
import * as RSlider from '@radix-ui/react-slider'
import { Check, ChevronDown, Info, Loader2, Minus, Plus, Search, Upload, X } from 'lucide-react'
import { useScheduleStore } from '../../store/scheduleStore'
import { useTranslation } from '../../i18n/translations'
import { rafThrottle } from '../../utils/rafThrottle'

/* ═════════════════════════ layout helpers ═════════════════════════ */

const GAP = { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-6', 6: 'gap-8' } as const
export type SpaceStep = keyof typeof GAP

/** กองแนวตั้งตามสเกลระยะ — ปิดโอกาสใส่ค่ามั่ว */
export function Stack({
  gap = 3,
  className,
  children,
}: {
  gap?: SpaceStep
  className?: string
  children: ReactNode
}) {
  return <div className={`flex flex-col ${GAP[gap]} ${className ?? ''}`}>{children}</div>
}

/** แถวแนวนอนตามสเกลระยะเดียวกัน */
export function Row({
  gap = 2,
  align = 'center',
  wrap,
  className,
  children,
}: {
  gap?: SpaceStep
  align?: 'center' | 'start' | 'end' | 'baseline'
  wrap?: boolean
  className?: string
  children: ReactNode
}) {
  const a = { center: 'items-center', start: 'items-start', end: 'items-end', baseline: 'items-baseline' }[align]
  return (
    <div className={`flex ${a} ${GAP[gap]} ${wrap ? 'flex-wrap' : ''} ${className ?? ''}`}>{children}</div>
  )
}

/* ═════════════════════════ Panel / Toolbar ═════════════════════════ */

/** กล่องระดับบนของ panel — หัวติดหนึบ เนื้อหาเลื่อน (ข้อ 6.3) */
export function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="truncate text-title font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="truncate text-label text-ink-faint">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
    </div>
  )
}

/** แถบเครื่องมือแนวนอน จัดกลุ่มซ้าย/กลาง/ขวา (ข้อ 6.3) */
export function Toolbar({
  left,
  center,
  right,
  className,
}: {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex h-[var(--control-lg)] shrink-0 items-center gap-3 border-b border-line bg-surface px-3 ${className ?? ''}`}
    >
      <div className="flex min-w-0 items-center gap-2">{left}</div>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">{center}</div>
      <div className="flex shrink-0 items-center gap-2">{right}</div>
    </div>
  )
}

/* ═════════════════════════ Field + hint ═════════════════════════ */

export function Field({
  label,
  hint,
  tooltip,
  counter,
  density = 'default',
  children,
}: {
  label: string
  hint?: string
  /** รายละเอียดเต็มแบบ hover ถึงเห็น (progressive disclosure) */
  tooltip?: string
  counter?: { current: number; max: number }
  /** panel แคบ 280px ใช้ `compact` เพื่อบีบระยะห่าง (ข้อ 6.2) */
  density?: 'compact' | 'default'
  children: ReactNode
}) {
  return (
    <div className={density === 'compact' ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-label font-medium text-ink-muted">
          {label}
          {tooltip && <InfoTip text={tooltip} />}
        </span>
        {counter && <CharCounter current={counter.current} max={counter.max} />}
      </div>
      {children}
      {hint && !tooltip && <p className="text-label leading-snug text-ink-faint">{hint}</p>}
    </div>
  )
}

export function CharCounter({ current, max }: { current: number; max: number }) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  const near = current > max * 0.85
  const over = current > max
  return (
    <span
      className={`font-mono text-micro tabular-nums ${
        over ? 'text-danger' : near ? 'text-warn' : 'text-ink-faint'
      }`}
      aria-label={tr.charCounterAria.replace('{current}', String(current)).replace('{max}', String(max))}
    >
      {current}/{max}
    </span>
  )
}

export function InfoTip({ text }: { text: string }) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  return (
    <RTooltip.Provider delayDuration={200}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>
          <button
            type="button"
            aria-label={tr.infoTipAria.replace('{text}', text)}
            className="rounded-full text-ink-faint transition hover:text-ink-muted"
          >
            <Info size={13} aria-hidden />
          </button>
        </RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content
            sideOffset={6}
            className="radix-tooltip z-50 max-w-64 px-3 py-2 text-label leading-relaxed text-ink"
          >
            {text}
            <RTooltip.Arrow className="fill-line-strong" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  )
}

/** tooltip ห่อสิ่งที่กดได้ — ใช้กับปุ่มไอคอนล้วนบน rail และ titlebar */
export function Tip({
  label,
  side = 'right',
  children,
}: {
  label: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  children: ReactNode
}) {
  return (
    <RTooltip.Provider delayDuration={300}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content
            side={side}
            sideOffset={8}
            className="radix-tooltip z-[90] max-w-56 px-2.5 py-1.5 text-label leading-snug text-ink"
          >
            {label}
            <RTooltip.Arrow className="fill-line-strong" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  )
}

/* ═════════════════════════ inputs ═════════════════════════ */

const INPUT_SIZE = {
  sm: 'h-[var(--control-sm)] px-2 text-label',
  md: 'h-[var(--control-md)] px-2.5 text-body',
  lg: 'h-[var(--control-lg)] px-3 text-body',
} as const

export function TextInput({
  size = 'md',
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <input
      {...props}
      className={`w-full rounded-btn border border-line-strong bg-canvas text-ink outline-none transition placeholder:text-ink-disabled hover:border-ink-faint focus:border-accent disabled:bg-raised disabled:text-ink-disabled ${INPUT_SIZE[size]} ${className ?? ''}`}
    />
  )
}

/** ปัดตามความละเอียดของ step — กันทศนิยมลอยจากการบวกซ้ำ */
function round(v: number, step: number) {
  const dec = (String(step).split('.')[1] ?? '').length
  return Number(v.toFixed(dec))
}

/** ช่องตัวเลขมีปุ่มเพิ่ม/ลด และรับ scroll — คู่กับทุก slider (ข้อ 6.3) */
export function NumberInput({
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
  ariaLabel,
  size = 'sm',
  className,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  suffix?: string
  ariaLabel: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const [text, setText] = useState(() => String(round(value, step)))
  useEffect(() => setText(String(round(value, step))), [value, step])

  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const commit = (raw: string) => {
    const n = Number(raw.replace(/[^\d.+-]/g, ''))
    if (Number.isFinite(n) && raw.trim() !== '') onChange(clamp(round(n, step)))
    else setText(String(round(value, step)))
  }

  const h = size === 'sm' ? 'h-[var(--control-sm)]' : 'h-[var(--control-md)]'
  return (
    <div
      className={`inline-flex ${h} shrink-0 items-stretch overflow-hidden rounded-btn border border-line-strong bg-canvas ${className ?? ''}`}
    >
      <button
        type="button"
        aria-label={`${ariaLabel} −`}
        onClick={() => onChange(clamp(round(value - step, step)))}
        className="flex w-6 items-center justify-center text-ink-muted transition hover:bg-raised hover:text-ink"
      >
        <Minus size={11} aria-hidden />
      </button>
      <input
        value={text}
        aria-label={ariaLabel}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            onChange(clamp(round(value + step, step)))
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            onChange(clamp(round(value - step, step)))
          }
        }}
        className="w-11 min-w-0 border-x border-line bg-transparent text-center font-mono text-micro tabular-nums text-ink outline-none"
      />
      <button
        type="button"
        aria-label={`${ariaLabel} +`}
        onClick={() => onChange(clamp(round(value + step, step)))}
        className="flex w-6 items-center justify-center text-ink-muted transition hover:bg-raised hover:text-ink"
      >
        <Plus size={11} aria-hidden />
      </button>
      {suffix && (
        <span className="flex items-center pr-1.5 font-mono text-micro text-ink-faint" aria-hidden>
          {suffix}
        </span>
      )}
    </div>
  )
}

/** Select แบบ listbox/popover แทน native <select> — กันขยายทับ input ด้านล่าง */
export function SelectV2({
  value,
  onValueChange,
  items,
  ariaLabel,
  searchable,
  size = 'md',
}: {
  value: string
  onValueChange: (v: string) => void
  /** `fontFamily` draws that row (and the trigger, when selected) in the face itself */
  items: { value: string; label: string; fontFamily?: string }[]
  ariaLabel?: string
  /** รายการยาวเกินกว่าจะเลื่อนหา — เปิดช่องค้นหาไว้บนสุด (ข้อ 6.2) */
  searchable?: boolean
  size?: 'sm' | 'md'
}) {
  const [query, setQuery] = useState('')
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  const shown = useMemo(() => {
    if (!searchable || !query.trim()) return items
    const q = query.trim().toLowerCase()
    // ตัวที่เลือกอยู่ต้องคาไว้เสมอ ไม่งั้น Radix วาด trigger เป็นช่องว่าง
    return items.filter((i) => i.value === value || i.label.toLowerCase().includes(q))
  }, [items, query, searchable, value])

  return (
    <RSelect.Root value={value} onValueChange={onValueChange} onOpenChange={(o) => !o && setQuery('')}>
      <RSelect.Trigger
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 rounded-btn border border-line-strong bg-canvas text-ink outline-none transition hover:border-ink-faint focus:border-accent data-[placeholder]:text-ink-disabled ${INPUT_SIZE[size]}`}
      >
        <span className="min-w-0 truncate text-left">
          <RSelect.Value />
        </span>
        <RSelect.Icon>
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={4}
          className="radix-select-content z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden"
        >
          {searchable && (
            <div className="border-b border-line p-1.5">
              <div className="flex items-center gap-1.5 rounded-btn border border-line-strong bg-canvas px-2">
                <Search size={12} className="shrink-0 text-ink-faint" aria-hidden />
                <input
                  value={query}
                  autoFocus
                  aria-label={tr.searchLabel}
                  placeholder={tr.searchLabel}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="h-[var(--control-sm)] w-full min-w-0 bg-transparent text-label text-ink outline-none placeholder:text-ink-disabled"
                />
              </div>
            </div>
          )}
          <RSelect.Viewport className="p-1">
            {shown.map((it) => (
              <RSelect.Item
                key={it.value}
                value={it.value}
                className="flex cursor-pointer select-none items-center justify-between gap-2 rounded-btn px-2.5 py-2 text-body text-ink outline-none data-[highlighted]:bg-accent-soft data-[state=checked]:text-accent"
              >
                <RSelect.ItemText>
                  <span style={it.fontFamily ? { fontFamily: `"${it.fontFamily}", inherit` } : undefined}>
                    {it.label}
                  </span>
                </RSelect.ItemText>
                <RSelect.ItemIndicator>
                  <Check size={14} aria-hidden />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
            {shown.length === 0 && (
              <p className="px-2.5 py-3 text-center text-label text-ink-faint">{tr.searchEmpty}</p>
            )}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  icon,
  bare,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
  icon?: ReactNode
  /** สวิตช์เปล่าไม่มีกรอบ — สำหรับวางในแถวที่มีกรอบอยู่แล้ว */
  bare?: boolean
}) {
  const sw = (
    <RSwitch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="relative h-5 w-9 shrink-0 rounded-full border border-line-strong bg-line-strong transition data-[state=checked]:border-accent-strong data-[state=checked]:bg-accent-strong"
    >
      <RSwitch.Thumb className="block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-surface shadow-raised transition-transform duration-120 data-[state=checked]:translate-x-4" />
    </RSwitch.Root>
  )

  if (bare) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-body text-ink">{label}</span>
        {sw}
      </span>
    )
  }

  return (
    <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-card border border-line-strong bg-canvas px-3 py-2 text-left transition hover:bg-raised">
      <span className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="shrink-0 text-ink-muted" aria-hidden>
            {icon}
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-body text-ink">{label}</span>
          {hint && <span className="block text-label leading-snug text-ink-faint">{hint}</span>}
        </span>
      </span>
      {sw}
    </label>
  )
}

/* ═════════════════════════ buttons ═════════════════════════ */

const BTN_SIZE = {
  sm: 'min-h-[var(--control-sm)] px-2.5 text-label gap-1.5',
  md: 'min-h-[var(--control-md)] px-3 text-body gap-2',
  lg: 'min-h-[var(--control-lg)] px-4 text-body gap-2',
} as const

const BTN_ICON_ONLY = {
  sm: 'h-[var(--control-sm)] w-[var(--control-sm)] p-0 tap-min',
  md: 'h-[var(--control-md)] w-[var(--control-md)] p-0',
  lg: 'h-[var(--control-lg)] w-[var(--control-lg)] p-0',
} as const

const BTN_VARIANT = {
  default: 'border-line-strong bg-raised text-ink hover:bg-line active:brightness-95',
  primary: 'border-accent-strong bg-accent-strong text-on-accent hover:brightness-110 active:brightness-95',
  danger: 'border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 active:bg-danger/30',
  ghost: 'border-transparent bg-transparent text-ink-muted hover:bg-raised hover:text-ink active:bg-line',
} as const

export function Btn({
  variant = 'default',
  size = 'md',
  iconOnly,
  className,
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BTN_VARIANT
  size?: 'sm' | 'md' | 'lg'
  /** ปุ่มไอคอนล้วน — สี่เหลี่ยมจัตุรัส ต้องส่ง `aria-label` มาด้วย */
  iconOnly?: boolean
  loading?: boolean
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center rounded-btn border font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        iconOnly ? BTN_ICON_ONLY[size] : BTN_SIZE[size]
      } ${BTN_VARIANT[variant]} ${className ?? ''}`}
    >
      {loading && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

/**
 * ปุ่มไอคอนล้วนพร้อม tooltip — `label` เป็นทั้ง aria-label และข้อความ tooltip
 * จึงไม่มีทางลืมใส่ (ข้อ 9.5)
 */
export function IconButton({
  label,
  icon,
  side = 'bottom',
  size = 'md',
  variant = 'ghost',
  active,
  className,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  label: string
  icon: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  size?: 'sm' | 'md' | 'lg'
  variant?: keyof typeof BTN_VARIANT
  active?: boolean
}) {
  return (
    <Tip label={label} side={side}>
      <button
        type="button"
        aria-label={label}
        {...props}
        className={`inline-flex items-center justify-center rounded-btn border font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
          BTN_ICON_ONLY[size]
        } ${active ? 'border-transparent bg-accent-soft text-accent' : BTN_VARIANT[variant]} ${className ?? ''}`}
      >
        {icon}
      </button>
    </Tip>
  )
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" aria-hidden />
}

/* ═════════════════════════ หัวข้อ / accordion ═════════════════════════ */

/**
 * หัวข้อในแท็บ — `level` สร้างลำดับชั้นแทนที่จะตะโกนเท่ากันหมด (ข้อ 6.2)
 * ห้ามใช้สี accent กับหัวข้อ: accent สงวนไว้ให้ "สิ่งที่กำลังเลือกอยู่" (ข้อ 5.5.1)
 */
export function SectionTitle({
  children,
  right,
  level = 2,
}: {
  children: ReactNode
  right?: ReactNode
  level?: 1 | 2
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      {level === 1 ? (
        <h3 className="text-title font-semibold tracking-tight text-ink">{children}</h3>
      ) : (
        <h4 className="text-label font-semibold uppercase tracking-[0.1em] text-ink-faint">{children}</h4>
      )}
      {right}
    </div>
  )
}

export function AccordionSection({
  value,
  title,
  badge,
  children,
}: {
  value: string
  title: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <RAccordion.Item value={value} className="overflow-hidden rounded-card border border-line-strong bg-canvas">
      <RAccordion.Header>
        <RAccordion.Trigger className="group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-body font-medium text-ink outline-none transition hover:bg-raised">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">{title}</span>
            {badge}
          </span>
          <ChevronDown
            size={15}
            aria-hidden
            className="shrink-0 text-ink-muted transition-transform group-data-[state=open]:rotate-180"
          />
        </RAccordion.Trigger>
      </RAccordion.Header>
      <RAccordion.Content className="overflow-hidden data-[state=open]:anim-fade-in">
        <div className="border-t border-line px-3 pb-4 pt-3">{children}</div>
      </RAccordion.Content>
    </RAccordion.Item>
  )
}

export function AccordionGroup({
  single,
  defaultValue,
  children,
}: {
  /** เปิดได้ทีละอัน — ใช้ในแท็บ Template (ข้อ 8.3.2) */
  single?: boolean
  defaultValue?: string
  children: ReactNode
}) {
  if (single) {
    return (
      <RAccordion.Root type="single" collapsible defaultValue={defaultValue} className="space-y-2">
        {children}
      </RAccordion.Root>
    )
  }
  return (
    <RAccordion.Root type="multiple" className="space-y-2">
      {children}
    </RAccordion.Root>
  )
}

/* ═════════════════════════ segmented control ═════════════════════════ */

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  ariaLabel,
  full,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: ReactNode; disabled?: boolean }[]
  size?: 'sm' | 'md'
  ariaLabel: string
  full?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`${full ? 'flex w-full' : 'inline-flex'} rounded-full border border-line-strong bg-canvas p-0.5`}
    >
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`flex items-center justify-center gap-1.5 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              full ? 'flex-1' : ''
            } ${size === 'sm' ? 'px-2.5 py-1 text-label' : 'px-3 py-1.5 text-body'} ${
              active ? 'bg-accent-strong text-on-accent' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ═════════════════════════ badge ═════════════════════════ */

const BADGE_TONE = {
  neutral: 'bg-raised text-ink-muted border-line',
  ok: 'bg-ok/12 text-ok border-ok/30',
  warn: 'bg-warn/12 text-warn border-warn/30',
  special: 'bg-special/12 text-special border-special/30',
  danger: 'bg-danger/12 text-danger border-danger/30',
  accent: 'bg-accent-soft text-accent border-accent/30',
} as const

export function Badge({
  tone = 'neutral',
  size = 'md',
  children,
  className,
}: {
  tone?: keyof typeof BADGE_TONE
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium leading-4 ${
        size === 'sm' ? 'px-1.5 text-micro' : 'px-2 py-0.5 text-micro'
      } ${BADGE_TONE[tone]} ${className ?? ''}`}
    >
      {children}
    </span>
  )
}

/* ═════════════════════════ empty state ═════════════════════════ */

/** ไอคอน + ข้อความ + ปุ่มลงมือ — ที่ไหนที่ยังว่างต้องบอกว่าทำอะไรต่อ (ข้อ 6.3) */
export function EmptyState({
  icon,
  title,
  message,
  action,
  compact,
}: {
  icon: ReactNode
  title: string
  message?: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong bg-canvas text-center ${
        compact ? 'px-4 py-6' : 'px-4 py-8'
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-raised text-ink-muted" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="text-body font-medium text-ink">{title}</p>
        {message && <p className="mt-1 text-label leading-relaxed text-ink-faint">{message}</p>}
      </div>
      {action}
    </div>
  )
}

/* ═════════════════════════ slider ═════════════════════════ */

export function ValueSlider({
  value,
  min,
  max,
  step,
  onChange,
  format,
  ariaLabel,
  showInput,
  suffix,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  /** แสดงตัวเลขที่หัว thumb เอง */
  format: (v: number) => string
  ariaLabel: string
  /** ต่อ NumberInput ท้าย slider เพื่อพิมพ์ค่าเป๊ะได้ (ข้อ 6.2) */
  showInput?: boolean
  suffix?: string
}) {
  /**
   * ลาก slider ยิง event เร็วกว่าที่จอวาดทัน — หน่วงการเขียน store ไปที่เฟรมถัดไป
   * แต่ตัวเลขบน thumb อัปเดตทันทีจาก local state ผู้ใช้จึงไม่รู้สึกว่าหน่วง
   * (callback เก็บใน ref เพื่อให้ตัว throttle มี identity คงที่ ไม่ถูกสร้างใหม่ทุก render)
   */
  const cbRef = useRef(onChange)
  useEffect(() => {
    cbRef.current = onChange
  })
  const emit = useMemo(() => rafThrottle((v: number) => cbRef.current(v)), [])
  useEffect(() => emit.cancel, [emit])

  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])

  const slider = (
    <RSlider.Root
      value={[local]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => {
        setLocal(v)
        emit(v)
      }}
      onValueCommit={([v]) => {
        emit.cancel()
        cbRef.current(v)
      }}
      aria-label={ariaLabel}
      className="relative flex h-8 w-full min-w-0 flex-1 touch-none select-none items-center"
    >
      <RSlider.Track className="relative h-1.5 grow rounded-full bg-line-strong/40">
        <RSlider.Range className="absolute h-full rounded-full bg-accent" />
      </RSlider.Track>
      <RSlider.Thumb className="relative block h-4 w-4 rounded-full border-2 border-accent-strong bg-surface outline-none transition hover:scale-110">
        {!showInput && (
          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-micro tabular-nums text-ink">
            {format(local)}
          </span>
        )}
      </RSlider.Thumb>
    </RSlider.Root>
  )

  if (!showInput) return slider

  return (
    <div className="flex items-center gap-2">
      {slider}
      <NumberInput
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        ariaLabel={ariaLabel}
        suffix={suffix}
      />
    </div>
  )
}

/* ═════════════════════════ thumbnail grid ═════════════════════════ */

export interface ThumbItem {
  id: string
  label: string
  /** ภาพย่อที่สร้างไว้ล่วงหน้า — ไม่มีก็วาดกล่องตัวอักษรย่อแทน */
  thumb?: string
  /** ป้ายสไตล์ใช้กรอง เช่น notebook / ribbon / ticket */
  tags?: string[]
  badge?: string
}

/** กริดภาพย่อเลือกได้ + ตัวกรอง — แกลเลอรีเทมเพลต (ข้อ 4.2 / 6.3) */
export function ThumbGrid({
  items,
  value,
  onSelect,
  filters,
  allLabel,
  ariaLabel,
  columns = 2,
}: {
  items: ThumbItem[]
  value: string
  onSelect: (id: string) => void
  /** ป้ายกรอง: `{ id, label }` — `id` ต้องตรงกับ `tags` ของรายการ */
  filters?: { id: string; label: string }[]
  allLabel?: string
  ariaLabel: string
  columns?: 2 | 3
}) {
  const [filter, setFilter] = useState<string>('all')
  const shown = filter === 'all' ? items : items.filter((i) => i.tags?.includes(filter))

  return (
    <div className="space-y-2">
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Chip size="sm" active={filter === 'all'} onClick={() => setFilter('all')}>
            {allLabel ?? ariaLabel}
          </Chip>
          {filters.map((f) => (
            <Chip key={f.id} size="sm" active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
      )}
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
      >
        {shown.map((it) => {
          const active = it.id === value
          return (
            <button
              key={it.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(it.id)}
              className={`group overflow-hidden rounded-card border text-left transition ${
                active
                  ? 'border-accent bg-accent-soft shadow-raised'
                  : 'border-line-strong bg-canvas hover:bg-raised'
              }`}
            >
              <span className="stage-checker relative block aspect-video w-full overflow-hidden">
                {it.thumb ? (
                  <img
                    src={it.thumb}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-display text-head font-bold text-ink-disabled">
                    {it.label.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {active && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-on-accent">
                    <Check size={12} aria-hidden />
                  </span>
                )}
              </span>
              <span className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className={`min-w-0 truncate text-label ${active ? 'text-accent' : 'text-ink'}`}>
                  {it.label}
                </span>
                {it.badge && (
                  <Badge size="sm" tone="neutral">
                    {it.badge}
                  </Badge>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═════════════════════════ drop-zone + file ═════════════════════════ */

export function DropZone({
  onFile,
  accept = 'image/png,image/jpeg,image/webp',
  title,
  hint,
  compact,
}: {
  onFile: (f: File) => void
  accept?: string
  title: string
  hint?: string
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    if (!accept.split(',').includes(f.type)) {
      setError(tr.dropzoneUnsupported)
      return
    }
    setError(null)
    onFile(f)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-card border border-dashed text-center transition ${
        compact ? 'px-3 py-3' : 'px-4 py-6'
      } ${over ? 'border-accent bg-accent-soft' : 'border-line-strong bg-canvas'}`}
    >
      <Upload size={compact ? 16 : 20} className="text-ink-muted" aria-hidden />
      <p className="text-body text-ink">{title}</p>
      {hint && <p className="text-label text-ink-faint">{hint}</p>}
      {error && (
        <p role="alert" className="text-label font-medium text-danger">
          {error}
        </p>
      )}
      <Btn size="sm" onClick={() => inputRef.current?.click()}>
        {tr.chooseFileBtn}
      </Btn>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}

export function FileButton({
  accept = 'image/*',
  onFile,
  children,
}: {
  accept?: string
  onFile: (f: File) => void
  children: ReactNode
}) {
  return (
    <label className="inline-flex min-h-[var(--control-md)] cursor-pointer items-center gap-2 rounded-btn border border-line-strong bg-raised px-3 text-body text-ink transition hover:bg-line">
      {children}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.currentTarget.value = ''
        }}
      />
    </label>
  )
}

export function Chip({
  active,
  onClick,
  size = 'md',
  disabled,
  title,
  children,
}: {
  active?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
  disabled?: boolean
  title?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={`rounded-full border font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        size === 'sm' ? 'min-h-[var(--control-sm)] px-2.5 text-micro' : 'min-h-[var(--control-md)] px-3 text-label'
      } ${
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line-strong bg-canvas text-ink-muted hover:bg-raised hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

/* ═════════════════════════ confirm ═════════════════════════ */

/**
 * ปุ่มที่ต้องกดสองครั้งถึงจะทำ — กันลบพลาดโดยไม่ต้องเปิด modal (ข้อ 8.6.4)
 * ครั้งแรกเปลี่ยนเป็นข้อความยืนยัน ปล่อยไว้ 4 วินาทีแล้วคืนสภาพเดิม
 */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel,
  icon,
  size = 'sm',
  className,
}: {
  onConfirm: () => void
  label: string
  confirmLabel: string
  icon?: ReactNode
  size?: 'sm' | 'md'
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return (
    <Btn
      variant="danger"
      size={size}
      className={className}
      title={armed ? confirmLabel : label}
      aria-label={armed ? confirmLabel : label}
      onClick={() => {
        if (armed) {
          if (timer.current) clearTimeout(timer.current)
          setArmed(false)
          onConfirm()
          return
        }
        setArmed(true)
        timer.current = setTimeout(() => setArmed(false), 4000)
      }}
    >
      {armed ? (
        <>
          <Check size={12} aria-hidden /> {confirmLabel}
        </>
      ) : (
        (icon ?? <X size={12} aria-hidden />)
      )}
    </Btn>
  )
}
