import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import CatalogScreen from "../screens/CatalogScreen";
import ProductScreen from "../screens/ProductScreen";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WebsiteScreen from "../screens/WebsiteScreen";
import StepRewardsScreen from "../screens/StepRewardsScreen";
import FootScanScreen from "../footScan/FootScanScreen";
import { colors } from "../data/products";
import { useCart } from "../context/CartContext";

const Tab = createBottomTabNavigator();
const CatalogStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function headerOptions(title) {
  return {
    title,
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: "#fff",
    headerTitleStyle: { fontWeight: "700" },
    headerTitleAlign: "center",
  };
}

function CatalogStackScreen() {
  return (
    <CatalogStack.Navigator>
      <CatalogStack.Screen name="محصولات" component={CatalogScreen} options={headerOptions("محصولات")} />
      <CatalogStack.Screen name="جزئیات محصول" component={ProductScreen} options={headerOptions("جزئیات محصول")} />
      <CatalogStack.Screen name="اسکن پا" component={FootScanScreen} options={headerOptions("اسکن سه‌بعدی پا")} />
    </CatalogStack.Navigator>
  );
}

function CartStackScreen() {
  return (
    <CartStack.Navigator>
      <CartStack.Screen name="سبد خرید" component={CartScreen} options={headerOptions("سبد خرید")} />
      <CartStack.Screen name="پرداخت" component={CheckoutScreen} options={headerOptions("پرداخت")} />
    </CartStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="حساب من" component={ProfileScreen} options={headerOptions("حساب من")} />
      <ProfileStack.Screen name="اسکن پا" component={FootScanScreen} options={headerOptions("اسکن سه‌بعدی پا")} />
    </ProfileStack.Navigator>
  );
}

function CartTabIcon({ color, size }) {
  const { cartCount } = useCart();
  return (
    <View>
      <Feather name="shopping-bag" size={size} color={color} />
      {cartCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            left: -8,
            backgroundColor: colors.accent,
            borderRadius: 8,
            width: 16,
            height: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>{cartCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="محصولات"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: "#A3A39A",
          tabBarLabelStyle: { fontSize: 10 },
          tabBarIcon: ({ color, size }) => {
            const icons = {
              خانه: "home",
              محصولات: "activity",
              "سبد خرید": null,
              "پاداش قدم": "award",
              پروفایل: "user",
              سایت: "globe",
            };
            if (route.name === "سبد خرید") return <CartTabIcon color={color} size={size} />;
            return <Feather name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="خانه" component={HomeScreen} />
        <Tab.Screen name="محصولات" component={CatalogStackScreen} />
        <Tab.Screen name="سبد خرید" component={CartStackScreen} />
        <Tab.Screen name="پاداش قدم" component={StepRewardsScreen} />
        <Tab.Screen name="پروفایل" component={ProfileStackScreen} />
        <Tab.Screen name="سایت" component={WebsiteScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
