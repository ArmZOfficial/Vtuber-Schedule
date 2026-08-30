/**
 * หน้าจอเปิดครั้งแรก (แผนเฟส 5.1)
 *
 * ของบังคับ ไม่ใช่ของเสริม: แอปนี้จะขาย ผู้ใช้จะไม่มีคนสอน เปิดมาต้องเจอทางเริ่ม
 * ไม่ใช่ฟอร์มเปล่า การ์ดที่เห็นข้างหลังคือของจริงที่เติมสัปดาห์นี้ให้แล้ว จึงกด
 * "ใช้อันเดิมต่อ" แล้ว export ได้ทันที
 */
import { useState } from 'react'
import * as RDialog from '@radix-ui/react-dialog'
import { LayoutTemplate } from 'lucide-react'
import { useScheduleStore } from '../../store/scheduleStore'
import { useTranslation } from '../../i18n/translations'
import { Btn } from './ui'

const SEEN_KEY = 'vsg:firstRunDone'

export function FirstRunSheet({ onPickTemplate }: { onPickTemplate: () => void }) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  const [open, setOpen] = useState(() => localStorage.getItem(SEEN_KEY) !== '1')

  const close = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setOpen(false)
  }

  if (!open) return null

  return (
    <RDialog.Root open onOpenChange={(o) => !o && close()}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[70] bg-ink/40" />
        <RDialog.Content
          aria-describedby={undefined}
          className="anim-sheet-up fixed left-1/2 top-1/2 z-[75] w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-panel border border-line-strong bg-surface p-6 text-center shadow-overlay"
        >
          <span
            aria-hidden
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent"
          >
            <LayoutTemplate size={22} />
          </span>
          <RDialog.Title className="text-head font-semibold tracking-tight text-ink">
            {tr.firstRunTitle}
          </RDialog.Title>
          <p className="mt-2 text-body leading-relaxed text-ink-muted">{tr.firstRunMsg}</p>
          <div className="mt-5 flex flex-col gap-2">
            <Btn
              variant="primary"
              size="lg"
              onClick={() => {
                onPickTemplate()
                close()
              }}
            >
              {tr.firstRunCta}
            </Btn>
            <Btn variant="ghost" onClick={close}>
              {tr.firstRunSkip}
            </Btn>
          </div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}
