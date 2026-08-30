/**
 * ยุบการเรียกหลายครั้งภายในเฟรมเดียวให้เหลือครั้งเดียว โดยใช้ค่าล่าสุดเสมอ
 *
 * ลาก slider หนึ่งครั้งยิง event ได้ ~100 ครั้ง/วินาที แต่จอวาดได้แค่ 60
 * ถ้าเขียน store ทุก event = re-render Konva tree เกินจำเป็นเกือบครึ่ง
 * ตัวนี้เลื่อนการเขียนไปที่ requestAnimationFrame ถัดไป แล้วทิ้งค่าระหว่างทาง
 *
 * หมายเหตุ: ค่าที่ถูกยุบคือค่ากลางทาง — ค่าสุดท้ายที่ผู้ใช้ปล่อยนิ้วถูกส่งเสมอ
 */
export function rafThrottle<T extends unknown[]>(fn: (...args: T) => void) {
  let queued: T | null = null
  let id = 0

  const run = () => {
    id = 0
    const args = queued
    queued = null
    if (args) fn(...args)
  }

  const throttled = (...args: T) => {
    queued = args
    if (id) return
    id = requestAnimationFrame(run)
  }

  /** ยกเลิกงานที่ค้างอยู่ — เรียกตอน unmount */
  throttled.cancel = () => {
    if (id) cancelAnimationFrame(id)
    id = 0
    queued = null
  }

  /** ส่งค่าที่ค้างอยู่ทันที ไม่รอเฟรมถัดไป */
  throttled.flush = () => {
    if (!id) return
    cancelAnimationFrame(id)
    run()
  }

  return throttled
}
