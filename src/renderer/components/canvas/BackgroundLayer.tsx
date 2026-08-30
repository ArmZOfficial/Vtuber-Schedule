/**
 * Full-bleed background plus the vertical designer credit down the right edge.
 *
 * Both are PSD pixels. The credit is deliberately not editable — it is the
 * template author's attribution, unlike the artist credit on the card.
 */
import { memo } from 'react'
import { TintedImage, type Tint } from './TintedImage'
import { useTemplateImage } from './useTemplateImage'
import type { TemplateLayout } from '../../template/layout.schema'

export const BackgroundLayer = memo(function BackgroundLayer({
  layout,
  tint,
}: {
  layout: TemplateLayout
  tint: Tint
}) {
  const bg = useTemplateImage(layout.images.background.src)

  return (
    <TintedImage
      image={bg}
      x={layout.images.background.x}
      y={layout.images.background.y}
      width={layout.images.background.w}
      height={layout.images.background.h}
      tint={tint}
    />
  )
})

export const DesignCredit = memo(function DesignCredit({
  layout,
  tint,
}: {
  layout: TemplateLayout
  tint: Tint
}) {
  const r = layout.images.designCredit
  const credit = useTemplateImage(r?.src)

  if (!r) return null
  return <TintedImage image={credit} x={r.x} y={r.y} width={r.w} height={r.h} tint={tint} />
})
