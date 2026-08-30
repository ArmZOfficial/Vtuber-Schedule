/**
 * แท็บเทมเพลต (เดิมชื่อ Theme) — แท็บที่เปลี่ยนโครงมากที่สุด (แผนข้อ 8.3)
 *
 *  · บนสุดคือแกลเลอรีเทมเพลต — ของแรกที่เห็น ไม่ใช่ dropdown ที่ฝังอยู่กลางแท็บ
 *  · ถัดมาสาม accordion เปิดได้ทีละอัน: โทนสี · องค์ประกอบ · ฟอนต์
 *  · รายการใน accordion สร้างจาก `controls` ของเทมเพลต ไม่ hardcode เงื่อนไข
 *    ต่อเทมเพลต (ข้อ 4.3.4) เทมเพลตที่ยังไม่ประกาศถือว่าโชว์ทุกอย่าง
 *
 * "เทมเพลต" (โครงสร้าง) กับ "โทนสี" (การหมุนสี) แยกกันชัดเจนแล้ว — สองอย่างนี้
 * เคยถูกยำรวมอยู่ในรายการเดียวกันจนผู้ใช้แยกไม่ออกว่ากำลังเลือกอะไร (ข้อ 2.3.3)
 */
import { useMemo, useState } from 'react'
import { Palette, RotateCcw, Trash2, X } from 'lucide-react'
import { useScheduleStore } from '../../../store/scheduleStore'
import { ART_PARTS, THEME_PRESETS, resolvePalette, shiftPalette, useThemeStore } from '../../../store/themeStore'
import { TEXT_ROLES, useTextStyleStore } from '../../../store/textStyleStore'
import type { FontScript } from '../../../utils/fonts'
import { shiftColor } from '../../../utils/hue'
import { uninstallCustomFont } from '../../../utils/customFonts'
import {
  TEMPLATES,
  getTemplate,
  hasControl,
  recommendedTones,
  type TemplateStyle,
} from '../../../template/layout.schema'
import { assetUrl } from '../../canvas/useTemplateImage'
import { useTranslation, type Translations } from '../../../i18n/translations'
import { useFontsReady } from '../../../store/fontsReady'
import { clearInkCache } from '../../canvas/InkText'
import { FontSourcePicker } from '../FontSourcePicker'
import {
  AccordionGroup,
  AccordionSection,
  Btn,
  Field,
  SectionTitle,
  SelectV2,
  ThumbGrid,
  ValueSlider,
  type ThumbItem,
} from '../ui'
import { toast } from '../toast'

/** faces shipped with every template — selectable for any script slot */
const BUILTIN_FONT_ITEMS = [
  { value: 'TemplateEn', label: 'Nunito' },
  { value: 'TemplateThai', label: 'Kanit' },
  { value: 'TemplateJp', label: 'Umeboshi' },
]

const STYLE_LABEL: Record<TemplateStyle, keyof Translations> = {
  notebook: 'styleNotebook',
  ribbon: 'styleRibbon',
  ticket: 'styleTicket',
  sticker: 'styleSticker',
  minimal: 'styleMinimal',
  fullbleed: 'styleFullbleed',
}

