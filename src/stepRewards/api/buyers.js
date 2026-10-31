const API_BASE_URL = process.env.EXPO_PUBLIC_STEP_API_URL ?? 'https://step-api.profmartin.co';

export async function getBuyer(phone) {
  const res = await fetch(`${API_BASE_URL}/buyers/${encodeURIComponent(phone)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getBuyer failed: ${res.status}`);
  return res.json();
}

export async function setBankAccount(phone, sheba, ownerName) {
  const res = await fetch(`${API_BASE_URL}/buyers/${encodeURIComponent(phone)}/bank-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheba, ownerName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `setBankAccount failed: ${res.status}`);
  }
}

export async function getShoeStatus(sessionId) {
  const res = await fetch(`${API_BASE_URL}/shoes/${sessionId}/status`);
  if (!res.ok) throw new Error(`getShoeStatus failed: ${res.status}`);
  return res.json();
}
