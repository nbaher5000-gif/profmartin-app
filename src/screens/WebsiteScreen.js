import React from "react";
import { Platform, View, StyleSheet } from "react-native";

const SITE_URL = "https://profmartin.co";

// react-native-webview does not support the web platform (it falls back to a
// "not supported" message there), so on web we render a plain <iframe>
// instead, and keep the native WebView for iOS/Android.
export default function WebsiteScreen() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          src={SITE_URL}
          title="Professor Martin"
          style={styles.iframe}
        />
      </View>
    );
  }

  const { WebView } = require("react-native-webview");
  return <WebView source={{ uri: SITE_URL }} style={{ flex: 1 }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iframe: { flex: 1, border: "none", width: "100%", height: "100%" },
});
