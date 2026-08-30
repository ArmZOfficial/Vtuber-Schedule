/**
 * พื้นที่พรีวิว — ส่วนที่เปลี่ยนเยอะที่สุดในแผน (ข้อ 7.5)
 *
 *  · แถบบน: ขนาด output · ภาษาการ์ด · ปุ่ม Export หลัก — สามอย่างหลังชิดขวาด้วยกัน
 *    ภาษา "แอป" ย้ายขึ้นไปอยู่บน titlebar เป็นปุ่มรูปลูกโลกข้างปุ่มธีมแล้ว เพราะการเอา
 *    สองสวิตช์ภาษามาวางติดกันกลางแถบทำให้แยกไม่ออกว่าอันไหนเปลี่ยนอะไร
 *    (เจ้าของงานสั่งเปลี่ยน 26 ส.ค. 2026)
 *  · พื้นโรงถ่าย `sunken` + ตารางหมากรุกรอบการ์ด + เงา `--shadow-stage` ใต้การ์ด
 *  · HUD ซูมมุมขวาล่าง: − % + และปุ่มพอดีจอ
 *
 * `ScheduleStage` ยังรับ prop `previewScale` แบบเดิมเป๊ะ — การซูมทั้งหมดทำที่ชั้นนี้
 * กล่องที่วัดขนาด (`viewportRef`) กับกล่องที่ถูก transform แยกกันคนละใบ ไม่งั้น
 * ResizeObserver จะวัดกล่องที่ตัวเองเพิ่งขยับแล้ววนซ้ำ (ความเสี่ยงข้อ 12.4)
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import { Download, Maximize2, Minus, MousePointerClick, Plus, Ruler } from 'lucide-react'
import { ScheduleStage } from '../canvas/ScheduleStage'
import { ErrorBoundary } from '../ErrorBoundary'
import { useScheduleStore } from '../../store/scheduleStore'
import { getTemplate } from '../../template/layout.schema'
import { LANG_NAME } from '../../data/labels'
import type { Lang } from '../../types'
import { useTranslation } from '../../i18n/translations'
import { rafThrottle } from '../../utils/rafThrottle'
import { clampZoom, fitScale, quantizeScale, stepZoom } from '../../utils/zoom'
import { Btn, IconButton, NumberInput, SegmentedControl, Toolbar } from './ui'
import { useExporter } from './useExporter'

const SAFE_AREA_INSET = '4%'

export function StageArea({ stageRef }: { stageRef: React.RefObject<Konva.Stage | null> }) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const cardLanguage = useScheduleStore((s) => s.meta.language)
  const setMeta = useScheduleStore((s) => s.setMeta)
  const templateId = useScheduleStore((s) => s.meta.templateId)
  const tr = useTranslation(uiLanguage)

  const canvas = getTemplate(templateId ?? '').canvas
  const exporter = useExporter(stageRef)
  const [safeArea, setSafeArea] = useState(false)

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-canvas">
      <Toolbar
        className="bg-canvas"
        left={
          <>
            <span className="font-mono text-micro tabular-nums text-ink-faint">
              {exporter.width}×{exporter.height}
            </span>
            <span className="hidden items-center gap-1.5 text-micro text-ink-faint lg:flex">
              <MousePointerClick size={12} aria-hidden />
              {tr.clickRowHint}
            </span>
          </>
        }
        right={
          <>
            {/* ภาษาที่จะ "พิมพ์ลงการ์ด" — คนละเรื่องกับภาษาเมนู ป้ายกำกับจึงต้องมี */}
            <label className="flex items-center gap-1.5">
              <span className="text-micro text-ink-faint">{tr.cardLangGroup}</span>
              <SegmentedControl<Lang>
                size="sm"
                ariaLabel={tr.cardLanguageLabel}
                value={cardLanguage}
                onChange={(l) => setMeta({ language: l })}
                options={(Object.keys(LANG_NAME) as Lang[]).map((l) => ({
                  value: l,
                  label: l.toUpperCase(),
                }))}
              />
            </label>
            <span aria-hidden className="mx-0.5 h-5 w-px bg-line" />
            <IconButton
              label={tr.safeAreaToggle}
              side="bottom"
              size="sm"
              active={safeArea}
              onClick={() => setSafeArea((v) => !v)}
              icon={<Ruler size={14} />}
            />
            <Btn
              variant="primary"
              size="sm"
              loading={exporter.busy}
              onClick={() => void exporter.doExport()}
            >
              {!exporter.busy && <Download size={14} aria-hidden />}
              {tr.exportNowBtn}
            </Btn>
          </>
        }
      />

      {exporter.progress && (
        <div className="shrink-0 border-b border-line bg-surface px-4 py-1.5">
          <div className="mb-1 flex justify-between text-micro text-ink-muted">
            <span>{exporter.progress.phase}…</span>
            <span className="font-mono tabular-nums">{Math.round(exporter.progress.pct * 100)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${exporter.progress.pct * 100}%` }}
            />
          </div>
        </div>
      )}

      <StageViewport
        stageRef={stageRef}
        stageW={canvas.w}
        stageH={canvas.h}
        safeArea={safeArea}
      />
    </main>
  )
}

/* ═════════════════════════ viewport + zoom ═════════════════════════ */

function StageViewport({
  stageRef,
  stageW,
  stageH,
  safeArea,
}: {
  stageRef: React.RefObject<Konva.Stage | null>
  stageW: number
  stageH: number
  safeArea: boolean
}) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  const viewportRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  /**
   * ResizeObserver ยิงทุกพิกเซลที่ลากขอบหน้าต่าง — เขียน state ทุกครั้งคือ re-render
   * ทั้ง stage หลายสิบครั้งต่อวินาที ตัวนี้ยุบให้เหลือครั้งเดียวต่อเฟรมแล้วปัดเป็น
   * จำนวนเต็มพิกเซล ขนาดที่ต่างกันไม่ถึงพิกเซลจึงไม่สั่งวาดใหม่เลย
   */
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const apply = rafThrottle((w: number, h: number) =>
      setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h })),
    )
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      apply(Math.round(r.width), Math.round(r.height))
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      apply.cancel()
    }
  }, [])

  /** `null` = โหมดพอดีจอ · ตัวเลข = ซูมที่ผู้ใช้ตั้งเอง */
  const [manualZoom, setManualZoom] = useState<number | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const fit = fitScale(box.w, box.h, stageW, stageH)
  const scale = quantizeScale(manualZoom ?? fit)

  const resetView = useCallback(() => {
    setManualZoom(null)
    setPan({ x: 0, y: 0 })
  }, [])

  const zoomTo = useCallback(
    (next: number) => {
      setManualZoom(clampZoom(next))
    },
    [],
  )

  // ── คีย์ลัด: Ctrl+0 พอดีจอ · Ctrl+Alt+1 ขนาดจริง ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === '0') {
        e.preventDefault()
        resetView()
      }
      if (e.altKey && e.key === '1') {
        e.preventDefault()
        setPan({ x: 0, y: 0 })
        zoomTo(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [resetView, zoomTo])

  // ── Space ค้าง = โหมดเลื่อน ──
  const [spaceDown, setSpaceDown] = useState(false)
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      ['INPUT', 'TEXTAREA', 'SELECT'].includes((t as HTMLElement | null)?.tagName ?? '')
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isTyping(e.target)) return
      e.preventDefault()
      setSpaceDown(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    const blur = () => setSpaceDown(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  // ── ลากเพื่อเลื่อน (Space+ลาก หรือปุ่มกลาง) ──
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!spaceDown && e.button !== 1) return
    e.preventDefault()
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) })
  }
  const endDrag = () => {
    drag.current = null
  }

  // ── Ctrl+ล้อ = ซูม · ล้อเปล่า = เลื่อน ──
  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      zoomTo(stepZoom(scale, e.deltaY < 0 ? 1 : -1))
      return
    }
    if (manualZoom === null) return
    setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
  }

  const cardW = Math.round(stageW * scale)
  const cardH = Math.round(stageH * scale)

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      className={`relative min-h-0 flex-1 overflow-hidden bg-sunken ${
        spaceDown ? (drag.current ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
    >
      {/* กล่องที่ถูก transform แยกจากกล่องที่วัดขนาดด้านบน */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))` }}
      >
        <div
          className="stage-checker relative shadow-stage"
          style={{ width: cardW, height: cardH }}
        >
          <ErrorBoundary>
            <ScheduleStage ref={stageRef} previewScale={scale} />
          </ErrorBoundary>
          {safeArea && (
            <div
              aria-hidden
              className="stage-safe-area pointer-events-none absolute"
              style={{ inset: SAFE_AREA_INSET }}
            />
          )}
        </div>
      </div>

      {/* HUD ซูม */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
        <span className="hidden rounded-full border border-line bg-surface/90 px-2.5 py-1 text-micro text-ink-faint xl:inline">
          {tr.panHint}
        </span>
        <div className="pointer-events-auto ml-auto flex items-center gap-1 rounded-full border border-line-strong bg-surface p-1 shadow-overlay">
          <IconButton
            label={tr.zoomOut}
            side="top"
            size="sm"
            onClick={() => zoomTo(stepZoom(scale, -1))}
            icon={<Minus size={14} />}
          />
          <NumberInput
            value={Math.round(scale * 100)}
            min={10}
            max={400}
            step={5}
            suffix="%"
            ariaLabel={tr.zoomFieldAria}
            onChange={(v) => zoomTo(v / 100)}
          />
          <IconButton
            label={tr.zoomIn}
            side="top"
            size="sm"
            onClick={() => zoomTo(stepZoom(scale, 1))}
            icon={<Plus size={14} />}
          />
          <IconButton
            label={tr.zoomFit}
            side="top"
            size="sm"
            active={manualZoom === null}
            onClick={resetView}
            icon={<Maximize2 size={14} />}
          />
        </div>
      </div>
    </div>
  )
}
