import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { useFootScan } from "../footScan/FootScanContext";

export default function ProductScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart } = useCart();
  const { hasScan, sizeFor } = useFootScan();
  const [size, setSize] = useState(null);

  // پیشنهاد سایز بر اساس آخرین اسکن پا (پای بزرگ‌تر مبنا است)
  const recommendation = useMemo(() => sizeFor(product.sizes), [sizeFor, product.sizes]);

  // سایز پیشنهادی را از پیش انتخاب می‌کنیم تا کاربر فقط تأیید کند
  useEffect(() => {
    if (size === null && recommendation?.recommendedSize) {
      setSize(recommendation.recommendedSize);
    }
  }, [recommendation, size]);

  return (
    <ScrollView style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: product.color }]}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <Feather name="activity" size={64} color="rgba(255,255,255,0.7)" />
        )}
      </View>

      <View style={{ padding: 20 }}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {!product.inStock && <Text style={styles.outOfStock}>این مدل فعلاً ناموجود است</Text>}
        <Text style={styles.desc}>
          طراحی‌شده با میان‌کفی طبی و قوس داخلی برای حمایت مناسب از پا در استفاده روزانه. رویه از چرم طبیعی و کفی ضدلغزش.
        </Text>

        <Text style={styles.sizeLabel}>انتخاب سایز</Text>

        {recommendation ? (
          <TouchableOpacity style={styles.scanBanner} onPress={() => navigation.navigate("اسکن پا")}>
            <Feather name="check-circle" size={16} color={colors.successText} />
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.scanBannerTitle}>
                سایز پیشنهادی از اسکن پای شما: {recommendation.recommendedSize}
              </Text>
              <Text style={styles.scanBannerText}>
                طول پا {Math.round(recommendation.insoleLengthMm - 12)} میلی‌متر · عرض {recommendation.width.label}
                {recommendation.alternativeSize ? ` · اگر تنگ بود ${recommendation.alternativeSize}` : ""}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.scanCta} onPress={() => navigation.navigate("اسکن پا")}>
            <Feather name="box" size={16} color="#fff" />
            <Text style={styles.scanCtaText}>سایزت را نمی‌دانی؟ پا را سه‌بعدی اسکن کن</Text>
          </TouchableOpacity>
        )}

        <View style={styles.sizeRow}>
          {product.sizes.map((s) => {
            const suggested = recommendation?.recommendedSize === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.sizeBtn, suggested && styles.sizeBtnSuggested, size === s && styles.sizeBtnActive]}
                onPress={() => setSize(s)}
              >
                <Text style={[styles.sizeText, size === s && styles.sizeTextActive]}>{s}</Text>
                {suggested && <View style={[styles.sizeDot, size === s && styles.sizeDotActive]} />}
              </TouchableOpacity>
            );
          })}
        </View>
        {hasScan && !recommendation && (
          <Text style={styles.warn}>اسکن پا ذخیره شده ولی برای این محصول سایز مناسب پیدا نشد.</Text>
        )}
        {!size && <Text style={styles.warn}>سایز خود را انتخاب کنید</Text>}

        <TouchableOpacity
          style={[styles.addBtn, (!size || !product.inStock) && styles.addBtnDisabled]}
          disabled={!size || !product.inStock}
          onPress={() => {
            addToCart(product, size);
            navigation.navigate("سبد خرید");
          }}
        >
          <Text style={[styles.addText, (!size || !product.inStock) && styles.addTextDisabled]}>
            {product.inStock ? "افزودن به سبد خرید" : "ناموجود"}
          </Text>
        </TouchableOpacity>

        {product.permalink && (
          <TouchableOpacity onPress={() => navigation.navigate("سایت")}>
            <Text style={styles.siteLink}>مشاهده در سایت</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 220, alignItems: "center", justifyContent: "center" },
  heroImg: { width: "100%", height: "100%" },
  name: { fontSize: 17, fontWeight: "700", color: colors.primary, textAlign: "right" },
  price: { fontSize: 15, fontWeight: "700", color: colors.accent, marginTop: 4, textAlign: "right" },
  outOfStock: { fontSize: 11, color: "#B5754B", marginTop: 4, textAlign: "right" },
  desc: { fontSize: 12, color: colors.textMuted, marginTop: 12, lineHeight: 19, textAlign: "right" },
  sizeLabel: { fontSize: 12, fontWeight: "700", color: colors.primary, marginTop: 20, marginBottom: 8, textAlign: "right" },
  sizeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 },
  sizeBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#D8D2C4", alignItems: "center", justifyContent: "center" },
  sizeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeBtnSuggested: { borderColor: colors.accent, borderWidth: 2 },
  sizeDot: { position: "absolute", bottom: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  sizeDotActive: { backgroundColor: "#fff" },
  scanBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.successBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  scanBannerTitle: { fontSize: 12, fontWeight: "700", color: colors.successText, textAlign: "right" },
  scanBannerText: { fontSize: 10, color: colors.textMuted, marginTop: 3, textAlign: "right" },
  scanCta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  scanCtaText: { flex: 1, fontSize: 12, fontWeight: "700", color: "#fff", textAlign: "right" },
  sizeText: { fontSize: 13, fontWeight: "600", color: "#4B5451" },
  sizeTextActive: { color: "#fff" },
  warn: { fontSize: 10, color: "#B5754B", marginTop: 8, textAlign: "right" },
  addBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  addBtnDisabled: { backgroundColor: "#E6E1D8" },
  addText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  addTextDisabled: { color: "#A3A39A" },
  siteLink: { textAlign: "center", color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 14 },
});
