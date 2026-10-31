import { API_BASE_URL } from "./products";

// ورود با کد یکبارمصرف: کد ۴ رقمی در واتساپ همان شماره ارسال می‌شود
async function postJson(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `خطا در ارتباط با سرور (${res.status})`);
    err.status = res.status;
    err.reason = data.reason;
    err.retryAfterSec = data.retryAfterSec;
    throw err;
  }
  return data;
}

/** ارسال کد تایید در واتساپ؛ هر شماره حداکثر هر ۶۰ ثانیه یک‌بار می‌تواند کد بگیرد. */
export function requestOtp(phone) {
  return postJson("/api/auth/otp/request", { phone });
}

/** بررسی کد؛ خروجی { token, expiresInSec } که برای ثبت سفارش لازم است. */
export function verifyOtp(phone, code) {
  return postJson("/api/auth/otp/verify", { phone, code });
}
