# نصب اپ روی آیفون بدون اکانت Apple Developer

یک مک ابری در GitHub اپ را کامپایل می‌کند و IPA امضانشده می‌دهد. **Sideloadly** با Apple ID رایگان خودتان آن را امضا و روی آیفون نصب می‌کند.
ARKit/LiDAR مجوز ویژه‌ای (entitlement) نمی‌خواهد، پس اسکن پا با این روش هم کار می‌کند.

## ۱) یک‌بار: فرستادن پروژه به GitHub

در سایت GitHub یک مخزن خالی بسازید (ترجیحاً **Private**؛ در کد هیچ رمز و کلیدی نیست، فقط آدرس‌های عمومی API). بعد در پوشه‌ی پروژه:

```bash
git init
```

```bash
git add -A
```

```bash
git commit -m "Professor Martin app"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR-USERNAME/profmartin-app.git
```

```bash
git push -u origin main
```

(`YOUR-USERNAME` را با نام کاربری خودتان عوض کنید. هنگام push، لاگین GitHub را خودتان انجام دهید.)

## ۲) ساخت IPA

GitHub ← تب **Actions** ← **iOS unsigned build (for Sideloadly)** ← **Run workflow**.
حدود ۲۰ تا ۴۰ دقیقه طول می‌کشد. در پایان از بخش **Artifacts** فایل `ProfessorMartin-unsigned-ipa` را دانلود کنید (zip است؛ داخلش `ProfessorMartin-unsigned.ipa` است).

اگر بیلد قرمز شد، از همان صفحه‌ی اجرا artifact با نام `xcodebuild-log` را دانلود کنید و برای من بفرستید. کامپایل Swift اولین بار روی مک واقعی انجام می‌شود و ممکن است یک اصلاح کوچک بخواهد.

## ۳) نصب با Sideloadly (ویندوز)

1. **iTunes** و **iCloud** را از سایت خود Apple نصب کنید (نه نسخه‌ی Microsoft Store).
2. Sideloadly را از `sideloadly.io` دانلود و نصب کنید.
3. آیفون را با کابل وصل کنید و روی گوشی **Trust** را بزنید.
4. در Sideloadly، Apple ID رایگان را وارد کنید (رمز را فقط خودتان در برنامه بزنید؛ بهتر است یک Apple ID جدا فقط برای این کار باشد).
5. فایل IPA را داخل Sideloadly بکشید و **Start** را بزنید.

## ۴) روی آیفون

1. **Settings ← Privacy & Security ← Developer Mode** را روشن کنید (بعد از اولین نصب ظاهر می‌شود) و گوشی را ری‌استارت کنید.
2. **Settings ← General ← VPN & Device Management** ← Apple ID خودتان ← **Trust**.
3. اپ را باز کنید ← تب محصولات ← یک محصول ← «سایزت را نمی‌دانی؟ پا را سه‌بعدی اسکن کن».

## محدودیت‌های Apple ID رایگان

- گواهی **۷ روز** اعتبار دارد؛ بعدش اپ باز نمی‌شود تا دوباره با Sideloadly امضا شود (گزینه‌ی Auto Refresh در Sideloadly کمک می‌کند).
- حداکثر ۳ اپ فعال با یک Apple ID رایگان.
- این بیلد **Release** است و سرور Metro لازم ندارد. برای هر تغییر در کد، باید دوباره workflow را اجرا و IPA جدید نصب کنید.
