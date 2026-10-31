import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { placeOrder } from "../api/orders";
import { requestOtp, verifyOtp } from "../api/auth";
import { useFootScan } from "../footScan/FootScanContext";
import { widthClassOf } from "../footScan/sizing";

export default function CheckoutScreen({ navigation }) {
  const { cart, cartTotal, recordOrder } = useCart();
  const { primaryScan } = useFootScan();

  // اندازه‌های اسکن پا همراه سفارش می‌رود تا فروشگاه بتواند سایز را کنترل کند
  const footScanSummary = primaryScan
    ? {
        lengthMm: Math.round(primaryScan.lengthMm),
        ballWidthMm: Math.round(primaryScan.ballWidthMm),
        widthLabel: widthClassOf(primaryScan.lengthMm, primaryScan.ballWidthMm).label,
      }
    : null;

  const [stage, setStage] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [otpToken, setOtpToken] = useState(null);
  const [busy, setBusy] = useState(false);

  // پیام خطای شبکه برای کاربر قابل فهم‌تر از «Network request failed» است
  const friendly = (err) =>
    err?.status || err?.reason ? err.message : "ارتباط با سرور برقرار نشد؛ اینترنت را بررسی کنید.";

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      await requestOtp(phone);
      setOtp("");
      setStage("otp");
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    setBusy(true);
    setError(null);
    try {
      const { token } = await verifyOtp(phone, otp);
      setOtpToken(token);
      setStage("details");
    } catch (err) {
      setError(friendly(err));
      // کد منقضی یا قفل‌شده دیگر قابل استفاده نیست؛ ورودی را پاک می‌کنیم
      if (err.reason === "expired" || err.reason === "locked") setOtp("");
    } finally {
      setBusy(false);
    }
  }

  async function submitOrder() {
    setStage("submitting");
    setError(null);
    try {
      // هر ردیف سبد با سایز خودش ثبت می‌شود؛ ردیف‌های هم‌محصول و هم‌سایز با هم جمع می‌شوند
      const byProductAndSize = new Map();
      for (const item of cart) {
        const key = `${item.id}-${item.size ?? ""}`;
        const existing = byProductAndSize.get(key);
        if (existing) existing.qty += item.qty;
        else byProductAndSize.set(key, { id: Number(item.id), qty: item.qty, size: item.size ?? null });
      }
      const items = [...byProductAndSize.values()];

      const order = await placeOrder({ phone, name, address, items, footScan: footScanSummary, otpToken });
      setOtpToken(null); // توکن یکبارمصرف است و مصرف شد
      recordOrder(order);
      setResult(order);
      setStage("success");
    } catch (err) {
      if (err.reason === "otp_required") {
        // توکن منقضی یا مصرف شده؛ باید شماره دوباره تایید شود
        setOtpToken(null);
        setOtp("");
        setError(err.message);
        setStage("phone");
        return;
      }
      setError(friendly(err));
      setStage("details");
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 24, paddingTop: 40, flexGrow: 1 }}>
      {stage === "phone" && (
        <>
          <Feather name="phone" size={26} color={colors.accent} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>شماره موبایل خود را وارد کنید</Text>
          <Text style={styles.subtitle}>کد تایید در واتساپ همین شماره ارسال می‌شود</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="09xxxxxxxxx"
            keyboardType="phone-pad"
            style={styles.input}
            textAlign="left"
          />
          <TouchableOpacity
            style={[styles.btn, (phone.length < 10 || busy) && styles.btnDisabled]}
            disabled={phone.length < 10 || busy}
            onPress={sendCode}
          >
            {busy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.btnText, phone.length < 10 && styles.btnTextDisabled]}>ارسال کد تایید</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {stage === "otp" && (
        <>
          <Feather name="check" size={26} color={colors.accent} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>کد تایید را وارد کنید</Text>
          <Text style={styles.subtitle}>کد ۴ رقمی در واتساپ {phone || "شماره شما"} ارسال شد</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="- - - -"
            keyboardType="number-pad"
            maxLength={4}
            style={[styles.input, { textAlign: "center", letterSpacing: 10, fontSize: 18 }]}
          />
          <TouchableOpacity
            style={[styles.btn, (otp.length < 4 || busy) && styles.btnDisabled]}
            disabled={otp.length < 4 || busy}
            onPress={confirmCode}
          >
            {busy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.btnText, otp.length < 4 && styles.btnTextDisabled]}>تایید</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={busy}
            onPress={() => {
              setError(null);
              setStage("phone");
            }}
          >
            <Text style={styles.linkText}>شماره را اشتباه زدم / ارسال دوباره کد</Text>
          </TouchableOpacity>
        </>
      )}

      {stage === "details" && (
        <>
          <Feather name="map-pin" size={26} color={colors.accent} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>مشخصات گیرنده</Text>
          <Text style={styles.subtitle}>فاکتور به همین نام و آدرس صادر می‌شود</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>نام و نام‌خانوادگی</Text>
          <TextInput value={name} onChangeText={setName} placeholder="مثلاً فرزاد باهر" style={styles.input} />

          <Text style={styles.label}>آدرس کامل</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="شهر، خیابان، پلاک"
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            multiline
          />

          {footScanSummary && (
            <Text style={styles.scanNote}>
              اندازه‌های اسکن پای شما (طول {footScanSummary.lengthMm} میلی‌متر · عرض {footScanSummary.widthLabel})
              همراه سفارش برای فروشگاه ارسال می‌شود.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.btn, (name.trim().length < 2 || address.trim().length < 8) && styles.btnDisabled]}
            disabled={name.trim().length < 2 || address.trim().length < 8}
            onPress={submitOrder}
          >
            <Text
              style={[
                styles.btnText,
                (name.trim().length < 2 || address.trim().length < 8) && styles.btnTextDisabled,
              ]}
            >
              تایید و ثبت سفارش · {formatPrice(cartTotal)}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {stage === "submitting" && (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subtitle, { marginTop: 16, textAlign: "center" }]}>
            در حال ثبت سفارش و صدور فاکتور...
          </Text>
        </View>
      )}

      {stage === "success" && (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Feather name="check-circle" size={48} color={colors.primary} />
          <Text style={[styles.title, { textAlign: "center", marginTop: 14 }]}>سفارش شما ثبت شد ✅</Text>
          {result?.wcOrderId && <Text style={styles.subtitle}>شماره سفارش: {result.wcOrderId}</Text>}
          <Text style={[styles.subtitle, { textAlign: "center", marginTop: 6 }]}>
            {result?.invoiceSent
              ? "فاکتور رسمی به واتساپ شما ارسال شد."
              : "فاکتور کمی بعد ارسال می‌شود."}
          </Text>
          <TouchableOpacity style={[styles.btn, { marginTop: 24 }]} onPress={() => navigation.navigate("پروفایل")}>
            <Text style={styles.btnText}>مشاهده سفارش‌ها</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 15, fontWeight: "700", color: colors.primary, textAlign: "right" },
  subtitle: { fontSize: 11, color: colors.textFaint, marginTop: 4, marginBottom: 20, textAlign: "right" },
  label: { fontSize: 11, fontWeight: "700", color: colors.primary, marginBottom: 6, textAlign: "right" },
  error: { fontSize: 11, color: "#B5342B", backgroundColor: "#F6E3DC", borderRadius: 10, padding: 10, marginBottom: 14, textAlign: "right" },
  scanNote: { fontSize: 11, color: colors.successText, backgroundColor: colors.successBg, borderRadius: 10, padding: 10, marginTop: 6, marginBottom: 4, lineHeight: 19, textAlign: "right" },
  input: { borderWidth: 1, borderColor: "#D8D2C4", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 13, marginBottom: 16, textAlign: "right" },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  btnDisabled: { backgroundColor: "#E6E1D8" },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  btnTextDisabled: { color: "#A3A39A" },
  linkText: { color: colors.primary, fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 16 },
});
