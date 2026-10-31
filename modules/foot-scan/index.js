// رابط جاوااسکریپتی ماژول نیتیو اسکن پا (ARKit + LiDAR، فقط iOS).
//
// روی وب، اندروید و Expo Go ماژول نیتیو وجود ندارد؛ در آن حالت
// `isFootScanSupported()` مقدار false برمی‌گرداند و `NativeFootScanView`
// برابر null است، پس صفحه‌ی اسکن باید حالت جایگزین را نشان دهد.
import { requireOptionalNativeModule, requireNativeViewManager } from "expo-modules-core";

const FootScan = requireOptionalNativeModule("FootScan");

export const NativeFootScanView = FootScan
  ? (() => {
      try {
        return requireNativeViewManager("FootScan");
      } catch {
        return null;
      }
    })()
  : null;

/** آیا این دستگاه سخت‌افزار و بیلد لازم برای اسکن سه‌بعدی را دارد؟ */
export function isFootScanSupported() {
  if (!FootScan || !NativeFootScanView) return false;
  try {
    return FootScan.isSupported();
  } catch {
    return false;
  }
}

/** دلیل خوانا برای وقتی اسکن در دسترس نیست (برای نمایش به کاربر). */
export function footScanUnsupportedReason() {
  if (!FootScan || !NativeFootScanView) {
    return "اسکن سه‌بعدی به نسخه‌ی نصبی اپ روی آیفون Pro نیاز دارد (در Expo Go و نسخه‌ی وب کار نمی‌کند).";
  }
  try {
    return FootScan.unsupportedReason() || null;
  } catch {
    return null;
  }
}

/** گرفتن اجازه‌ی دوربین؛ ARKit بدون آن بالا نمی‌آید. */
export async function requestScanPermission() {
  if (!FootScan) return false;
  return FootScan.requestCameraPermission();
}

/** کمترین تعداد نقطه‌ای که ماژول نیتیو برای اندازه‌گیری لازم دارد. */
export const MINIMUM_POINTS = FootScan?.minimumPoints ?? 900;

export const footScanCapabilities = {
  scanSupported: FootScan?.scanSupported ?? false,
  hasLiDAR: FootScan?.hasLiDAR ?? false,
  supportsMesh: FootScan?.supportsMesh ?? false,
};
