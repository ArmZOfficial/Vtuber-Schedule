/**
 * Parity harness — open the app with
 *
 *   #/render-test
 *
 * and the store is forced to exactly the data drawn in
 * `For prompt app/00_full_composite_reference.png`, so the canvas can be diffed
 * against that file pixel for pixel. Without the hash this does nothing.
 */
import { useScheduleStore, uid } from '../store/scheduleStore'
import type { DayData } from '../types'

const OFF_NOTE = 'Day off, sorry!'
const TITLE = 'Example stream title'

/** Mon/Wed/Thu/Sat stream, the rest off — the arrangement in the reference image */
function referenceDays(): DayData[] {
  const stream = (): DayData => ({
    status: 'stream',
    statusLabel: 'STREAM',
    events: [{ id: uid(), platform: 'youtube', title: TITLE, time: '22:00', highlight: false }],
  })
  const off = (): DayData => ({ status: 'off', statusLabel: 'OFFLINE', offNote: OFF_NOTE, events: [] })
  return [stream(), off(), stream(), stream(), off(), stream(), off()]
}

export function applyRenderTestFromHash(): boolean {
  if (typeof location === 'undefined') return false
  if (!(location.hash || '').startsWith('#/render-test')) return false

  const st = useScheduleStore.getState()
  st.setMeta({
    // 01.04.2024 was a Monday, which is the week printed on the ribbon
    startDate: '2024-04-01',
    language: 'en',
    timeFormat: '12h',
    artCredit: '@username',
  })
  referenceDays().forEach((d, i) => st.replaceDay(i, d))
  st.setCharacterArt(undefined)
  st.selectDay(null)
  return true
}
