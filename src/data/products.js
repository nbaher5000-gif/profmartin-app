export const colors = {
  bg: "#F7F5F1",
  primary: "#1F3A3D",
  primaryLight: "#2F4A4D",
  accent: "#A9682F",
  cardBorder: "#E6E1D8",
  textMuted: "#6B7573",
  textFaint: "#8A928F",
  chipBg: "#EFE9DD",
  successBg: "#DCE9DF",
  successText: "#2E4F37",
};

export const concerns = [
  { id: "flat", label: "کف پای صاف", desc: "قوس مناسب و حمایت داخلی", color: "#2F4A4D" },
  { id: "heel", label: "درد پاشنه", desc: "میان‌کفی نرم و ضربه‌گیر", color: "#3f4f49" },
  { id: "diabetic", label: "پای دیابتی", desc: "بدون درز داخلی، فضای باز", color: "#4a3220" },
  { id: "hallux", label: "هالوکس والگوس", desc: "پنجه‌ی پهن، بدون فشار به شست", color: "#4a3a2a" },
  { id: "general", label: "راحتی روزمره", desc: "برای ایستادن و پیاده‌روی طولانی", color: "#5c4530" },
];

// محصولات از API مارتین‌بات می‌آیند: src/api/products.js و src/context/ProductsContext.js

export function formatPrice(p) {
  const n = Number(p) || 0;
  return n ? n.toLocaleString("fa-IR") + " تومان" : "تماس بگیرید";
}
