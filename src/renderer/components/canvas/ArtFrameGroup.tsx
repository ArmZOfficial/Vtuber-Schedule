/**
 * Left-hand art card: the PSD frame, the artwork inside it, and the artist credit.
 *
 * The frame PNG is a window: its middle is transparent, and in the PSD it is the
 * topmost layer, so the border, the flower clips and the ribbon tail all draw over
 * whatever is inside. The artwork therefore goes underneath it.
 *
 * To keep the art inside the tilted card without hand-guessing its corners, the
 * placeholder PNG is drawn first and the artwork is composited onto it with
 * `source-atop` — the placeholder's own alpha becomes the mask, straight from the
 * PSD pixels.
 */
import { memo, useEffect, useRef } from 'react'
import { Group, Image as KImage } from 'react-konva'
import type Konva from 'konva'
import { InkText, measureInkWidth } from './InkText'
import { TintedImage, type Tint } from './TintedImage'
import { PREVIEW_CACHE_NAME } from '../../export/exporter'
import { useDataUrlImage, useTemplateImage } from './useTemplateImage'
import type { TemplateLayout } from '../../template/layout.schema'
import { resolveFamily } from '../../utils/fonts'
import { useTextStyleStore } from '../../store/textStyleStore'
import { useFontsReady } from '../../store/fontsReady'
import { DEFAULT_ART_TRANSFORM, type ArtTransform } from '../../types'

/** cover-fit a bitmap into a box, keeping its aspect ratio */
function coverRect(boxW: number, boxH: number, imgW: number, imgH: number) {
  if (!imgW || !imgH) return { x: 0, y: 0, w: boxW, h: boxH }
  const s = Math.max(boxW / imgW, boxH / imgH)
  const w = imgW * s
  const h = imgH * s
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}

/**
 * Where the artwork sits inside the frame.
 *
 * Cover-fit is the starting point — the picture fills the window whatever its own
 * proportions. Zoom then grows it about the centre of the window rather than about
 * its own top-left, so turning the slider does not also walk the picture sideways,
 * and the offsets move it by a fraction of the window, which keeps a saved position
 * meaningful when the same draft is opened at another export size.
 */
function placeArt(
  boxW: number,
  boxH: number,
  imgW: number,
  imgH: number,
  t: ArtTransform,
) {
  const base = coverRect(boxW, boxH, imgW, imgH)
  const scale = t.scale > 0 ? t.scale : 1
  const w = base.w * scale
  const h = base.h * scale
  return {
    x: base.x - (w - base.w) / 2 + t.offsetX * boxW,
    y: base.y - (h - base.h) / 2 + t.offsetY * boxH,
    w,
    h,
  }
}

