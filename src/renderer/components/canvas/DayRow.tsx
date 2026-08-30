/**
 * One day of the week: name, platform icon, flower bullet, dashed rule, then either
 * the time or the OFFLINE ribbon, with the stream title underneath.
 *
 * The icon, the bullet and the rule sit after the day name, so their x is measured
 * from the name that is actually rendered — a Thai or Japanese label shifts them the
 * same way the PSD shifts them between MONDAY and WEDNESDAY.
 */
import { memo } from 'react'
import { Group, Image as KImage, Path, Rect } from 'react-konva'
import { InkText, measureInkWidth } from './InkText'
import { OfflineBadge } from './OfflineBadge'
import { TintedDash, TintedImage, type ArtTints } from './TintedImage'
import { useDashTile, useDataUrlImage, useTemplateImage } from './useTemplateImage'
import type { RowTemplate, TemplatePalette } from '../../template/layout.schema'
import { resolveFamily, type FontScript } from '../../utils/fonts'
import { useTextStyleStore } from '../../store/textStyleStore'
import { useFontsReady } from '../../store/fontsReady'
import { getPlatform } from '../../data/platforms'
import type { PlatformId } from '../../types'

/** simple-icons paths are drawn in a 24x24 box */
const ICON_VIEWBOX = 24

export interface DayRowData {
  label: string
  isOffline: boolean
  time: string
  title: string
  offlineLabel: string
  /** platform of the first event — undefined on an offline row */
  platform?: PlatformId
  /** dataURL of the icon uploaded for a custom platform */
  customIcon?: string
}

export interface DayRowProps {
  row: RowTemplate
  rowTop: number
  rowHeight: number
  data: DayRowData
  palette: TemplatePalette
  tints: ArtTints
  script: FontScript | 'auto'
  index: number
  selected: boolean
  onSelect?: (i: number) => void
}

