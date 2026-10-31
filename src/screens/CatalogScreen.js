import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, concerns, formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";

export default function CatalogScreen({ navigation }) {
  const { concern, setConcern } = useCart();
  const { products, loading, error, reload } = useProducts();
  const filtered = concern ? products.filter((p) => p.concerns.includes(concern)) : products;

  return (
    <View style={styles.screen}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={[styles.chip, !concern && styles.chipActive]}
          onPress={() => setConcern(null)}
        >
          <Text style={[styles.chipText, !concern && styles.chipTextActive]}>همه</Text>
        </TouchableOpacity>
        {concerns.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, concern === c.id && styles.chipActive]}
            onPress={() => setConcern(c.id)}
          >
            <Text style={[styles.chipText, concern === c.id && styles.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.empty}>اتصال به فروشگاه برقرار نشد.</Text>
          <TouchableOpacity onPress={reload}><Text style={styles.retry}>تلاش دوباره</Text></TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          ListEmptyComponent={<Text style={styles.empty}>محصولی در این دسته موجود نیست</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("جزئیات محصول", { product: item })}>
              <View style={[styles.thumb, { backgroundColor: item.color }]}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumbImg} resizeMode="cover" />
                ) : (
                  <Feather name="activity" size={30} color="rgba(255,255,255,0.75)" />
                )}
                {!item.inStock && (
                  <View style={styles.outBadge}><Text style={styles.outBadgeText}>ناموجود</Text></View>
                )}
              </View>
              <View style={{ padding: 10 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  chipsRow: { paddingTop: 14, maxHeight: 50 },
  chip: { borderWidth: 1, borderColor: "#D8D2C4", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, marginLeft: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 11, color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  center: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 12 },
  thumb: { height: 110, alignItems: "center", justifyContent: "center" },
  thumbImg: { width: "100%", height: "100%" },
  outBadge: { position: "absolute", top: 6, left: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  outBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  cardTitle: { fontSize: 12, fontWeight: "600", color: colors.primary, textAlign: "right" },
  cardPrice: { fontSize: 11, fontWeight: "700", color: colors.accent, marginTop: 4, textAlign: "right" },
  empty: { textAlign: "center", color: colors.textFaint, fontSize: 12, marginTop: 40 },
  retry: { textAlign: "center", color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 10 },
});
