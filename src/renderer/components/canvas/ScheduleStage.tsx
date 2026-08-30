/**
 * The canvas — composed live from template assets plus the current schedule data,
 * never a pre-baked picture, so an edit shows up on the next frame.
 *
 * The stage always works in the template's own coordinate space (4001x2251 for the
 * Sakura Diary PSD) and is scaled down for the preview, so what is on screen and
 * what gets exported are the same composition at different resolutions.
 */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import type Konva from 'konva'
import { useShallow } from 'zustand/react/shallow'
import { useScheduleStore } from '../../store/scheduleStore'
import { useThemeStore, resolvePalette, resolveTint } from '../../store/themeStore'
import { useTextStyleStore } from '../../store/textStyleStore'
import { useFontsReady } from '../../store/fontsReady'
import { getTemplate } from '../../template/layout.schema'
import { BackgroundLayer, DesignCredit } from './BackgroundLayer'
import { ArtFrameGroup } from './ArtFrameGroup'
import { SchedulePanel } from './SchedulePanel'
import type { DayRowData } from './DayRow'
import { withPin, type ArtTints, type Tint } from './TintedImage'
import { setTintScale, tintBackend } from '../../utils/tintEngine'
import { PREVIEW_CACHE_NAME } from '../../export/exporter'
import { DAY_FULL } from '../../data/labels'
import { formatTime, weekDays } from '../../utils/date'
import { DEFAULT_OFF_NOTE } from '../../store/scheduleStore'
import type { CollabMember, Lang } from '../../types'

/**
 * Preview draw budget in pixels per layer, chosen from what the machine has.
 *
 * One number for every computer was wrong in both directions: on a four-core laptop
 * it was more work than the machine could finish inside a frame, and on a desktop
 * with cores and memory to spare it threw away sharpness for nothing. Cores and
 * installed RAM are the only capability signals a renderer gets, and they separate
 * the two cases well enough.
 *
 * The GPU tier is the larger half of the story. When the hue rotation runs as a
 * shader (utils/tintEngine.ts), a bigger preview costs fill rate the card has to
 * spare instead of milliseconds of main-thread pixel work, so the budget can sit far
 * higher than it could when every resize meant re-filtering thirty bitmaps in
 * JavaScript. Without that shader the old, careful numbers still apply.
 *
 * Export is unaffected either way — the exporter resizes the stage and re-tints at
 * output resolution first.
 */
function previewPixelBudget(gpu: boolean): number {
  if (typeof navigator === 'undefined') return gpu ? 2_400_000 : 1_400_000
  const cores = navigator.hardwareConcurrency || 4
  // Chromium only: GiB of RAM, capped at 8 by the spec
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4

  // เครื่องไม่แรง — เอาความลื่นก่อน
  if (cores <= 4 || memory <= 4) return gpu ? 1_200_000 : 900_000
  // เครื่องแรง — คมขึ้นได้อีก
  if (cores >= 12 && memory >= 8) return gpu ? 4_200_000 : 2_600_000
  return gpu ? 2_600_000 : 1_600_000
}

const PREVIEW_PIXEL_BUDGET = previewPixelBudget(tintBackend() === 'gpu')

/**
 * Bitmap sizes are quantised so that dragging the window edge reuses tinted bitmaps
 * instead of minting a whole new set for every pixel of width. 64 steps is finer
 * than the eye follows during a resize and coarse enough that the cache keeps
 * hitting.
 */
const scaleStep = (v: number) => Math.min(1, Math.ceil(v * 64) / 64)

/** how a collab reads on the card, in the language the card is set to */
const COLLAB_WITH: Record<Lang, string> = { en: 'w/', th: 'ร่วมกับ', jp: 'コラボ:' }

/**
 * Collab partners ride on the stream title rather than a line of their own: the PSD
 * rows are ~70px apart below the subtitle, which is not enough for a second run of
 * text at this size without crowding the row underneath.
 */
function withCollab(title: string, members: CollabMember[] | undefined, lang: Lang): string {
  const names = (members ?? []).map((m) => m.name.trim()).filter(Boolean)
  if (names.length === 0) return title
  const tail = `${COLLAB_WITH[lang]} ${names.join(', ')}`
  return title.trim() ? `${title}  ${tail}` : tail
}

/**
 * Paces a fast-changing value so the canvas can never fall behind it.
 *
 * Changing the rotation re-runs the hue filter over every cached template PNG and
 * then redraws both layers from 23 freshly built bitmaps — measured at roughly a
 * fifth of a second on a desktop preview. A dragged slider emits once per frame, so
 * the old code queued one of those per frame and the window stopped responding.
 *
 * Each update is therefore held until the previous one has finished drawing, and
 * how long that took sets the wait for the next one — the pacing follows the
 * machine and the window size instead of a guessed constant. The last value always
 * lands, because the effect re-runs once the canvas catches up.
 */
