import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../data/products";
import { useCart } from "../context/CartContext";
import { useFootScan } from "../footScan/FootScanContext";
import { recommendSize } from "../footScan/sizing";

export default function ProfileScreen({ navigation }) {
  const { orders } = useCart();
  const { primaryScan, scans, reset } = useFootScan();
  const recommendation = primaryScan ? recommendSize(primaryScan) : null;

  const menu = [
    { label: "اطلاعات و آدرس‌ها", hint: null, onPress: null },
    {
      label: "اسکن و سایز پا",
      hint: recommendation
        ? `سایز ${recommendation.recommendedSize} · طول ${Math.round(primaryScan.lengthMm)} میلی‌متر`
        : "هنوز اسکن نشده — برای سایز دقیق پا را اسکن کنید",
      onPress: () => navigation.navigate("اسکن پا"),
    },
    {
      label: "پشتیبانی در واتساپ",
      hint: null,
      onPress: () => Linking.openURL("https://wa.me/989145000480"),
    },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>م</Text>
        </View>
        <View style={{ marginRight: 12 }}>
          <Text style={styles.name}>مشتری مهمان</Text>
          <Text style={styles.phone}>۰۹۱۲ ۲۳۴ ۵۶۷۸</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>سفارش‌های اخیر</Text>
      <View style={styles.listBox}>
        {orders.map((o, idx) => (
          <View key={o.id} style={[styles.orderRow, idx !== orders.length - 1 && styles.rowBorder]}>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{o.status}</Text>
            </View>
            <View>
              <Text style={styles.orderId}>سفارش #{o.id}</Text>
              <Text style={styles.orderDate}>{o.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {recommendation && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>اندازه‌های پای شما</Text>
          <View style={styles.scanCard}>
            <View style={styles.scanSizeBox}>
              <Text style={styles.scanSizeLabel}>سایز</Text>
              <Text style={styles.scanSize}>{recommendation.recommendedSize}</Text>
            </View>
            <View style={{ flex: 1, marginRight: 14 }}>
              <Text style={styles.scanLine}>طول پا: {Math.round(primaryScan.lengthMm)} میلی‌متر</Text>
              <Text style={styles.scanLine}>عرض پنجه: {Math.round(primaryScan.ballWidthMm)} میلی‌متر</Text>
              <Text style={styles.scanLine}>عرض پا: {recommendation.width.label}</Text>
              <Text style={styles.scanHint}>
                {scans?.right && scans?.left ? "هر دو پا اسکن شده" : "فقط یک پا اسکن شده"} · مبنا پای بزرگ‌تر
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={reset}>
            <Text style={styles.resetText}>پاک کردن اسکن ذخیره‌شده</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={[styles.listBox, { marginTop: 20 }]}>
        {menu.map((item, idx, arr) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuRow, idx !== arr.length - 1 && styles.rowBorder]}
            disabled={!item.onPress}
            onPress={item.onPress ?? undefined}
          >
            <Feather name="chevron-left" size={16} color="#C4C0B4" />
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.menuText}>{item.label}</Text>
              {!!item.hint && <Text style={styles.menuHint}>{item.hint}</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  avatarRow: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 24 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "700", color: colors.primary, textAlign: "right" },
  phone: { fontSize: 11, color: colors.textFaint, marginTop: 2, textAlign: "right" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.primary, marginBottom: 8, textAlign: "right" },
  listBox: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder },
  orderRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#EFEBE1" },
  orderId: { fontSize: 12, fontWeight: "600", color: colors.primary, textAlign: "right" },
  orderDate: { fontSize: 10, color: colors.textFaint, marginTop: 2, textAlign: "right" },
  statusPill: { backgroundColor: colors.chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, color: colors.textMuted },
  menuRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", padding: 14 },
  menuText: { fontSize: 12, color: colors.primary, textAlign: "right" },
  menuHint: { fontSize: 10, color: colors.textFaint, marginTop: 3, textAlign: "right" },
  scanCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
  },
  scanSizeBox: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center" },
  scanSizeLabel: { color: "rgba(255,255,255,0.8)", fontSize: 9 },
  scanSize: { color: "#fff", fontSize: 22, fontWeight: "800" },
  scanLine: { fontSize: 11, color: colors.textMuted, textAlign: "right", marginBottom: 2 },
  scanHint: { fontSize: 10, color: colors.textFaint, textAlign: "right", marginTop: 4 },
  resetText: { fontSize: 11, color: "#B5754B", textAlign: "center", marginTop: 10 },
});
