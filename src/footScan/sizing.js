// تبدیل اندازه‌های اسکن پا به سایز اروپایی و کلاس عرض پا.
//
// مبنا: سیستم «پاریس پوینت» که سایزبندی اروپایی روی آن بنا شده —
// هر سایز معادل ۲/۳ سانتی‌متر طول کفی است. طول کفی = طول پا + فضای آزاد پنجه.

const PARIS_POINT_MM = 6.6667;

/** فضای آزاد استاندارد جلوی پنجه (میلی‌متر) برای کفش روزمره. */
export const TOE_ALLOWANCE_MM = 12;

const WIDTH_CLASSES = [
  { id: "narrow", label: "باریک", max: 0.355, hint: "پای باریک؛ مدل‌های جمع‌تر و بندی بهتر در پا می‌نشیند." },
  { id: "regular", label: "متوسط", max: 0.395, hint: "عرض پای شما استاندارد است و بیشتر مدل‌ها مناسب‌اند." },
  { id: "wide", label: "پهن", max: 0.425, hint: "پای پهن؛ مدل‌های پنجه‌پهن را ترجیح دهید." },
  { id: "extraWide", label: "خیلی پهن", max: Infinity, hint: "پنجه‌ی پهن لازم دارید؛ یک سایز بالاتر هم امتحان کنید." },
];

/** سایز اروپایی دقیق (اعشاری) از طول پا. */
export function euSizeFromLength(lengthMm, allowanceMm = TOE_ALLOWANCE_MM) {
  const length = Number(lengthMm) || 0;
  if (!length) return 0;
  return (length + allowanceMm) / PARIS_POINT_MM;
}

/** کلاس عرض پا از نسبت عرض پنجه به طول پا. */
export function widthClassOf(lengthMm, ballWidthMm) {
  const length = Number(lengthMm) || 0;
  const width = Number(ballWidthMm) || 0;
  if (!length || !width) return { ...WIDTH_CLASSES[1], ratio: 0 };
  const ratio = width / length;
  const found = WIDTH_CLASSES.find((c) => ratio < c.max) ?? WIDTH_CLASSES[WIDTH_CLASSES.length - 1];
  return { ...found, ratio };
}

function nearestAvailable(size, availableSizes) {
  if (!availableSizes?.length) return size;
  const numbers = availableSizes.map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!numbers.length) return size;
  // اول نزدیک‌ترین سایز بزرگ‌تر یا مساوی؛ کفش کوچک‌تر از پا قابل استفاده نیست.
  return numbers.find((n) => n >= size) ?? numbers[numbers.length - 1];
}

/**
 * پیشنهاد سایز از نتیجه‌ی اسکن.
 * `scan` = { lengthMm, ballWidthMm, ... } و `availableSizes` سایزهای همان محصول.
 */
export function recommendSize(scan, availableSizes = []) {
  if (!scan?.lengthMm) return null;

  const exact = euSizeFromLength(scan.lengthMm);
  const width = widthClassOf(scan.lengthMm, scan.ballWidthMm);

  // پای پهن از فضای سایز بالاتر سود می‌برد؛ پای باریک با رُند معمولی راحت است.
  const wide = width.id === "wide" || width.id === "extraWide";
  const base = wide ? Math.ceil(exact) : Math.round(exact);

  const recommended = nearestAvailable(base, availableSizes);
  const alternative = nearestAvailable(base + 1, availableSizes);

  const notes = [];
  notes.push(`طول پای شما ${Math.round(scan.lengthMm)} میلی‌متر است؛ با ${TOE_ALLOWANCE_MM} میلی‌متر فضای آزاد پنجه به سایز ${base} می‌رسیم.`);
  notes.push(width.hint);
  if (exact - Math.floor(exact) > 0.6 && !wide) {
    notes.push("پای شما بین دو سایز است؛ اگر جوراب ضخیم می‌پوشید سایز بالاتر را بردارید.");
  }

  return {
    exactSize: Math.round(exact * 10) / 10,
    recommendedSize: recommended,
    alternativeSize: alternative !== recommended ? alternative : null,
    insoleLengthMm: Math.round(scan.lengthMm + TOE_ALLOWANCE_MM),
    width,
    notes,
  };
}

/** کیفیت اسکن را به متن فارسی تبدیل می‌کند. */
export function qualityLabel(confidence) {
  const value = Number(confidence) || 0;
  if (value >= 0.8) return { label: "عالی", color: "#2E4F37" };
  if (value >= 0.6) return { label: "قابل قبول", color: "#6B7573" };
  return { label: "ضعیف — بهتر است دوباره اسکن کنید", color: "#B5754B" };
}
