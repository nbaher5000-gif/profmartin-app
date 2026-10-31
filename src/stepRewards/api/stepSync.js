/**
 * API client for the step-reward backend.
 * Point EXPO_PUBLIC_STEP_API_URL (app .env) at the deployed backend
 * (e.g. https://step-api.profmartin.co) once DNS/certbot are done.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_STEP_API_URL ?? 'https://step-api.profmartin.co';

async function getDeviceId() {
  // Prefer a persisted install id over a volatile one, so the backend can
  // detect a device swap (see anti-fraud rules in rewardEngine.ts).
  const Application = await import('expo-application');
  return (
    (await Application.getAndroidId?.()) ?? (await Application.getIosIdForVendorAsync?.()) ?? 'unknown-device'
  );
}

async function authedFetch(path, body) {
  const deviceId = await getDeviceId();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, deviceId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

/** Called right after the buyer scans the QR code printed on their shoe box. */
export function activateShoe(params) {
  return authedFetch('/shoes/activate', params);
}

/** Called by usePedometer on its sync timer; backend applies anti-fraud rules & reward logic. */
export function syncSteps(params) {
  return authedFetch('/steps/sync', params);
}
