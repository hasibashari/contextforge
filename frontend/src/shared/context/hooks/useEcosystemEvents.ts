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
) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let isMounted = true;

    function connectSSE() {
      if (!isMounted) return;

      try {
        const es = new EventSource('/api/ecosystem/events/stream');
        eventSourceRef.current = es;

        es.addEventListener('integration_status_changed', (e: MessageEvent) => {
          try {
            const data: IntegrationStatusEvent = JSON.parse(e.data);
            onIntegrationStatusChanged(data);
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
          // Native EventSource auto-reconnects, but if closed, clean up
          if (es.readyState === EventSource.CLOSED) {
            es.close();
            eventSourceRef.current = null;
            if (isMounted) {
              setTimeout(connectSSE, 3000);
            }
          }
        };
      } catch (err) {
        console.warn('[SSE] EventSource initialization error:', err);
      }
    }

    connectSSE();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [onIntegrationStatusChanged]);
}
