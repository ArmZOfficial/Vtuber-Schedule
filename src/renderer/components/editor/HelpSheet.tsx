/**
 * แผ่นช่วยเหลือ + คีย์ลัด (แผนข้อ 7.3.4 / เฟส 5)
 *
 * ของบังคับ ไม่ใช่ของเสริม เพราะแอปนี้จะขาย ผู้ใช้จะไม่มีใครสอน ปุ่ม Help บน rail
 * เคยไม่มี onClick มาก่อน — ตอนนี้เปิดแผ่นนี้จริง
 */
import * as RDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useScheduleStore } from '../../store/scheduleStore'
import { useTranslation } from '../../i18n/translations'
import { Btn } from './ui'

function Keys({ combo }: { combo: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {combo.split('+').map((k) => (
        <kbd
          key={k}
          className="rounded-btn border border-line-strong bg-canvas px-1.5 py-0.5 font-mono text-micro text-ink-muted"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}

export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  const shortcuts: { combo: string; label: string }[] = [
    { combo: 'Ctrl+Z', label: tr.kbdUndo },
    { combo: 'Ctrl+Shift+Z', label: tr.kbdRedo },
    { combo: 'Ctrl+S', label: tr.kbdSaveDraft },
    { combo: 'Ctrl+E', label: tr.kbdExport },
    { combo: 'Ctrl+1…6', label: tr.kbdTabs },
    { combo: 'Ctrl+0', label: tr.kbdFit },
    { combo: 'Ctrl+Alt+1', label: tr.kbdActual },
    { combo: 'Space+Drag', label: tr.kbdPan },
    { combo: 'Ctrl+Wheel', label: tr.kbdZoom },
    { combo: 'Esc', label: tr.kbdCloseDay },
    { combo: 'Ctrl+Enter', label: tr.kbdNextDay },
  ]

  return (
    <RDialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[70] bg-ink/40" />
        <RDialog.Content
          aria-describedby={undefined}
          className="anim-sheet-up fixed left-1/2 top-1/2 z-[75] flex max-h-[85vh] w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-panel border border-line-strong bg-surface shadow-overlay"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
            <RDialog.Title className="text-title font-semibold text-ink">{tr.helpTitle}</RDialog.Title>
            <Btn variant="ghost" size="sm" iconOnly aria-label={tr.closeBtn} onClick={onClose}>
              <X size={15} aria-hidden />
            </Btn>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <section>
              <h3 className="mb-1 text-body font-semibold text-ink">{tr.helpFlowTitle}</h3>
              <p className="text-body leading-relaxed text-ink-muted">{tr.helpFlowSteps}</p>
            </section>

            <section>
              <h3 className="mb-2 text-body font-semibold text-ink">{tr.helpShortcutsTitle}</h3>
              <ul className="divide-y divide-line rounded-card border border-line">
                {shortcuts.map((s) => (
                  <li key={s.combo} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 text-body text-ink-muted">{s.label}</span>
                    <Keys combo={s.combo} />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="flex shrink-0 justify-end border-t border-line bg-canvas px-4 py-3">
            <Btn variant="primary" onClick={onClose}>
              {tr.doneBtn}
            </Btn>
          </div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}
