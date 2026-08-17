import { useEffect } from 'react'

export default function PWARedirector() {
  useEffect(() => {
    // Detect standalone PWA mode if needed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone
    if (isStandalone) {
      // In PWA mode
    }
  }, [])

  return null
}
