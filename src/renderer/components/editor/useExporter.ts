/**
 * ตรรกะการส่งออกที่แท็บ Export กับปุ่ม Export บนแถบพรีวิวใช้ร่วมกัน
 *
 * ปุ่มหลักย้ายขึ้นไปอยู่บนแถบพรีวิวให้เห็นตลอดเวลา (แผนข้อ 7.5.1) ส่วนแท็บเหลือแค่
 * ตัวเลือก การมีสองที่กดได้จึงต้องใช้โค้ดชุดเดียว ไม่ใช่เขียนซ้ำสองชุด
 *
 * ไฟล์นี้อยู่ฝั่ง component ตั้งใจ — `export/exporter.ts` แตะได้เฉพาะการ "เพิ่มของใหม่"
 * ตอนนี้ตัวช่วยเซฟคืน path ของไฟล์ที่เขียนสำเร็จกลับมา เพื่อให้โชว์ปุ่มเปิดโฟลเดอร์ได้
 */
import { useCallback, useEffect, useState } from 'react'
import type Konva from 'konva'
import { useScheduleStore } from '../../store/scheduleStore'
import { RESOLUTION_PRESETS, exportDims, normalizePresetId } from '../../utils/layout'
import { monthRangeLabel, weekDays, weekRangeLabel } from '../../utils/date'
import {
  capturePNG,
  downloadBlob,
  downloadURL,
  ensureFontsReady,
  exportGIF,
  nextPaint,
  safeName,
  saveImagesBatch,
  withFullResolution,
} from '../../export/exporter'
import type { Lang } from '../../types'
import { useTranslation } from '../../i18n/translations'
import { toast } from './toast'

export type ExportFormat = 'png' | 'gif'

export interface ExportProgress {
  pct: number
  phase: string
}

const FORMAT_KEY = 'vsg:exportFormat'
const BATCH_KEY = 'vsg:exportBatch'

/** ค่าที่เลือกครั้งล่าสุดกลายเป็นค่าเริ่มต้นครั้งถัดไป (แผนข้อ 8.5.5) */
function readStored<T extends string>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  return (localStorage.getItem(key) as T | null) ?? fallback
}

