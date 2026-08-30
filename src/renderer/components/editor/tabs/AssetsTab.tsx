/**
 * แท็บภาพตัวละคร (แผนข้อ 8.4)
 *
 *  · รูปแสดงเป็นภาพย่อพร้อมกรอบตามสัดส่วนช่องจริงบนการ์ด
 *  · slider transform ทุกตัวมีช่องพิมพ์ค่าเป๊ะ และมีปุ่มลัด "จัดกึ่งกลาง / พอดีกรอบ"
 *  · หมุนภาพและกลับด้านภาพ — ภาพย่อในแท็บนี้แสดงผลเดียวกับที่การ์ดวาดจริง
 *  · ยังไม่มีรูปก็ต้องมี EmptyState บอกว่าทำอะไรต่อ ไม่ใช่กล่องเปล่า
 */
import { useScheduleStore } from '../../../store/scheduleStore'
import { fileToDataURL } from '../../../utils/image'
import { DEFAULT_ART_TRANSFORM } from '../../../types'
import { Btn, DropZone, EmptyState, Field, SectionTitle, ValueSlider } from '../ui'
import { Crop, FlipHorizontal2, FlipVertical2, ImagePlus, Move, RefreshCw, RotateCw, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../i18n/translations'

/** ช่องใส่ภาพบนการ์ด Sakura Diary — ใช้เป็นสัดส่วนของกล่องพรีวิวในแท็บนี้ */
const FRAME_ASPECT = '1400 / 1760'

export function AssetsTab() {
  const characterArt = useScheduleStore((s) => s.characterArt)
  const setCharacterArt = useScheduleStore((s) => s.setCharacterArt)
  const artTransform = useScheduleStore((s) => s.characterArtTransform) ?? DEFAULT_ART_TRANSFORM
  const setArtTransform = useScheduleStore((s) => s.setCharacterArtTransform)
  const resetArtTransform = useScheduleStore((s) => s.resetCharacterArtTransform)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  const pickFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = async () => {
      const f = input.files?.[0]
      if (f) setCharacterArt(await fileToDataURL(f))
    }
    input.click()
  }

  if (!characterArt) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<ImagePlus size={20} />}
          title={tr.noArtTitle}
          message={tr.noArtMsg}
        />
        <DropZone
          onFile={async (f) => setCharacterArt(await fileToDataURL(f))}
          title={tr.uploadCharacterArt}
          hint={tr.characterArtHint}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section>
        <SectionTitle>{tr.artSection}</SectionTitle>
        {/*
          Same crop the canvas draws: the frame window is 1400x1760, the picture
          covers it, and zoom grows it about the centre. Matching the aspect here
          means what is cut off in this box is what is cut off on the card.
        */}
        <div
          className="stage-checker relative mx-auto overflow-hidden rounded-card border border-line-strong"
          style={{ aspectRatio: FRAME_ASPECT, maxHeight: '13rem' }}
        >
          <img
            src={characterArt}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              // ลำดับเดียวกับที่ Konva ทำ: เลื่อน → ซูม → หมุน → กลับด้าน
              // ถ้าสลับลำดับ ภาพย่อจะไม่ตรงกับการ์ดตอนหมุนพร้อมเลื่อน
              transform: [
                `translate(${artTransform.offsetX * 100}%, ${artTransform.offsetY * 100}%)`,
                `scale(${artTransform.scale})`,
                `rotate(${artTransform.rotation ?? 0}deg)`,
                `scale(${artTransform.flipX ? -1 : 1}, ${artTransform.flipY ? -1 : 1})`,
              ].join(' '),
            }}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-card border border-line bg-canvas p-3">
        <Field label={tr.zoomLabel} density="compact">
          <ValueSlider
            showInput
            suffix="%"
            value={Math.round(artTransform.scale * 100)}
            min={50}
            max={200}
            step={5}
            onChange={(v) => setArtTransform({ scale: v / 100 })}
            format={(v) => `${Math.round(v)}%`}
            ariaLabel={tr.zoomLabel}
          />
        </Field>

        <Field label={`${tr.positionLabel} X`} density="compact">
          <ValueSlider
            showInput
            suffix="%"
            value={Math.round(artTransform.offsetX * 100)}
            min={-150}
            max={150}
            step={1}
            onChange={(v) => setArtTransform({ offsetX: v / 100 })}
            format={(v) => `${Math.round(v)}%`}
            ariaLabel={`${tr.positionLabel} X`}
          />
        </Field>
        <Field label={`${tr.positionLabel} Y`} density="compact">
          <ValueSlider
            showInput
            suffix="%"
            value={Math.round(artTransform.offsetY * 100)}
            min={-150}
            max={150}
            step={1}
            onChange={(v) => setArtTransform({ offsetY: v / 100 })}
            format={(v) => `${Math.round(v)}%`}
            ariaLabel={`${tr.positionLabel} Y`}
          />
        </Field>

        <Field label={tr.rotationLabel} density="compact">
          <ValueSlider
            showInput
            suffix="°"
            value={artTransform.rotation ?? 0}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => setArtTransform({ rotation: v })}
            format={(v) => `${Math.round(v)}°`}
            ariaLabel={tr.rotationLabel}
          />
        </Field>

        <div className="grid grid-cols-3 gap-1.5">
          {/* หมุนทีละ 90° ครอบคลุมงานส่วนใหญ่ กดสี่ครั้งกลับที่เดิมพอดี */}
          <Btn
            size="sm"
            onClick={() => setArtTransform({ rotation: (((artTransform.rotation ?? 0) + 90 + 180) % 360) - 180 })}
          >
            <RotateCw size={12} aria-hidden /> 90°
          </Btn>
          <Btn
            size="sm"
            aria-pressed={!!artTransform.flipX}
            variant={artTransform.flipX ? 'primary' : 'default'}
            onClick={() => setArtTransform({ flipX: !artTransform.flipX })}
          >
            <FlipHorizontal2 size={12} aria-hidden /> {tr.flipXBtn}
          </Btn>
          <Btn
            size="sm"
            aria-pressed={!!artTransform.flipY}
            variant={artTransform.flipY ? 'primary' : 'default'}
            onClick={() => setArtTransform({ flipY: !artTransform.flipY })}
          >
            <FlipVertical2 size={12} aria-hidden /> {tr.flipYBtn}
          </Btn>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Btn size="sm" onClick={() => setArtTransform({ offsetX: 0, offsetY: 0 })}>
            <Move size={12} aria-hidden /> {tr.centerArtBtn}
          </Btn>
          <Btn size="sm" onClick={() => setArtTransform({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0 })}>
            <Crop size={12} aria-hidden /> {tr.fitArtBtn}
          </Btn>
          <Btn size="sm" onClick={resetArtTransform}>
            <RefreshCw size={12} aria-hidden /> {tr.resetBtn}
          </Btn>
        </div>
      </section>

      <div className="flex gap-2">
        <Btn className="flex-1" onClick={pickFile}>
          <RefreshCw size={13} aria-hidden /> {tr.changeArt}
        </Btn>
        <Btn variant="danger" onClick={() => setCharacterArt(undefined)}>
          <Trash2 size={13} aria-hidden /> {tr.deleteBtn}
        </Btn>
      </div>
    </div>
  )
}
