/**
 * The OFFLINE ribbon: the real PSD ribbon PNG with its label centred on it.
 *
 * Kept as one component so the ribbon and its text never drift apart — the label
 * is centred on the ribbon box, exactly as the PSD has it.
 */
import { memo } from 'react'
import { InkText } from './InkText'
import { TintedImage, type Tint } from './TintedImage'
import { useTemplateImage } from './useTemplateImage'
import type { RowTemplate } from '../../template/layout.schema'

export const OfflineBadge = memo(function OfflineBadge({
  row,
  rowTop,
  label,
  color,
  tint,
}: {
  row: RowTemplate
  rowTop: number
  label: string
  color: string
  tint: Tint
}) {
  const ribbon = useTemplateImage(row.ribbon?.src)

  /**
   * ริบบิ้นเป็น optional — เทมเพลตที่ไม่มีริบบิ้นจะวางป้าย OFFLINE ไว้ที่ตำแหน่ง
   * เดียวกับเวลา ชิดขวาเหมือนเวลาที่มันมาแทน (แผนข้อ 4.3)
   */
  const text = row.offlineText
  const upper = text?.upper ?? true

  if (!row.ribbon) {
    return (
      <InkText
        text={upper ? label.toUpperCase() : label}
        x={row.time.right}
        capTop={rowTop + (text?.dy ?? row.time.dy)}
        size={text?.size ?? row.time.size}
        weight="800"
        fill={color}
        align="right"
        width={row.time.right - row.dayName.x}
      />
    )
  }

  return (
    <>
      <TintedImage
        image={ribbon}
        x={row.ribbon.x}
        y={rowTop + row.ribbon.dy}
        width={row.ribbon.w}
        height={row.ribbon.h}
        tint={tint}
      />
      <InkText
        text={upper ? label.toUpperCase() : label}
        x={row.ribbon.x}
        capTop={rowTop + (text?.dy ?? row.ribbon.dy)}
        size={text?.size ?? row.time.size}
        weight="800"
        fill={color}
        align="center"
        width={row.ribbon.w}
      />
    </>
  )
})
