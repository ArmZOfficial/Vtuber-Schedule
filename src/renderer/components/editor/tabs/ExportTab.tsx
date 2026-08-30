/**
 * แท็บส่งออก (แผนข้อ 8.5)
 *
 *  · preset เป็นการ์ดเลือกที่บอกขนาดจริงและอัตราส่วน ไม่ใช่ dropdown
 *  · ปุ่ม export หลักอยู่บนแถบพรีวิว (ข้อ 7.5.1) ในแท็บเหลือแค่ตัวเลือก + ปุ่มสำรอง
 *  · ค่าที่เลือกครั้งล่าสุดถูกจำไว้เป็นค่าเริ่มต้นครั้งถัดไป (`useExporter`)
 */
import type Konva from 'konva'
import { Check, Download, Film, FolderOpen, Image as ImageIcon } from 'lucide-react'
import { useScheduleStore } from '../../../store/scheduleStore'
import { RESOLUTION_PRESETS } from '../../../utils/layout'
import { Btn, SectionTitle, SegmentedControl, Toggle } from '../ui'
import { useExporter, type ExportFormat } from '../useExporter'
import { useTranslation } from '../../../i18n/translations'

export function ExportTab({ stageRef }: { stageRef: React.RefObject<Konva.Stage | null> }) {
  const setExportSettings = useScheduleStore((s) => s.setExportSettings)
  const anim = useScheduleStore((s) => s.animation)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  const ex = useExporter(stageRef)

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle>{tr.exportSizeTitle}</SectionTitle>
        <div className="space-y-1.5" role="radiogroup" aria-label={tr.exportSizeTitle}>
          {RESOLUTION_PRESETS.map((p) => {
            const active = ex.presetId === p.id
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setExportSettings({ presetId: p.id })}
                className={`flex w-full items-center gap-3 rounded-card border px-3 py-2 text-left transition ${
                  active ? 'border-accent bg-accent-soft' : 'border-line-strong bg-canvas hover:bg-raised'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block text-body font-semibold ${active ? 'text-accent' : 'text-ink'}`}>
                    {p.name}
                    <span className="ml-1.5 font-mono text-micro font-normal tabular-nums text-ink-faint">
                      {p.w}×{p.h} · {p.hint}
                    </span>
                  </span>
                  <span className="block truncate text-label text-ink-faint">
                    {uiLanguage === 'th' ? p.hintLocal.th : p.hintLocal.en}
                  </span>
                </span>
                {active && <Check size={15} className="shrink-0 text-accent" aria-hidden />}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <SectionTitle>{tr.fileFormat}</SectionTitle>
        <SegmentedControl<ExportFormat>
          full
          value={ex.format}
          onChange={ex.setFormat}
          ariaLabel={tr.fileFormat}
          options={[
            { value: 'png', label: 'PNG', icon: <ImageIcon size={14} aria-hidden /> },
            { value: 'gif', label: 'GIF', icon: <Film size={14} aria-hidden /> },
          ]}
        />
      </section>

      {ex.format === 'png' ? (
        <Toggle checked={ex.batch} onChange={ex.setBatch} label={tr.batchLabel} />
      ) : (
        <p className="rounded-card border border-line bg-canvas p-2.5 text-label leading-relaxed text-ink-muted">
          {tr.gifHint
            .replace('{frames}', String(Math.round((anim.durationMs / 1000) * 12)))
            .replace('{size}', `${ex.width}×${ex.height}`)}
        </p>
      )}

      <div className="space-y-2">
        <Btn
          variant="primary"
          size="lg"
          className="w-full"
          disabled={ex.busy}
          loading={ex.busy}
          onClick={() => void ex.doExport()}
        >
          {!ex.busy && <Download size={15} aria-hidden />}
          {ex.busy ? tr.exportingMsg : `${tr.exportBtn} ${ex.format.toUpperCase()} ${ex.width}×${ex.height}`}
        </Btn>

        {ex.format === 'png' && (
          <Btn className="w-full" disabled={ex.busy} onClick={() => void ex.doBatchAllRatios()}>
            <Download size={14} aria-hidden />
            {tr.exportAllSizes}
          </Btn>
        )}
      </div>

      {ex.progress && (
        <div>
          <div className="mb-1 flex justify-between text-micro text-ink-muted">
            <span>{ex.progress.phase}…</span>
            <span className="font-mono tabular-nums">{Math.round(ex.progress.pct * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-accent transition-all" style={{ width: `${ex.progress.pct * 100}%` }} />
          </div>
        </div>
      )}

      {/* เส้นทางไฟล์ที่เพิ่งเซฟ + ทางไปหามัน (แผนข้อ 8.5.4)
          โชว์เฉพาะตอนที่รู้ path จริง ๆ ในเบราว์เซอร์จะไม่มีทางรู้จึงไม่โชว์ */}
      {!ex.busy && ex.lastSaved && (
        <div className="rounded-card border border-line bg-canvas p-3">
          <p className="text-label font-medium text-ink">{tr.exportSavedLabel}</p>
          <p
            title={ex.lastSaved}
            className="mt-0.5 truncate font-mono text-micro text-ink-faint"
            dir="rtl"
          >
            {ex.lastSaved}
          </p>
          {ex.canRevealFile && (
            <Btn size="sm" className="mt-2 w-full" onClick={ex.revealLastSaved}>
              <FolderOpen size={13} aria-hidden />
              {tr.openFolderBtn}
            </Btn>
          )}
        </div>
      )}
    </div>
  )
}
