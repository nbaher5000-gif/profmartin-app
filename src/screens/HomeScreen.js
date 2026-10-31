import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, concerns } from "../data/products";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";

export default function HomeScreen({ navigation }) {
  const { setConcern } = useCart();
  const { products, loading, error, reload } = useProducts();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.title}>پای شما یک نقشه دارد.{"\n"}کفش‌مان را بر اساس آن انتخاب کنید.</Text>
      <Text style={styles.subtitle}>نوع نیاز پایتان را انتخاب کنید تا مدل‌های مناسب را نشان دهیم</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>اتصال به فروشگاه برقرار نشد.</Text>
          <TouchableOpacity onPress={reload}>
            <Text style={styles.retryText}>تلاش دوباره</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.grid}>
        {concerns.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => {
              setConcern(c.id);
              navigation.navigate("محصولات");
            }}
          >
            <Feather name="activity" size={20} color={colors.accent} style={{ marginBottom: 8 }} />
            <Text style={styles.cardTitle}>{c.label}</Text>
            <Text style={styles.cardDesc}>{c.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => {
          setConcern(null);
          navigation.navigate("محصولات");
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>مشاهده همه محصولات ({products.length})</Text>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Feather name="package" size={20} color={colors.accent} style={{ marginTop: 2 }} />
        <View style={{ marginRight: 10, flex: 1 }}>
          <Text style={styles.infoTitle}>ارسال به سراسر ایران</Text>
          <Text style={styles.infoDesc}>تحویل ۲ تا ۴ روز کاری، امکان پرداخت در محل</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 20, fontWeight: "700", color: colors.primary, lineHeight: 30, textAlign: "right" },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 8, textAlign: "right" },
  errorBox: { backgroundColor: "#F6E3DC", borderRadius: 12, padding: 12, marginTop: 14, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 11, color: "#8A3F23" },
  retryText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 24 },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "flex-end",
  },
  cardTitle: { fontSize: 13, fontWeight: "600", color: colors.primary, textAlign: "right" },
  cardDesc: { fontSize: 10, color: colors.textFaint, marginTop: 4, textAlign: "right", lineHeight: 15 },
  ctaButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 12 },
  ctaText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  infoBox: { backgroundColor: colors.chipBg, borderRadius: 16, padding: 14, flexDirection: "row-reverse", alignItems: "flex-start" },
  infoTitle: { fontSize: 12, fontWeight: "700", color: colors.primary, textAlign: "right" },
  infoDesc: { fontSize: 11, color: colors.textMuted, marginTop: 3, textAlign: "right" },
});
