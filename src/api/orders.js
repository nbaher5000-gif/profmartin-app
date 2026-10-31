import { API_BASE_URL } from "./products";

/**
 * ثبت سفارش واقعی روی مارتین‌بات: در ووکامرس ثبت می‌شود و فاکتور PDF
 * خودکار در واتساپ همان شماره ارسال می‌شود.
 * items: [{ id, qty, size }] — شناسه، تعداد و سایز؛ قیمت و نام را خود سرور از دیتابیس می‌خواند.
 * footScan: اختیاری — { lengthMm, ballWidthMm, widthLabel } که به‌صورت یادداشت سفارش ثبت می‌شود.
 */
export async function placeOrder({ phone, name, address, items, footScan, otpToken }) {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name, address, items, footScan, otpToken }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `ثبت سفارش ناموفق بود (${res.status})`);
    err.reason = body.reason; // otp_required → باید دوباره کد بگیرد
    throw err;
  }
  return body; // { localOrderId, wcOrderId, total, invoiceSent, invoiceUrl }
}
