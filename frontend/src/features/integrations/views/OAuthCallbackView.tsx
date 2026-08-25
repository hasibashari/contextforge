import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  Calendar,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export default function OAuthCallbackView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const status = searchParams.get('status') || 'success'
  const provider = searchParams.get('provider') || 'google-calendar'
  const account = searchParams.get('account') || ''
  const errorMsg = searchParams.get('error') || 'Authorization was not completed.'

  const isSuccess = status === 'success'

  const isGoogle = provider.includes('google') || provider.includes('calendar')
  const isNotion = provider.includes('notion')

  const providerName = isGoogle
    ? 'Google Calendar'
    : isNotion
    ? 'Notion'
    : 'MCP Connector'

  useEffect(() => {
    // Send postMessage to parent opener window
    if (window.opener) {
      if (isSuccess) {
        // Universal MCP Auth Callback event
        window.opener.postMessage(
          {
            type: 'MCP_AUTH_SUCCESS',
            provider,
            account,
          },
          '*',
        )

        // Specific provider legacy events
        if (isGoogle) {
          window.opener.postMessage(
            {
              type: 'GOOGLE_CALENDAR_AUTH_SUCCESS',
              account: { workspaceName: account },
            },
            '*',
          )
        } else if (isNotion) {
          window.opener.postMessage(
            {
              type: 'NOTION_AUTH_SUCCESS',
              workspace: { workspaceName: account },
            },
            '*',
          )
        }
      } else {
        window.opener.postMessage(
          {
            type: 'MCP_AUTH_ERROR',
            provider,
            error: errorMsg,
          },
          '*',
        )
      }
    }

    // One-shot auto-close window or redirect
    const timer = setTimeout(() => {
      if (window.opener) {
        window.close()
      } else {
        navigate('/integrations', { replace: true })
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [isSuccess, provider, account, errorMsg, isGoogle, isNotion, navigate])

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-card border border-hairline rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Status Animated Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-semantic-success/15 border border-semantic-success/30 text-semantic-success flex items-center justify-center shadow-lg">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                <Sparkles size={13} />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-semantic-error/15 border border-semantic-error/30 text-semantic-error flex items-center justify-center shadow-lg">
              <XCircle size={36} />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-ink tracking-tight">
            {isSuccess ? 'Authorization Successful!' : 'Authorization Failed'}
          </h1>
          <p className="text-xs text-muted font-sans leading-relaxed">
            {isSuccess
              ? `ContextForge is now authorized and connected to your ${providerName} account.`
              : errorMsg}
          </p>
        </div>

        {/* Account Details Box */}
        {isSuccess && (
          <div className="p-3.5 rounded-2xl bg-canvas-soft border border-hairline flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 text-[#4285F4] flex items-center justify-center shrink-0 border border-[#4285F4]/20">
                {isGoogle ? <Calendar size={16} /> : <ExternalLink size={16} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ink truncate font-mono">
                  {account || `${providerName} Connected`}
                </div>
                <div className="text-[11px] text-muted font-sans">
                  Protocol: MCP v1.0 (Streamable HTTP)
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-semantic-success/15 text-semantic-success border border-semantic-success/30 font-semibold shrink-0">
              Active
            </span>
          </div>
        )}

        {/* Actions & Auto Close Countdown */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.opener) {
                window.close()
              } else {
                navigate('/integrations', { replace: true })
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-on-primary bg-primary hover:bg-primary-active transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Continue to Workspace</span>
            <ArrowRight size={14} />
          </button>

          <p className="text-[11px] text-muted font-mono">
            Closing window automatically...
          </p>
        </div>
      </div>
    </div>
  )
}
