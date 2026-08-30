import { useEffect, useRef } from 'react';
import type { Integration } from '@/shared/types/workspace';

export interface IntegrationStatusEvent {
  type: 'integration_status_changed';
  integrationId: string;
  status: 'connected' | 'disconnected' | 'error';
  payload?: Partial<Integration>;
  timestamp: number;
}

export interface PairingStatusEvent {
  type: 'pairing_status_changed';
  sessionId: string;
  status: 'waiting' | 'confirmed' | 'expired';
  deviceInfo?: {
    deviceName: string;
    deviceEndpoint?: string;
    androidVersion?: string;
    batteryLevel?: number;
  };
  timestamp: number;
}

/**
 * Event-Driven Real-Time SSE Stream Hook for Ecosystem & Integration State
 * Replaces all polling with single source of truth server push.
 */
export function useEcosystemEvents(
  onIntegrationStatusChanged: (event: IntegrationStatusEvent) => void,
  onSyncFallback?: () => void,
) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const statusCallbackRef = useRef(onIntegrationStatusChanged);
  const syncCallbackRef = useRef(onSyncFallback);

  useEffect(() => {
    statusCallbackRef.current = onIntegrationStatusChanged;
    syncCallbackRef.current = onSyncFallback;
  }, [onIntegrationStatusChanged, onSyncFallback]);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: NodeJS.Timeout | null = null;

    function connectSSE() {
      if (!isMounted) return;

      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const es = new EventSource('/api/ecosystem/events/stream');
        eventSourceRef.current = es;

        es.onopen = () => {
          // SSE opened cleanly, do a quick sync
          syncCallbackRef.current?.();
        };

        es.addEventListener('integration_status_changed', (e: MessageEvent) => {
          try {
            const data: IntegrationStatusEvent = JSON.parse(e.data);
            statusCallbackRef.current(data);
          } catch (err) {
            console.warn('[SSE] Failed to parse integration status event:', err);
          }
        });

        es.addEventListener('pairing_status_changed', (e: MessageEvent) => {
          try {
            const data: PairingStatusEvent = JSON.parse(e.data);
            // Broadcast custom browser event for open pairing modals
            window.dispatchEvent(
              new CustomEvent('contextforge:pairing_updated', { detail: data }),
            );
          } catch (err) {
            console.warn('[SSE] Failed to parse pairing status event:', err);
          }
        });

        es.onerror = () => {
          // Native EventSource will auto-reconnect, but if closed or in error, schedule safety reconnect
          if (es.readyState === EventSource.CLOSED) {
            es.close();
            eventSourceRef.current = null;
            if (isMounted && !reconnectTimer) {
              reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connectSSE();
              }, 3000);
            }
          }
        };
      } catch (err) {
        console.warn('[SSE] EventSource initialization error:', err);
        if (isMounted && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectSSE();
          }, 3000);
        }
      }
    }

    connectSSE();

    // Periodic safety fallback poll (every 10s) and window focus sync
    const interval = setInterval(() => {
      syncCallbackRef.current?.();
    }, 10000);

    const handleFocus = () => {
      syncCallbackRef.current?.();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);
}
