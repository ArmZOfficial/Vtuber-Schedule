/**
 * ดัก error ใน subtree — กันจอขาวจากบั๊กตอน render ที่ไม่คาดคิด
 *
 * งานถูก autosave ไว้แล้วเสมอ ข้อความจึงบอกแบบนั้นตรง ๆ แทนที่จะโยนศัพท์ช่างใส่ผู้ใช้
 * (แผนเฟส 5.4 — แอปนี้จะขาย คนที่เจอจอนี้จะไม่มีใครให้ถาม)
 *
 * รายละเอียดทางเทคนิคยังต้องมี ไม่งั้นเวลาผู้ใช้แจ้งปัญหาจะไม่มีอะไรให้ดูเลย
 * แต่ซ่อนไว้ใต้ `<details>` ให้คนที่ต้องการเท่านั้นที่เห็น
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useScheduleStore } from '../store/scheduleStore'
import { useTranslation } from '../i18n/translations'
import { Btn } from './editor/ui'

interface Props {
  children: ReactNode
  /** แสดง fallback แบบแทรกในแผง แทนที่จะกินพื้นที่ทั้งก้อน (สำหรับ panel ย่อย) */
  inline?: boolean
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} inline={this.props.inline} onRetry={this.handleRetry} />
    }
    return this.props.children
  }
}

/** รายละเอียดสำหรับแจ้งปัญหา — พับไว้ ไม่ใช่ของที่ผู้ใช้ทั่วไปต้องอ่าน */
function Details({ error }: { error: Error }) {
  return (
    <details className="mt-1 w-full max-w-sm text-left">
      <summary className="cursor-pointer text-micro text-ink-faint hover:text-ink-muted">
        {error.name}
      </summary>
      <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap break-words rounded-btn bg-sunken px-2 py-1.5 font-mono text-micro leading-relaxed text-ink-faint">
        {error.message}
      </p>
    </details>
  )
}

function ErrorFallback({ error, inline, onRetry }: { error: Error; inline?: boolean; onRetry: () => void }) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const t = useTranslation(uiLanguage)

  if (inline) {
    return (
      <div className="m-3 rounded-card border border-danger/40 bg-danger/5 p-4">
        <p className="flex items-center gap-2 text-body font-semibold text-danger">
          <AlertTriangle size={15} aria-hidden />
          {t.errorUiTitle}
        </p>
        <p className="mt-1.5 text-label leading-relaxed text-ink-muted">{t.errorUiMsg}</p>
        <Btn variant="danger" size="sm" className="mt-3" onClick={onRetry}>
          <RotateCcw size={13} aria-hidden />
          {t.errorUiRetry}
        </Btn>
        <Details error={error} />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger"
      >
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="text-title font-semibold text-ink">{t.errorUiTitle}</p>
        <p className="mx-auto mt-1 max-w-xs text-label leading-relaxed text-ink-muted">{t.errorUiMsg}</p>
      </div>
      <Btn variant="default" onClick={onRetry}>
        <RotateCcw size={14} aria-hidden />
        {t.errorUiRetry}
      </Btn>
      <Details error={error} />
    </div>
  )
}