export function TemplateTab() {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  const templateId = useScheduleStore((s) => s.meta.templateId)
  const setMeta = useScheduleStore((s) => s.setMeta)
  const template = getTemplate(templateId ?? '')

  /**
   * โทนสีที่เทมเพลตแนะนำ vs ทั้ง 6 โทน (แผนข้อ 4.4 ทางเลือกที่ 3)
   *
   * ค่าเริ่มต้นคือชุดที่เทมเพลตคุมคุณภาพไว้แล้ว กดปุ่มเดียวเพื่อเห็นทั้งหมด
   * รีเซ็ตกลับทุกครั้งที่เปลี่ยนเทมเพลต เพราะชุดที่แนะนำเป็นคนละชุดกัน
   */
  const [showAllTones, setShowAllTones] = useState(false)

  const presetId = useThemeStore((s) => s.presetId)
  const hueShift = useThemeStore((s) => s.hueShift)
  const saturationShift = useThemeStore((s) => s.saturationShift)
  const lightnessShift = useThemeStore((s) => s.lightnessShift)
  const applyPreset = useThemeStore((s) => s.applyPreset)
  const setHue = useThemeStore((s) => s.setHue)
  const setSaturation = useThemeStore((s) => s.setSaturation)
  const setLightness = useThemeStore((s) => s.setLightness)
  const artColors = useThemeStore((s) => s.artColors)
  const setArtColor = useThemeStore((s) => s.setArtColor)
  const resetArtColors = useThemeStore((s) => s.resetArtColors)
  const reset = useThemeStore((s) => s.reset)

  // ── per-text colour pins + font slots ──
  const textColors = useTextStyleStore((s) => s.textColors)
  const setTextColor = useTextStyleStore((s) => s.setTextColor)
  const resetTextColors = useTextStyleStore((s) => s.resetTextColors)
  const fontAssign = useTextStyleStore((s) => s.fonts)
  const setFont = useTextStyleStore((s) => s.setFont)
  const customFonts = useTextStyleStore((s) => s.customFonts)
  const addCustomFont = useTextStyleStore((s) => s.addCustomFont)
  const removeCustomFont = useTextStyleStore((s) => s.removeCustomFont)
  const bumpFonts = useFontsReady((s) => s.bump)

  const anyArtPinned = Object.keys(artColors).length > 0
  const anyPinned = Object.keys(textColors).length > 0
  const touched = presetId !== 'sakura' || hueShift !== 0 || saturationShift !== 0 || lightnessShift !== 0

  /** palette the canvas is drawing right now — the swatches show it until a role is pinned */
  const effPalette = useMemo(
    () => resolvePalette(template.palette, { hueShift, saturationShift, lightnessShift }),
    [template.palette, hueShift, saturationShift, lightnessShift],
  )

  /**
   * Preview dot for each artwork part: the template's own reference pink, rotated
   * by the current hue/saturation/lightness — the same rotation the real PNG pixels
   * are drawn with. A pinned part shows its exact pinned colour instead.
   */
  const artRotated = useMemo(
    () => shiftColor(template.palette.dayOnline, hueShift, saturationShift, lightnessShift),
    [template.palette.dayOnline, hueShift, saturationShift, lightnessShift],
  )

  /* ── แกลเลอรี ── */
  const items: ThumbItem[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    thumb: t.thumb ? assetUrl(t.thumb) : undefined,
    tags: t.style ? [t.style] : undefined,
  }))

  const filters = useMemo(() => {
    const seen = new Set<TemplateStyle>()
    for (const t of TEMPLATES) if (t.style) seen.add(t.style)
    return [...seen].map((s) => ({ id: s, label: tr[STYLE_LABEL[s]] }))
  }, [tr])

  /**
   * โทนที่จะโชว์ในแถวชิป
   *
   * โทนที่กำลังใช้อยู่ต้องติดมาด้วยเสมอแม้เทมเพลตใหม่จะไม่ได้แนะนำ ไม่งั้นชิปที่ถูกเลือก
   * จะหายไปทั้งที่การ์ดยังเป็นสีนั้น แล้วผู้ใช้จะหาทางกลับไม่เจอ
   */
  const tones = recommendedTones(template)
  const tonesNarrowed = tones !== null && tones.length < THEME_PRESETS.length
  const tonePresets = useMemo(() => {
    if (!tones || showAllTones) return THEME_PRESETS
    return THEME_PRESETS.filter((p) => tones.includes(p.id) || p.id === presetId)
  }, [tones, showAllTones, presetId])

  const pickTemplate = (id: string) => {
    if (id === template.id) return
    setMeta({ templateId: id })
    // ชุดโทนที่แนะนำเป็นของใครของมัน กลับไปตั้งต้นที่ชุดของเทมเพลตใหม่เสมอ
    setShowAllTones(false)
    // เปลี่ยนเทมเพลตแล้วบางค่าที่ปรับเองอาจใช้ต่อไม่ได้ ต้องบอก ไม่ใช่สลับเงียบ ๆ (ข้อ 4.2.6)
    toast(tr.templateSwitchedToast.replace('{name}', getTemplate(id).name))
  }

  /** a face is drawable the moment it lands — measurements taken before it are stale */
  const handleFontInstalled = (name: string) => {
    addCustomFont(name)
    clearInkCache()
    bumpFonts()
    toast(tr.fontUploadOk.replace('{name}', name))
  }

  const handleRemoveFont = async (name: string) => {
    removeCustomFont(name) // also clears any slot assigned to it
    await uninstallCustomFont(name)
    clearInkCache()
    bumpFonts()
  }

  /**
   * Every face a slot can be set to, the selected one included.
   *
   * Radix renders the trigger from the item matching the current value, so a family
   * missing from this list leaves the box blank — which is what an uploaded or a
   * Google font used to do, because the assigned one was filtered out of its own
   * list. A face assigned in an earlier session is added too: the slot is restored
   * from localStorage immediately, while the bytes come back from IndexedDB a moment
   * later, and the name has to read correctly in between.
   */
  const fontItems = (slot: FontScript) => {
    const seen = new Set<string>(['default', ...BUILTIN_FONT_ITEMS.map((b) => b.value)])
    const list: { value: string; label: string; fontFamily?: string }[] = [
      { value: 'default', label: tr.fontDefaultOption },
      ...BUILTIN_FONT_ITEMS,
    ]
    for (const f of [...customFonts, fontAssign[slot]]) {
      if (!f || seen.has(f)) continue
      seen.add(f)
      // drawn in the face itself, so the list previews what it will look like
      list.push({ value: f, label: f, fontFamily: f })
    }
    return list
  }

  const fontSlots: { slot: FontScript; label: string }[] = [
    { slot: 'en', label: tr.fontSlotEn },
    { slot: 'thai', label: tr.fontSlotTh },
    { slot: 'jp', label: tr.fontSlotJp },
  ]

  const showTone = hasControl(template, 'tone')
  const showArt = hasControl(template, 'artColors')
  const showText = hasControl(template, 'textColors')
  const showFonts = hasControl(template, 'fonts')

  return (
    <div className="space-y-5">
      {/* ── แกลเลอรีเทมเพลต — ของแรกที่เห็น ── */}
      <section>
        <SectionTitle level={1}>{tr.templateSection}</SectionTitle>
        <p className="mb-2 text-label leading-snug text-ink-faint">{tr.templateGalleryHint}</p>
        <ThumbGrid
          items={items}
          value={template.id}
          onSelect={pickTemplate}
          filters={filters}
          allLabel={tr.allLabel}
          ariaLabel={tr.templateSection}
        />
      </section>

      <AccordionGroup single defaultValue="tone">
        {showTone && (
          <AccordionSection value="tone" title={tr.toneAccordion}>
            <div className="space-y-3">
              {/* ตัวอย่างโทนสีเป็นแถบสีจริง ไม่ใช่ชื่อ (ข้อ 8.3.3) */}
              <div className="flex flex-wrap gap-1.5">
                {tonePresets.map((p) => {
                  const sw = shiftPalette(
                    template.palette,
                    p.hueShift,
                    p.saturationShift ?? 0,
                    p.lightnessShift ?? 0,
                  )
                  const active = presetId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      title={p.name}
                      onClick={() => applyPreset(p.id)}
                      className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 transition ${
                        active ? 'border-accent bg-accent-soft' : 'border-line-strong bg-canvas hover:bg-raised'
                      }`}
                    >
                      <span className="flex overflow-hidden rounded-full border border-line">
                        {[sw.dayOffline, sw.dayOnline, sw.offlineText, sw.weekOfText].map((c, i) => (
                          <span key={i} className="h-4 w-2.5" style={{ background: c }} />
                        ))}
                      </span>
                      <span className={`max-w-[92px] truncate text-micro ${active ? 'text-accent' : 'text-ink'}`}>
                        {p.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* เทมเพลตที่ตัดโทนบางตัวออกต้องมีทางให้คนที่อยากลองเองกดข้าม (ข้อ 4.4.3) */}
              {tonesNarrowed && (
                <Btn size="sm" variant="ghost" onClick={() => setShowAllTones((v) => !v)}>
                  <Palette size={13} aria-hidden />
                  {showAllTones ? tr.tonesRecommendedBtn : tr.tonesAllBtn}
                </Btn>
              )}

              <Field label={tr.themeHueLabel} density="compact">
                <ValueSlider
                  showInput
                  suffix="°"
                  ariaLabel={tr.themeHueLabel}
                  value={hueShift}
                  min={0}
                  max={359}
                  step={1}
                  onChange={setHue}
                  format={(v) => `${Math.round(v)}°`}
                />
              </Field>
              <Field label={tr.themeSatLabel} density="compact">
                <ValueSlider
                  showInput
                  suffix="%"
                  ariaLabel={tr.themeSatLabel}
                  value={Math.round(saturationShift * 100)}
                  min={-50}
                  max={50}
                  step={1}
                  onChange={(v) => setSaturation(v / 100)}
                  format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}%`}
                />
              </Field>
              <Field label={tr.themeLightLabel} density="compact">
                <ValueSlider
                  showInput
                  suffix="%"
                  ariaLabel={tr.themeLightLabel}
                  value={Math.round(lightnessShift * 100)}
                  min={-25}
                  max={25}
                  step={1}
                  onChange={(v) => setLightness(v / 100)}
                  format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}%`}
                />
              </Field>
              <Btn size="sm" className="w-full" onClick={reset} disabled={!touched}>
                <RotateCcw size={13} aria-hidden /> {tr.themeResetBtn}
              </Btn>
            </div>
          </AccordionSection>
        )}

        {(showArt || showText) && (
          <AccordionSection value="elements" title={tr.elementsAccordion}>
            <div className="space-y-4">
              {showArt && (
                <div>
                  <SectionTitle
                    right={
                      anyArtPinned ? (
                        <Btn variant="ghost" size="sm" onClick={resetArtColors}>
                          <RotateCcw size={11} aria-hidden /> {tr.resetAllColors}
                        </Btn>
                      ) : undefined
                    }
                  >
                    {tr.artColorSection}
                  </SectionTitle>
                  <p className="mb-2 text-label leading-snug text-ink-faint">{tr.artColorHint}</p>
                  <ColorPinList
                    rows={ART_PARTS.map(({ part, key }) => ({
                      id: part,
                      label: tr[key as keyof Translations],
                      value: artColors[part] ?? artRotated,
                      pinned: artColors[part] !== undefined,
                      onChange: (c) => setArtColor(part, c),
                      onClear: () => setArtColor(part, undefined),
                    }))}
                    tr={tr}
                  />
                </div>
              )}

              {showText && (
                <div>
                  <SectionTitle
                    right={
                      anyPinned ? (
                        <Btn variant="ghost" size="sm" onClick={resetTextColors}>
                          <RotateCcw size={11} aria-hidden /> {tr.resetAllColors}
                        </Btn>
                      ) : undefined
                    }
                  >
                    {tr.textColorSection}
                  </SectionTitle>
                  <p className="mb-2 text-label leading-snug text-ink-faint">{tr.textColorHint}</p>
                  <ColorPinList
                    rows={TEXT_ROLES.map(({ role, key }) => ({
                      id: role,
                      label: tr[key as keyof Translations],
                      value: textColors[role] ?? effPalette[role],
                      pinned: textColors[role] !== undefined,
                      onChange: (c) => setTextColor(role, c),
                      onClear: () => setTextColor(role, undefined),
                    }))}
                    tr={tr}
                  />
                </div>
              )}
            </div>
          </AccordionSection>
        )}

        {showFonts && (
          <AccordionSection value="fonts" title={tr.fontsAccordion}>
            <div className="space-y-3">
              <p className="text-label leading-snug text-ink-faint">{tr.fontHint}</p>
              {fontSlots.map(({ slot, label }) => (
                <Field key={slot} label={label} density="compact">
                  <SelectV2
                    searchable
                    ariaLabel={label}
                    value={fontAssign[slot] ?? 'default'}
                    onValueChange={(v) => setFont(slot, v === 'default' ? undefined : v)}
                    items={fontItems(slot)}
                  />
                </Field>
              ))}

              <FontSourcePicker tr={tr} onInstalled={handleFontInstalled} onError={toast} />

              {customFonts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {customFonts.map((f) => (
                    <span
                      key={f}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-line-strong bg-canvas py-0.5 pl-2.5 pr-1 text-micro text-ink-muted"
                    >
                      <span className="max-w-[140px] truncate" style={{ fontFamily: `"${f}", inherit` }}>
                        {f}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRemoveFont(f)}
                        aria-label={tr.fontRemoveAria.replace('{name}', f)}
                        className="rounded-full p-0.5 text-ink-faint transition hover:text-danger"
                      >
                        <Trash2 size={11} aria-hidden />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </AccordionSection>
        )}
      </AccordionGroup>
    </div>
  )
}

/* ── รายการปักสีทีละชิ้น — ใช้ร่วมกันทั้งงานอาร์ตและข้อความ ── */

function ColorPinList({
  rows,
  tr,
}: {
  rows: {
    id: string
    label: string
    value: string
    pinned: boolean
    onChange: (c: string) => void
    onClear: () => void
  }[]
  tr: Translations
}) {
  return (
    <div className="space-y-0.5">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded-btn px-1 py-1 transition hover:bg-raised">
          <label
            className="relative block h-6 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-line-strong"
            style={{ background: r.value }}
          >
            <input
              type="color"
              value={r.value}
              onChange={(e) => r.onChange(e.target.value)}
              aria-label={tr.colorPickerAria.replace('{role}', r.label)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <span className={`min-w-0 flex-1 truncate text-label ${r.pinned ? 'text-ink' : 'text-ink-muted'}`}>
            {r.label}
          </span>
          <span className="font-mono text-micro uppercase tabular-nums text-ink-faint">{r.value}</span>
          {r.pinned && (
            <button
              type="button"
              onClick={r.onClear}
              aria-label={tr.themeResetBtn}
              className="rounded-full text-ink-faint transition hover:text-danger"
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