export const ArtFrameGroup = memo(function ArtFrameGroup({
  layout,
  palette,
  tint,
  artUrl,
  artCredit,
  artTransform,
}: {
  layout: TemplateLayout
  palette: { artCredit: string }
  tint: Tint
  artUrl?: string
  artCredit: string
  /** zoom and position from the Assets tab — the frame itself never moves */
  artTransform?: ArtTransform
}) {
  // กรอบและช่องใส่ภาพเป็น optional — เทมเพลตที่ไม่มีช่องภาพตัวละครก็ใช้ได้ (แผนข้อ 4.3)
  const frameRect = layout.images.frame
  const ph = layout.images.placeholder
  const frame = useTemplateImage(frameRect?.src)
  const placeholder = useTemplateImage(ph?.src)
  const art = useDataUrlImage(artUrl)

  const t = artTransform ?? DEFAULT_ART_TRANSFORM
  const artBox = art && ph ? placeArt(ph.w, ph.h, art.naturalWidth, art.naturalHeight, t) : null

  /**
   * หมุนและกลับภาพ — ทำรอบจุดกึ่งกลางช่องภาพ ไม่ใช่มุมบนซ้าย
   *
   * ทั้งสามค่าเป็น optional และ draft เก่าไม่มี จึงต้อง `??` ทุกตัว และเมื่อไม่มีใคร
   * ตั้งค่าอะไรเลย โค้ดจะ **ไม่แตะ prop x/y เดิม** เลย ไม่ใช่ส่ง rotation={0} ลงไป —
   * เพื่อให้ไฟล์ที่ export ออกมาเหมือนเดิมทุกไบต์สำหรับงานเก่า (แผนหลักการที่ 2)
   *
   * หมายเหตุ: หมุนแล้วมุมภาพอาจหลุดออกนอกช่องจนเห็นพื้นโปร่ง ผู้ใช้แก้ด้วยการซูมเพิ่ม
   * ตั้งใจไม่ซูมชดเชยให้อัตโนมัติ เพราะสไลเดอร์ซูมจะขยับเองโดยผู้ใช้ไม่ได้สั่ง
   */
  const rotation = t.rotation ?? 0
  const flipX = t.flipX ?? false
  const flipY = t.flipY ?? false
  const spun = rotation !== 0 || flipX || flipY
  const spinProps =
    spun && artBox
      ? {
          x: artBox.x + artBox.w / 2,
          y: artBox.y + artBox.h / 2,
          offsetX: artBox.w / 2,
          offsetY: artBox.h / 2,
          rotation,
          scaleX: flipX ? -1 : 1,
          scaleY: flipY ? -1 : 1,
        }
      : { x: artBox?.x ?? 0, y: artBox?.y ?? 0 }

  // source-atop only clips within a cached group, so the mask has to be cached
  const maskRef = useRef<Konva.Group>(null)
  useEffect(() => {
    const g = maskRef.current
    if (!g) return
    g.clearCache()
    if (!art || !placeholder || !ph) return
    g.cache({ pixelRatio: g.getStage()?.scaleX() || 1 })
    g.getLayer()?.batchDraw()
    // the mask bitmap holds the composited result, so a move or a zoom has to rebuild
    // it — without these deps the sliders would change nothing on screen
  }, [
    art,
    placeholder,
    ph,
    ph?.w,
    ph?.h,
    t.scale,
    t.offsetX,
    t.offsetY,
    rotation,
    flipX,
    flipY,
    tint.hue,
    tint.saturation,
    tint.lightness,
    tint.pin?.hue,
    tint.pin?.sat,
  ])

  // "Art by:" is bold and the handle is not — two runs sharing one baseline,
  // centred on the PSD text origin the way the layer's own transform records it
  useFontsReady((s) => s.rev)
  const fontOverrides = useTextStyleStore((s) => s.fonts)
  const creditFamily = resolveFamily(fontOverrides, artCredit || 'en', 'en')
  const creditLabel = 'Art by: '
  const cr = layout.artCredit
  const labelW = measureInkWidth(creditLabel, creditFamily, '800', cr.size)
  const handleW = measureInkWidth(artCredit, creditFamily, '500', cr.size)
  const creditLeft = -(labelW + handleW) / 2

  return (
    <Group>
      <Group x={cr.x} y={cr.baseline} rotation={cr.rotation}>
        <InkText
          text={creditLabel}
          x={creditLeft}
          baseline={0}
          size={cr.size}
          weight="800"
          fill={palette.artCredit}
          script="en"
        />
        <InkText
          text={artCredit}
          x={creditLeft + labelW}
          baseline={0}
          size={cr.size}
          weight="500"
          fill={palette.artCredit}
          opacity={0.85}
        />
      </Group>

      {ph && art ? (
        // named so the exporter rebuilds this bitmap at output scale — without it
        // the artwork would be upscaled from the preview cache and land soft
        <Group ref={maskRef} name={PREVIEW_CACHE_NAME} x={ph.x} y={ph.y}>
          <TintedImage image={placeholder} x={0} y={0} width={ph.w} height={ph.h} tint={tint} />
          {artBox && (
            <KImage
              image={art}
              {...spinProps}
              width={artBox.w}
              height={artBox.h}
              listening={false}
              perfectDrawEnabled={false}
              globalCompositeOperation="source-atop"
            />
          )}
        </Group>
      ) : (
        ph && <TintedImage image={placeholder} x={ph.x} y={ph.y} width={ph.w} height={ph.h} tint={tint} />
      )}

      {/* topmost in the PSD — the window frame draws over the art */}
      {frameRect && (
        <TintedImage
          image={frame}
          x={frameRect.x}
          y={frameRect.y}
          width={frameRect.w}
          height={frameRect.h}
          tint={tint}
        />
      )}
    </Group>
  )
})