function usePacedValue<T>(value: T, minWaitMs: number): T {
  const [shown, setShown] = useState(value)
  const latest = useRef(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const commitAt = useRef(0)
  const lastCostMs = useRef(minWaitMs)

  // a parent effect runs after every child effect of the same commit, so by here
  // the whole template has finished re-caching and both layers have been redrawn
  useEffect(() => {
    if (commitAt.current) lastCostMs.current = performance.now() - commitAt.current
  }, [shown])

  useEffect(() => {
    latest.current = value
    // a pending commit is left alone: cancelling it on every change would turn this
    // into a debounce, and a slider held down would show nothing until it was let go
    if (Object.is(value, shown) || timer.current) return
    timer.current = setTimeout(
      () => {
        timer.current = null
        commitAt.current = performance.now()
        setShown(latest.current)
      },
      Math.max(minWaitMs, lastCostMs.current),
    )
  }, [value, shown, minWaitMs])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return shown
}

const ddmm = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`

/**
 * The ribbon reads "WEEK OF 01.04 / 08.04" in the original: the Monday the week
 * starts on and the Monday it ends on, not the Sunday.
 */
const weekEnd = (monday: Date) => {
  const d = new Date(monday)
  d.setDate(d.getDate() + 7)
  return d
}

export interface ScheduleStageProps {
  /** preview shrink factor; the exporter temporarily puts this back to 1 */
  previewScale?: number
}

export const ScheduleStage = forwardRef<Konva.Stage, ScheduleStageProps>(function ScheduleStage(
  { previewScale = 1 },
  ref,
) {
  const stageRef = useRef<Konva.Stage | null>(null)
  const setStageRef = useCallback(
    (node: Konva.Stage | null) => {
      stageRef.current = node
      /**
       * Handle for the #/render-test parity check: comparing the canvas with
       * For prompt app/00_full_composite_reference.png needs a synchronous draw,
       * because a backgrounded window throttles the requestAnimationFrame that
       * Konva's batchDraw waits on.
       */
      ;(window as unknown as { __vsgStage?: Konva.Stage | null }).__vsgStage = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<Konva.Stage | null>).current = node
    },
    [ref],
  )

  // subscribe to only what the canvas draws, so unrelated state cannot force a redraw
  const st = useScheduleStore(
    useShallow((s) => ({
      meta: s.meta,
      days: s.days,
      characterArt: s.characterArt,
      characterArtTransform: s.characterArtTransform,
      selectedDay: s.selectedDay,
      selectDay: s.selectDay,
    })),
  )
  const themeLive = useThemeStore(
    useShallow((s) => ({
      hueShift: s.hueShift,
      saturationShift: s.saturationShift,
      lightnessShift: s.lightnessShift,
    })),
  )
  /**
   * Still paced, but the floor is gone: with the rotation on the GPU a step costs
   * about what an ordinary redraw costs, so the adaptive wait — measured from the
   * last commit rather than guessed — is free to follow the slider frame for frame
   * on a machine that can keep up, and still coalesces on one that cannot.
   */
  const theme = usePacedValue(themeLive, 0)
  // only the parts the user pinned — the rest keep following the hue rotation above
  const artColorsLive = useThemeStore(useShallow((s) => s.artColors))
  // a pin only re-tints its own one or two nodes, so it is cheaper still, but it
  // goes through the same adaptive wait — dragging inside the native colour picker
  // can fire as fast as a slider
  const artColors = usePacedValue(artColorsLive, 0)
  // moving or zooming the artwork re-composites the masked group — that one is still
  // a Konva group cache, so a dragged slider keeps its adaptive pacing rather than
  // queueing one rebuild per frame
  const artTransform = usePacedValue(st.characterArtTransform, 16)
  // only the roles the user pinned — the rest keep following the hue rotation
  const textColors = useTextStyleStore(useShallow((s) => s.textColors))

  // redraw once the real faces are in — metrics change, so text moves slightly
  useFontsReady((s) => s.ready)

  const layout = getTemplate(st.meta.templateId ?? '')
  const { w: W, h: H } = layout.canvas

  const tint: Tint = useMemo(() => resolveTint(theme), [theme])
  // each part follows the global rotation unless its own colour is pinned
  const tints: ArtTints = useMemo(
    () => ({
      background: withPin(tint, artColors.background),
      frame: withPin(tint, artColors.frame),
      panel: withPin(tint, artColors.panel),
      titleFlowers: withPin(tint, artColors.titleFlowers),
      weekRibbon: withPin(tint, artColors.weekRibbon),
      rowAccent: withPin(tint, artColors.rowAccent),
      offlineRibbon: withPin(tint, artColors.offlineRibbon),
    }),
    [tint, artColors],
  )
  const palette = useMemo(
    () => ({ ...resolvePalette(layout.palette, theme), ...textColors }),
    [layout.palette, theme, textColors],
  )

  const dates = useMemo(() => weekDays(st.meta.startDate), [st.meta.startDate])
  const lang = st.meta.language

  /**
   * Typing in the editor writes a character at a time, and each write redraws the
   * card. Pacing the row data means the canvas draws as fast as this machine can
   * finish a frame and no faster — on a quick desktop that is every keystroke, on a
   * slow laptop it coalesces a burst of them into one draw, which is what keeps the
   * text field itself responsive while typing. The field is never paced: it renders
   * from the store directly.
   */
  const days = usePacedValue(st.days, 0)

  const rows: DayRowData[] = useMemo(
    () =>
      days.map((d, i) => {
        const first = d.events[0]
        const offline = d.status !== 'stream' || !first
        return {
          label: DAY_FULL[lang][i],
          isOffline: offline,
          time: first ? formatTime(first.time, st.meta.timeFormat ?? '24h') : '',
          title: offline
            ? (d.offNote ?? DEFAULT_OFF_NOTE)
            : withCollab(first.title, first.collabMembers, lang),
          offlineLabel: d.statusLabel || 'OFFLINE',
          platform: offline ? undefined : first.platform,
          customIcon: offline ? undefined : first.customPlatform?.icon,
        }
      }),
    [days, lang, st.meta.timeFormat],
  )

  const title = useMemo(() => {
    if (lang === 'th') return { top: 'ตาราง', bottom: 'ประจำสัปดาห์' }
    if (lang === 'jp') return { top: 'ウィークリー', bottom: 'スケジュール' }
    return { top: 'WEEKLY', bottom: 'SCHEDULE' }
  }, [lang])

  const sw = Math.round(W * previewScale)
  const sh = Math.round(H * previewScale)

  /**
   * A bigger window costs draw time quadratically. Past the budget the canvas
   * resolution drops (slightly softer, still smooth); the on-screen size does not
   * change, and export is unaffected because it re-sizes the stage first.
   */
  const pixelRatio = useMemo(() => {
    const area = sw * sh
    return area > PREVIEW_PIXEL_BUDGET ? Math.sqrt(PREVIEW_PIXEL_BUDGET / area) : 1
  }, [sw, sh])

  /**
   * The artwork is tinted at exactly the number of pixels that reach the screen —
   * the preview shrink times whatever resolution the budget above settled on.
   *
   * Written during the render on purpose: the nodes underneath read it as they
   * render, so the first frame after a resize tints at the new size instead of
   * building a full-resolution set and throwing it away.
   */
  setTintScale(scaleStep(previewScale * pixelRatio))

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    for (const layer of stage.getLayers()) {
      if (layer.getCanvas().getPixelRatio() !== pixelRatio) {
        layer.getCanvas().setPixelRatio(pixelRatio)
      }
    }
    stage.batchDraw()
  }, [pixelRatio])

  /**
   * The masked art group is the one thing still held as a Konva cache — `source-atop`
   * only clips inside one — and a cache is built at the scale it was drawn at, so
   * enlarging the window would keep showing the smaller bitmap stretched. Rebuilding
   * it on every resize step would re-composite it once per frame while the edge is
   * being dragged, so it waits for the drag to stop: briefly soft, then sharp.
   */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const id = setTimeout(() => {
      for (const node of stage.find(`.${PREVIEW_CACHE_NAME}`)) {
        if (!node.isCached()) continue
        node.clearCache()
        node.cache({ pixelRatio: previewScale || 1 })
      }
      stage.batchDraw()
    }, 220)
    return () => clearTimeout(id)
  }, [previewScale])

  return (
    <Stage ref={setStageRef} width={sw} height={sh} scaleX={previewScale} scaleY={previewScale}>
      <Layer listening={false}>
        <BackgroundLayer layout={layout} tint={tints.background} />
        <DesignCredit layout={layout} tint={tints.background} />
      </Layer>
      <Layer>
        <SchedulePanel
          layout={layout}
          palette={palette}
          tints={tints}
          days={rows}
          weekOfStart={ddmm(dates[0])}
          weekOfEnd={ddmm(weekEnd(dates[0]))}
          titleTop={title.top}
          titleBottom={title.bottom}
          script="auto"
          selectedDay={st.selectedDay}
          onSelectDay={st.selectDay}
        />
        <ArtFrameGroup
          layout={layout}
          palette={palette}
          tint={tints.frame}
          artUrl={st.characterArt}
          artCredit={st.meta.artCredit ?? ''}
          artTransform={artTransform}
        />
      </Layer>
    </Stage>
  )
})
