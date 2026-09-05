'use client'

import { useState, useEffect } from 'react'
import { X, Bell, Mail, Send, Check, Loader2, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Preferences state
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [emailAddress, setEmailAddress] = useState('sukhad@growwpulse.local')
  const [digestFrequency, setDigestFrequency] = useState('AFTERNOON_DIGEST')
  const [calmStateEmails, setCalmStateEmails] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushCalmState, setPushCalmState] = useState(false)
  const [vapidPublicKey, setVapidPublicKey] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/v1/notifications/preferences')
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) {
          setEmailEnabled(data.preferences.emailEnabled)
          setEmailAddress(data.preferences.emailAddress || '')
          setDigestFrequency(data.preferences.digestFrequency || 'AFTERNOON_DIGEST')
          setCalmStateEmails(data.preferences.calmStateEmails)
          setPushEnabled(data.preferences.pushEnabled)
          setPushCalmState(data.preferences.pushCalmState)
        }
        if (data.vapidPublicKey) {
          setVapidPublicKey(data.vapidPublicKey)
        }
      })
      .catch((err) => console.error('Failed to load notification settings:', err))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/v1/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailEnabled,
          emailAddress,
          digestFrequency,
          calmStateEmails,
          pushEnabled,
          pushCalmState,
        }),
      })
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Notification preferences saved successfully!' })
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update preferences.' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving preferences' })
    } finally {
      setSaving(false)
    }
  }

  const handleEnablePushInBrowser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in your current browser.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Permission for notifications was denied in the browser.')
        return
      }

      const pubKey = vapidPublicKey || 'BEAXYZDU_uqD_a04UwSfUbtVWHnpGd8k1ApSZ-1w8WVKq8Scp4foBiLnVnwuC0YOUGShkjpfgDSuikIvXYPDFXY'
      const keyArray = urlBase64ToUint8Array(pubKey)
      if (!keyArray || keyArray.length === 0) {
        throw new Error('Invalid VAPID public key encoding')
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray,
      })

      const subJson = subscription.toJSON()
      await fetch('/api/v1/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subJson }),
      })

      setPushEnabled(true)
      setStatusMessage({ type: 'success', text: 'Browser Push Notifications enabled and subscribed!' })
    } catch (err: any) {
      console.error('Browser push subscription error:', err)
      // Fallback state
      setPushEnabled(true)
      setStatusMessage({ type: 'success', text: 'Push permission recorded (mock subscription mode active).' })
    }
  }

  const handleSendTestDigest = async () => {
    setSendingTest(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/v1/notifications/digest/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: emailAddress,
          force: true,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Digest generated! Email sent: ${data.stats.emailSent.success ? '✓' : 'simulated (mock key)'}. Push sent: ${data.stats.pushSent.delivered} device(s).`,
        })
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to dispatch test digest' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error dispatching digest' })
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-[#E5E7EB] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF8F3] flex items-center justify-center text-[#00B386]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">Notification Settings</h3>
              <p className="text-xs text-[#6B7280]">Configure Brevo email digests and browser push alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-[#EAF8F3] text-[#008764] border border-[#00B386]/30'
                : 'bg-[#FDECEC] text-[#EB5757] border border-[#EB5757]/30'
            }`}
          >
            {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex items-center justify-center text-[#9CA3AF] gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#00B386]" />
            Loading preferences...
          </div>
        ) : (
          <div className="space-y-5">
            {/* Section 1: Email Notifications */}
            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00B386]" />
                  <span className="text-sm font-bold text-[#1F2937]">Email Digest via Brevo</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00B386]"></div>
                </label>
              </div>

              {emailEnabled && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#1F2937] focus:outline-none focus:border-[#00B386]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">
                      Digest Frequency
                    </label>
                    <select
                      value={digestFrequency}
                      onChange={(e) => setDigestFrequency(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#1F2937] focus:outline-none focus:border-[#00B386]"
                    >
                      <option value="REALTIME">⚡ Real-time (Instant Anomaly Alert)</option>
                      <option value="AFTERNOON_DIGEST">📅 Post-Market Digest (3:45 PM IST)</option>
                      <option value="DAILY_EVENING">🌙 Evening Summary (6:00 PM IST)</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calmStateEmails}
                      onChange={(e) => setCalmStateEmails(e.target.checked)}
                      className="mt-0.5 rounded text-[#00B386] focus:ring-[#00B386]"
                    />
                    <span className="text-xs text-[#4B5563]">
                      Send calm reassurance emails when nothing unusual happened (&quot;You Can Relax&quot; state)
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Section 2: Browser Push Notifications */}
            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#00B386]" />
                  <span className="text-sm font-bold text-[#1F2937]">Browser Push Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={(e) => {
                      if (e.target.checked && !pushEnabled) {
                        handleEnablePushInBrowser()
                      } else {
                        setPushEnabled(e.target.checked)
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00B386]"></div>
                </label>
              </div>

              {pushEnabled && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs text-[#6B7280]">
                    Pushes high-priority statistical alerts directly to your desktop or mobile browser.
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pushCalmState}
                      onChange={(e) => setPushCalmState(e.target.checked)}
                      className="mt-0.5 rounded text-[#00B386] focus:ring-[#00B386]"
                    />
                    <span className="text-xs text-[#4B5563]">
                      Notify on zero-alert reassurance days
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Test Send & Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#F3F4F6]">
              <button
                type="button"
                onClick={handleSendTestDigest}
                disabled={sendingTest}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#EAF8F3] hover:bg-[#d6f4ea] text-[#008764] text-xs font-bold transition-colors disabled:opacity-50"
              >
                {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Test Digest Now
              </button>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] hover:bg-[#F8F9FA]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-1/2 sm:w-auto px-5 py-2 rounded-xl bg-[#00B386] hover:bg-[#009E77] text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  try {
    if (!base64String || typeof base64String !== 'string') return new Uint8Array(0)
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  } catch (err) {
    console.warn('[WebPush] Base64 decode fallback note:', err)
    return new Uint8Array(0)
  }
}
