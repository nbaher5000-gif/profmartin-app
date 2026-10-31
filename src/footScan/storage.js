// ذخیره‌ی آخرین اسکن هر پا روی خود گوشی.
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "profmartin.footScan.v1";

/** { right: {...scan}, left: {...scan}, updatedAt: ISOString } */
export async function loadScans() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveScan(scan) {
  const side = scan?.footSide === "left" ? "left" : "right";
  const current = (await loadScans()) ?? {};
  const next = { ...current, [side]: scan, updatedAt: new Date().toISOString() };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // اگر ذخیره نشد، نتیجه‌ی همین نشست هنوز در حافظه‌ی اپ هست.
  }
  return next;
}

export async function clearScans() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // چیزی برای پاک کردن نبود
  }
  return null;
}
