import { create } from 'zustand'
import { Check, Info, X } from 'lucide-react'
import { useScheduleStore } from '../../store/scheduleStore'
import { useTranslation } from '../../i18n/translations'

/**
 * Toast แจ้งผล — slide-in จากบน 250ms ค้าง 3s แล้ว fade out (สเปคข้อ 7.3)
 * microcopy: toast พูดคำเดียวกับปุ่มที่กด (ข้อ 10.1)
 */

interface ToastItem {
  id: number
  msg: string
  tone: 'ok' | 'info'
  leaving: boolean
}

interface ToastStore {
  items: ToastItem[]
  push: (msg: string, tone?: 'ok' | 'info') => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (msg, tone = 'ok') => {
    const id = nextId++
    set((s) => ({ items: [...s.items.slice(-2), { id, msg, tone, leaving: false }] }))
    setTimeout(() => {
      set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, leaving: true } : t)) }))
      setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 220)
    }, 3000)
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

export const toast = (msg: string, tone: 'ok' | 'info' = 'ok') =>
  useToastStore.getState().push(msg, tone)

function ToastRow({ item }: { item: ToastItem }) {
  const { dismiss } = useToastStore()
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-center gap-2.5 rounded-panel border border-line-strong bg-surface px-4 py-2.5 shadow-overlay ${
        item.leaving ? 'anim-toast-out' : 'anim-toast-in'
      }`}
    >
      {item.tone === 'ok' ? (
        <Check size={15} className="shrink-0 text-ok" aria-hidden />
      ) : (
        <Info size={15} className="shrink-0 text-accent" aria-hidden />
      )}
      <p className="text-body text-ink">{item.msg}</p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label={tr.closeNotification}
        className="ml-1 shrink-0 rounded-full p-1 text-ink-muted transition hover:bg-raised hover:text-ink"
      >
        <X size={13} aria-hidden />
      </button>
    </div>
  )
}

export function Toaster() {
  const items = useToastStore((s) => s.items)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-12 z-[80] flex flex-col items-center gap-2 px-4"
    >
      {items.map((t) => (
        <ToastRow key={t.id} item={t} />
      ))}
    </div>
  )
}
