import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, RefreshCw, Copy, Check } from 'lucide-react'

interface QrCodeBoxProps {
  value: string
  size?: number
  pinCode?: string
  formattedPin?: string
  expiresInSeconds?: number
  isExpired?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

export const QrCodeBox: React.FC<QrCodeBoxProps> = ({
  value,
  size = 200,
  pinCode,
  formattedPin,
  expiresInSeconds,
  isExpired = false,
  onRefresh,
  isRefreshing = false,
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopyPin = () => {
    if (!pinCode) return
    navigator.clipboard.writeText(pinCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTimer = (seconds?: number) => {
    if (seconds === undefined) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* QR Code Container with High Contrast and Glowing Border */}
      <div className="relative p-3.5 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-lg group hover:border-emerald-500/60 transition-all">
        {/* Animated Scanner Beam (when active) */}
        {!isExpired && (
          <div className="absolute inset-x-3.5 top-3.5 h-0.5 bg-linear-to-r from-transparent via-emerald-500 to-transparent animate-[scan_2.5s_ease-in-out_infinite] pointer-events-none z-10 opacity-75" />
        )}

        <div className="relative flex items-center justify-center">
          <QRCodeSVG
            value={value || 'contextforge-pairing'}
            size={size}
            level="H"
            marginSize={1}
            fgColor={isExpired ? '#94a3b8' : '#0f172a'}
            bgColor="#ffffff"
            className={`transition-opacity duration-200 ${
              isExpired ? 'opacity-25 filter blur-[1px]' : 'opacity-100'
            }`}
          />

          {/* Centered Android / ContextForge Badge */}
          {!isExpired && (
            <div className="absolute w-10 h-10 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-md">
              <Smartphone size={20} className="text-emerald-600" />
            </div>
          )}

          {/* Expired Overlay */}
          {isExpired && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-white/90 rounded-xl space-y-2 backdrop-blur-[2px]">
              <span className="text-xs font-semibold text-slate-800">
                QR Code Expired
              </span>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  size={12}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
                <span>Regenerate QR</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Countdown & Refresh Bar */}
      <div className="flex items-center justify-between w-full max-w-65 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-muted">
          <span
            className={`w-2 h-2 rounded-full ${
              isExpired
                ? 'bg-semantic-error'
                : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>
            {isExpired
              ? 'Expired'
              : expiresInSeconds !== undefined
                ? `Expires in ${formatTimer(expiresInSeconds)}`
                : 'Waiting for scan...'}
          </span>
        </div>

        {!isExpired && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-muted hover:text-emerald-500 transition-colors flex items-center gap-1 text-[11px] cursor-pointer disabled:opacity-50"
            title="Refresh QR Code"
          >
            <RefreshCw
              size={11}
              className={isRefreshing ? 'animate-spin' : ''}
            />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Fallback 6-Digit PIN Code Box */}
      {formattedPin && (
        <div className="w-full max-w-65 p-2.5 rounded-xl bg-canvas-soft border border-hairline flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-caption text-muted">
              Manual Pairing PIN
            </div>
            <div className="text-sm font-mono font-bold text-ink tracking-widest">
              {formattedPin}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyPin}
            className="px-2.5 py-1 rounded-lg bg-canvas border border-hairline hover:border-emerald-500/40 text-xs font-mono text-muted hover:text-ink transition-colors flex items-center gap-1 cursor-pointer"
            title="Copy PIN Code"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-500" />
                <span className="text-emerald-500 text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
