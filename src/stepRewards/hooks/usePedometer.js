/**
 * usePedometer.js
 * ------------------------------------------------------------------
 * Reads live step-count deltas from the phone's pedometer (Expo Sensors)
 * for an ACTIVE shoe session, and periodically pushes batched deltas to
 * the backend via `syncSteps`.
 *
 * NOTE on reliability (read before relying on this in production):
 *  - iOS: Pedometer.getStepCountAsync(start, end) can read HISTORICAL
 *    data even if the app wasn't running (CMPedometer keeps its own
 *    background log). We poll this on an interval AND on app-foreground.
 *  - Android: Pedometer.watchStepCount() only delivers *live* deltas
 *    while the JS process is alive. If the app is fully killed, deltas
 *    during that window are lost. Fine for an MVP/pilot; for production,
 *    pair this with a foreground service (expo-task-manager) so long
 *    gaps don't silently drop steps.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { syncSteps } from '../api/stepSync';

export function usePedometer({ sessionId, syncIntervalMs = 5 * 60 * 1000, onSynced, onSyncError }) {
  const [status, setStatus] = useState('idle');
  const [todaySteps, setTodaySteps] = useState(0);
  const [pendingSteps, setPendingSteps] = useState(0);

  const subscriptionRef = useRef(null);
  const bufferedDeltaRef = useRef(0);
  const lastFlushRef = useRef(new Date());
  const appStateRef = useRef(AppState.currentState);

  const flush = useCallback(async () => {
    if (!sessionId || bufferedDeltaRef.current <= 0) return;

    const delta = bufferedDeltaRef.current;
    const since = lastFlushRef.current;
    const now = new Date();

    bufferedDeltaRef.current = 0;
    lastFlushRef.current = now;
    setPendingSteps(0);

    try {
      const result = await syncSteps({
        sessionId,
        stepsDelta: delta,
        clientTimestamp: now.toISOString(),
        windowStart: since.toISOString(),
      });
      onSynced?.(result.cumulativeSteps);
    } catch (err) {
      bufferedDeltaRef.current += delta;
      setPendingSteps(bufferedDeltaRef.current);
      onSyncError?.(err);
    }
  }, [sessionId, onSynced, onSyncError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('checking');
      const available = await Pedometer.isAvailableAsync().catch(() => false);
      if (!available) {
        if (!cancelled) setStatus('unavailable');
        return;
      }
      const perm = await Pedometer.requestPermissionsAsync();
      if (cancelled) return;
      setStatus(perm.granted ? 'available' : 'denied');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'available' || !sessionId) return;

    subscriptionRef.current = Pedometer.watchStepCount((result) => {
      bufferedDeltaRef.current += result.steps;
      setPendingSteps(bufferedDeltaRef.current);
      setTodaySteps((t) => t + result.steps);
    });

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [status, sessionId]);

  useEffect(() => {
    if (status !== 'available' || !sessionId) return;

    const onChange = async (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        const end = new Date();
        const start = lastFlushRef.current;
        try {
          const { steps } = await Pedometer.getStepCountAsync(start, end);
          if (steps > 0) {
            bufferedDeltaRef.current += steps;
            setPendingSteps(bufferedDeltaRef.current);
          }
        } catch {
          // iOS-only API; safely ignored on Android.
        }
        flush();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [status, sessionId, flush]);

  useEffect(() => {
    if (status !== 'available' || !sessionId) return;
    const id = setInterval(flush, syncIntervalMs);
    return () => clearInterval(id);
  }, [status, sessionId, syncIntervalMs, flush]);

  return { status, todaySteps, pendingSteps, flushNow: flush };
}
