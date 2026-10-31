// محصولات واقعی از API مارتین‌بات (همان ۳۵ محصولی که از سایت ووکامرس sync شده‌اند)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://bot.n8nprofmartin.site";

// سایزهای پیش‌فرض تا وقتی سایزهای هر مدل از ووکامرس sync نشده‌اند
const DEFAULT_SIZES = [37, 38, 39, 40, 41, 42, 43, 44, 45];

// رنگ پس‌زمینه‌ی کارت وقتی محصول عکس ندارد
const FALLBACK_COLORS = ["#2F4A4D", "#3f4f49", "#4a3220", "#5c4530", "#16282a", "#33393a"];

// تشخیص «نیاز پا» از روی نام محصول، برای فیلترهای صفحه‌ی خانه و کاتالوگ
const CONCERN_KEYWORDS = [
  ["diabetic", /دیابت/],
  ["hallux", /هالوکس|هالوکوس|والگوس/],
  ["heel", /پاشنه|خار/],
  ["flat", /صاف|قوس|ارتوپدی/],
];

function detectConcerns(name) {
  const found = CONCERN_KEYWORDS.filter(([, re]) => re.test(name)).map(([id]) => id);
  return found.length ? found : ["general"];
}

function normalize(p, index) {
  let categories = [];
  try {
    categories = JSON.parse(p.categories ?? "[]");
  } catch {
    categories = [];
  }
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price) || 0,
    regularPrice: Number(p.regular_price) || 0,
    inStock: p.stock_status === "instock",
    image: p.image || null,
    permalink: p.permalink || null,
    categories,
    concerns: detectConcerns(p.name),
    sizes: DEFAULT_SIZES,
    color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  };
}

export async function fetchProducts() {
  const res = await fetch(`${API_BASE_URL}/api/products?limit=100`);
  if (!res.ok) throw new Error(`دریافت محصولات ناموفق بود (${res.status})`);
  const rows = await res.json();
  return rows.map(normalize);
}
