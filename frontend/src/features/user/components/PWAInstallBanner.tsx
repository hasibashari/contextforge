import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface PWAInstallBannerProps {
  variant?: 'floating' | 'inline'
}

export function PWAInstallBanner({ variant = 'floating' }: PWAInstallBannerProps) {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
  }

  if (!show) return null

  return (
    <div
      className={
        variant === 'floating'
          ? 'fixed bottom-4 right-4 z-50 max-w-sm bg-white border border-hairline shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300'
          : 'w-full bg-surface-soft border border-hairline rounded-2xl p-4 flex items-center justify-between'
      }
    >
      <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
        <Download size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-ink">Install MediCore App</h4>
        <p className="text-xs text-muted truncate">Akses cepat portal kesehatan dari home screen</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstall}
          className="bg-primary hover:bg-primary-active text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={() => setShow(false)}
          className="text-muted hover:text-ink p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
