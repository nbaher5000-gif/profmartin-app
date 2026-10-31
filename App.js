import React from "react";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import { CartProvider } from "./src/context/CartContext";
import { ProductsProvider } from "./src/context/ProductsContext";
import { FootScanProvider } from "./src/footScan/FootScanContext";

// راست‌چین کردن کل اپ برای فارسی
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function App() {
  return (
    <ProductsProvider>
      <FootScanProvider>
        <CartProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </CartProvider>
      </FootScanProvider>
    </ProductsProvider>
  );
}