export function useExporter(stageRef: React.RefObject<Konva.Stage | null>) {
  const exportSettings = useScheduleStore((s) => s.exportSettings)
  const setExportSettings = useScheduleStore((s) => s.setExportSettings)
  const meta = useScheduleStore((s) => s.meta)
  const setMeta = useScheduleStore((s) => s.setMeta)
  const selectDay = useScheduleStore((s) => s.selectDay)
  const setExporting = useScheduleStore((s) => s.setExporting)
  const anim = useScheduleStore((s) => s.animation)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  const [format, setFormatState] = useState<ExportFormat>(() => readStored<ExportFormat>(FORMAT_KEY, 'png'))
  const [batch, setBatchState] = useState(() => readStored<string>(BATCH_KEY, '0') === '1')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  /**
   * ไฟล์ล่าสุดที่เขียนสำเร็จ — ว่างเมื่อผู้ใช้ยกเลิก หรือเมื่อรันในเบราว์เซอร์
   * ซึ่งไม่มีทางรู้ปลายทาง จึงต้องเช็คก่อนโชว์ปุ่มเปิดโฟลเดอร์เสมอ (แผนข้อ 8.5.4)
   */
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const setFormat = useCallback((f: ExportFormat) => {
    setFormatState(f)
    localStorage.setItem(FORMAT_KEY, f)
  }, [])

  const setBatch = useCallback((b: boolean) => {
    setBatchState(b)
    localStorage.setItem(BATCH_KEY, b ? '1' : '0')
  }, [])

  // ปิด flag exporting ทิ้งไว้ไม่ได้ ถ้า component ถูกถอดกลางคัน
  useEffect(() => () => setExporting(false), [setExporting])

  const presetId = normalizePresetId(exportSettings.presetId)
  const { W, H } = exportDims(presetId)

  const baseName = useCallback(() => {
    const dates = weekDays(meta.startDate)
    return `schedule_${safeName(monthRangeLabel(dates[0], dates[6], 'en'))}${weekRangeLabel(dates[0], dates[6])}`
  }, [meta.startDate])

  const doExport = useCallback(async () => {
    const stage = stageRef.current
    if (!stage || busy) return
    selectDay(null)
    setBusy(true)
    try {
      await ensureFontsReady()
      await nextPaint()
      await withFullResolution(stage, W, H, async () => {
        if (format === 'png') {
          const langs: Lang[] = batch ? ['th', 'en', 'jp'] : [meta.language]
          const orig = meta.language
          try {
            // จับภาพทุกภาษาก่อน แล้วเซฟครั้งเดียว (batch = เลือกโฟลเดอร์ 1 ครั้ง ไม่เด้ง dialog 3 รอบ)
            const files: { url: string; filename: string }[] = []
            for (const l of langs) {
              if (batch) {
                setMeta({ language: l })
                await nextPaint()
              }
              files.push({
                url: await capturePNG(stage, { pixelRatio: 1 }),
                filename: `${baseName()}_${l}_${W}x${H}.png`,
              })
            }
            const saved =
              files.length === 1
                ? await downloadURL(files[0].url, files[0].filename)
                : await saveImagesBatch(files)
            setLastSaved(saved ?? null)
            toast(tr.exportDoneMsg.replace('{count}', String(files.length)))
          } finally {
            if (batch) {
              setMeta({ language: orig })
              await nextPaint()
            }
          }
        } else {
          setExporting(true)
          try {
            const blob = await exportGIF(stage, {
              anim,
              width: W,
              height: H,
              onProgress: (pct, phase) =>
                setProgress({ pct, phase: phase === 'capture' ? tr.gifCapturing : tr.gifEncoding }),
            })
            const saved = await downloadBlob(blob, `${baseName()}_${meta.language}_${W}x${H}.gif`)
            setLastSaved(saved ?? null)
            toast(tr.exportDoneMsg.replace('{count}', '1'))
          } finally {
            setExporting(false)
          }
        }
      })
    } catch (err) {
      console.error('Export failed:', err)
      toast(tr.exportFailed, 'info')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }, [anim, baseName, batch, busy, format, H, meta.language, selectDay, setExporting, setMeta, stageRef, tr, W])

  const doBatchAllRatios = useCallback(async () => {
    const stage = stageRef.current
    if (!stage || busy) return
    selectDay(null)
    setBusy(true)
    const origPreset = exportSettings.presetId
    try {
      await ensureFontsReady()
      await nextPaint()
      const files: { url: string; filename: string }[] = []
      for (const r of RESOLUTION_PRESETS) {
        setExportSettings({ presetId: r.id })
        await nextPaint()
        const dims = exportDims(r.id)
        const url = await withFullResolution(stage, dims.W, dims.H, () => capturePNG(stage, { pixelRatio: 1 }))
        files.push({ url, filename: `${baseName()}_${dims.W}x${dims.H}.png` })
        setProgress({ pct: files.length / RESOLUTION_PRESETS.length, phase: tr.exportingMsg })
      }
      setLastSaved((await saveImagesBatch(files)) ?? null)
      toast(tr.exportDoneMsg.replace('{count}', String(files.length)))
    } catch (err) {
      console.error('Batch export failed:', err)
      toast(tr.exportFailed, 'info')
    } finally {
      setExportSettings({ presetId: origPreset })
      setBusy(false)
      setProgress(null)
    }
  }, [baseName, busy, exportSettings.presetId, selectDay, setExportSettings, stageRef, tr])

  return {
    format,
    setFormat,
    batch,
    setBatch,
    busy,
    progress,
    presetId,
    width: W,
    height: H,
    doExport,
    doBatchAllRatios,
    lastSaved,
    canRevealFile: typeof window !== 'undefined' && !!window.api?.shell?.showItemInFolder,
    revealLastSaved: () => {
      if (lastSaved) window.api?.shell?.showItemInFolder(lastSaved)
    },
  }
}
