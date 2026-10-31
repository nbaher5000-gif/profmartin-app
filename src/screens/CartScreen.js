import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";

export default function CartScreen({ navigation }) {
  const { cart, cartTotal, changeQty } = useCart();

  if (cart.length === 0) {
    return (
      <View style={[styles.screen, styles.emptyWrap]}>
        <Feather name="shopping-bag" size={40} color="#D8D2C4" />
        <Text style={styles.emptyText}>سبد خرید شما خالی است</Text>
        <TouchableOpacity onPress={() => navigation.navigate("محصولات")}>
          <Text style={styles.emptyLink}>مشاهده محصولات</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.thumb, { backgroundColor: item.color }]}>
              <Feather name="activity" size={20} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSize}>سایز {item.size}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.key, -1)}>
                <Feather name="minus" size={13} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.key, 1)}>
                <Feather name="plus" size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View>
            <View style={styles.summaryBox}>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>جمع کل</Text>
                <Text style={styles.summaryLabel}>{formatPrice(cartTotal)}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>هزینه ارسال</Text>
                <Text style={styles.summaryLabel}>رایگان</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryLine}>
                <Text style={styles.summaryTotal}>مبلغ نهایی</Text>
                <Text style={styles.summaryTotal}>{formatPrice(cartTotal)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate("پرداخت")}>
              <Text style={styles.checkoutText}>ادامه و پرداخت</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  emptyWrap: { alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 13, color: colors.textFaint },
  emptyLink: { fontSize: 12, fontWeight: "700", color: colors.primary, textDecorationLine: "underline" },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  thumb: { width: 60, height: 60, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 12, fontWeight: "600", color: colors.primary, textAlign: "right" },
  itemSize: { fontSize: 10, color: colors.textFaint, marginTop: 2, textAlign: "right" },
  itemPrice: { fontSize: 11, fontWeight: "700", color: colors.accent, marginTop: 4, textAlign: "right" },
  qtyRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: "#D8D2C4", alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 12, fontWeight: "700", width: 16, textAlign: "center" },
  summaryBox: { backgroundColor: colors.chipBg, borderRadius: 16, padding: 16, marginTop: 12 },
  summaryLine: { flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 12, color: colors.textMuted },
  divider: { height: 1, backgroundColor: "#D8D2C4", marginVertical: 6 },
  summaryTotal: { fontSize: 14, fontWeight: "700", color: colors.primary },
  checkoutBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  checkoutText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