function DayRowBase({
  row,
  rowTop,
  rowHeight,
  data,
  palette,
  tints,
  script,
  index,
  selected,
  onSelect,
}: DayRowProps) {
  // bullet / dash / ribbon เป็น optional — เทมเพลตที่ไม่มีชิ้นส่วนนี้จะข้ามการวาดไป
  const bullet = useTemplateImage(row.bullet?.src)
  const dashTile = useDashTile(row.dash?.src)
  const customIcon = useDataUrlImage(data.customIcon)

  // re-measure when faces land or a custom font is assigned
  useFontsReady((s) => s.rev)
  const fontOverrides = useTextStyleStore((s) => s.fonts)

  const label = row.dayName.upper ? data.label.toUpperCase() : data.label
  const nameFamily = resolveFamily(fontOverrides, label, script)
  const nameW = measureInkWidth(label, nameFamily, '800', row.dayName.size)

  /**
   * The icon takes the bullet's box, so it lines up with the flower it sits next to
   * and needs no measurements of its own. An offline row has no event, so no icon.
   */
  const showIcon = !data.isOffline && !!data.platform
  // ไม่มี bullet ก็ใช้ความสูงของชื่อวันเป็นขนาดไอคอนแทน และเว้นระยะเท่าครึ่งตัวอักษร
  const iconSize = row.bullet?.h ?? row.dayName.size
  const iconGap = row.bullet?.gap ?? row.dayName.size * 0.4
  const iconX = row.dayName.x + nameW + iconGap
  const iconY = rowTop + (row.bullet?.dy ?? row.dayName.dy)

  const bulletX = iconX + (showIcon ? iconSize + iconGap : 0)
  const dashX = bulletX + (row.bullet?.w ?? 0) + (row.dash?.gap ?? 0)
  // an offline row hands the tail of the line over to the ribbon
  const dashRight = data.isOffline
    ? (row.ribbon?.x ?? row.time.right) - (row.dash?.gap ?? 0)
    : (row.dash?.right ?? row.time.right)
  const dashW = Math.max(0, dashRight - dashX)

  return (
    <Group>
      {/* click target — covers the whole row band so a tap anywhere edits that day */}
      <Rect
        x={row.dayName.x}
        y={rowTop - rowHeight * 0.18}
        width={row.time.right - row.dayName.x}
        height={rowHeight}
        fill={selected ? palette.dayOnline : 'transparent'}
        opacity={selected ? 0.18 : 0}
        cornerRadius={rowHeight * 0.25}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        onClick={() => onSelect?.(index)}
        onTap={() => onSelect?.(index)}
        onMouseEnter={(e) => {
          const stage = e.target.getStage()
          if (stage) stage.container().style.cursor = 'pointer'
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage()
          if (stage) stage.container().style.cursor = 'default'
        }}
      />

      <InkText
        text={label}
        x={row.dayName.x}
        capTop={rowTop + row.dayName.dy}
        size={row.dayName.size}
        weight="800"
        fill={data.isOffline ? palette.dayOffline : palette.dayOnline}
        script={script}
      />

      {showIcon &&
        (customIcon ? (
          <KImage
            image={customIcon}
            x={iconX}
            y={iconY}
            width={iconSize}
            height={iconSize}
            listening={false}
            perfectDrawEnabled={false}
          />
        ) : (
          /* drawn in the day-name colour so it rotates with the theme like everything else */
          <Path
            data={getPlatform(data.platform!).path}
            x={iconX}
            y={iconY}
            scaleX={iconSize / ICON_VIEWBOX}
            scaleY={iconSize / ICON_VIEWBOX}
            fill={palette.dayOnline}
            listening={false}
            perfectDrawEnabled={false}
          />
        ))}

      {row.bullet && (
        <TintedImage
          image={bullet}
          x={bulletX}
          y={rowTop + row.bullet.dy}
          width={row.bullet.w}
          height={row.bullet.h}
          tint={tints.rowAccent}
        />
      )}

      {row.dash && (
        <TintedDash
          tile={dashTile}
          x={dashX}
          y={rowTop + row.dash.dy}
          width={dashW}
          height={row.dash.h}
          tint={tints.rowAccent}
        />
      )}

      {data.isOffline ? (
        <OfflineBadge
          row={row}
          rowTop={rowTop}
          label={data.offlineLabel}
          color={palette.offlineText}
          tint={tints.offlineRibbon}
        />
      ) : (
        <InkText
          text={data.time}
          x={row.time.right}
          capTop={rowTop + row.time.dy}
          size={row.time.size}
          weight="800"
          fill={palette.time}
          align="right"
          width={row.time.right - (row.ribbon?.x ?? row.dayName.x)}
          script={script}
        />
      )}

      <InkText
        text={data.title}
        x={row.subtitle.x}
        capTop={rowTop + row.subtitle.dy}
        size={row.subtitle.size}
        weight="500"
        fill={palette.subtitle}
        script={script}
      />
    </Group>
  )
}

/**
 * The stage rebuilds its row data on every store change, so a keystroke in the
 * editor hands all seven rows a brand-new `data` object with identical contents.
 * Comparing the fields instead of the object keeps the six untouched rows from
 * re-rendering — the difference between one row updating and the whole panel.
 */
export const DayRow = memo(DayRowBase, (a, b) => {
  if (
    a.row !== b.row ||
    a.rowTop !== b.rowTop ||
    a.rowHeight !== b.rowHeight ||
    a.palette !== b.palette ||
    a.tints !== b.tints ||
    a.script !== b.script ||
    a.index !== b.index ||
    a.selected !== b.selected ||
    a.onSelect !== b.onSelect
  ) {
    return false
  }
  const x = a.data
  const y = b.data
  return (
    x.label === y.label &&
    x.isOffline === y.isOffline &&
    x.time === y.time &&
    x.title === y.title &&
    x.offlineLabel === y.offlineLabel &&
    x.platform === y.platform &&
    x.customIcon === y.customIcon
  )
})
