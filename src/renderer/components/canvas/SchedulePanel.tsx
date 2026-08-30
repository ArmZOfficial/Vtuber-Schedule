/**
 * Right-hand panel: the PSD card, the WEEKLY / SCHEDULE title with its flowers,
 * the WEEK OF ribbon, and the seven day rows.
 */
import { memo } from 'react'
import { Group } from 'react-konva'
import { DayRow, type DayRowData } from './DayRow'
import { InkText } from './InkText'
import { TintedImage, type ArtTints } from './TintedImage'
import { useTemplateImage } from './useTemplateImage'
import type { TemplateLayout, TemplatePalette } from '../../template/layout.schema'
import type { FontScript } from '../../utils/fonts'

/** the "weekly" layer carries a glow in the PSD, so its box is taller than the ink */
const TITLE_CAP_RATIO = 0.705

export const SchedulePanel = memo(function SchedulePanel({
  layout,
  palette,
  tints,
  days,
  weekOfStart,
  weekOfEnd,
  titleTop,
  titleBottom,
  script,
  selectedDay,
  onSelectDay,
}: {
  layout: TemplateLayout
  palette: TemplatePalette
  tints: ArtTints
  days: DayRowData[]
  weekOfStart: string
  weekOfEnd: string
  titleTop: string
  titleBottom: string
  script: FontScript | 'auto'
  selectedDay: number | null
  onSelectDay?: (i: number) => void
}) {
  // ชิ้นส่วนที่ไม่ใช่แกนกลางเป็น optional — เทมเพลตที่ไม่ประกาศไว้จะถูกข้ามการวาด
  // ไม่ใช่วาดรูปเปล่าหรือพัง (แผนข้อ 4.3 / เฟส 3.5)
  const panelRect = layout.images.panel
  const flowersRect = layout.images.titleFlowers
  const ribbonRect = layout.images.weekRibbon
  const panel = useTemplateImage(panelRect?.src)
  const flowers = useTemplateImage(flowersRect?.src)
  const ribbon = useTemplateImage(ribbonRect?.src)

  const { top, bottom } = layout.title
  const titleSize = bottom.size

  const rowGap =
    layout.rowTops.length > 1 ? layout.rowTops[1] - layout.rowTops[0] : layout.row.subtitle.dy * 2

  return (
    <Group>
      {panelRect && (
        <TintedImage
          image={panel}
          x={panelRect.x}
          y={panelRect.y}
          width={panelRect.w}
          height={panelRect.h}
          tint={tints.panel}
        />
      )}

      {/* PSD stacking inside the title group: "Schedule", then "weekly", flowers on top */}
      <InkText
        text={titleBottom}
        x={bottom.x}
        capTop={bottom.y}
        size={titleSize}
        weight="900"
        fill={palette.titleBottom}
        script={script}
      />
      <Group x={top.x} y={top.y} rotation={top.rotation}>
        <InkText
          text={titleTop}
          x={0}
          capTop={0}
          size={titleSize}
          weight="900"
          fill={palette.titleTop}
          script={script}
        />
      </Group>
      {flowersRect && (
        <TintedImage
          image={flowers}
          x={flowersRect.x}
          y={flowersRect.y}
          width={flowersRect.w}
          height={flowersRect.h}
          tint={tints.titleFlowers}
        />
      )}

      {/* WEEK OF ribbon */}
      {ribbonRect && (
        <TintedImage
          image={ribbon}
          x={ribbonRect.x}
          y={ribbonRect.y}
          width={ribbonRect.w}
          height={ribbonRect.h}
          tint={tints.weekRibbon}
        />
      )}
      <InkText
        text="WEEK OF"
        x={layout.weekOf.label.x}
        capTop={layout.weekOf.label.y}
        size={layout.weekOf.label.size}
        weight="900"
        fill={palette.weekOfText}
        script="en"
      />
      <InkText
        text={`${weekOfStart} /\n${weekOfEnd}`}
        x={layout.weekOf.dates.x}
        capTop={layout.weekOf.dates.y}
        size={layout.weekOf.dates.size}
        weight="900"
        fill={palette.weekOfText}
        lineHeight={
          (layout.weekOf.dates.h - layout.weekOf.dates.size * TITLE_CAP_RATIO) / layout.weekOf.dates.size
        }
        script="en"
      />

      {days.map((d, i) => (
        <DayRow
          key={i}
          row={layout.row}
          rowTop={layout.rowTops[i]}
          rowHeight={rowGap}
          data={d}
          palette={palette}
          tints={tints}
          script={script}
          index={i}
          selected={selectedDay === i}
          onSelect={onSelectDay}
        />
      ))}
    </Group>
  )
})
