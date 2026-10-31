/**
 * ActivateShoeScreen.js
 * ------------------------------------------------------------------
 * Flow: buyer scans the QR code printed on their shoe box/tag ->
 * screen calls `activateShoe` -> backend binds qrUuid to buyer+device ->
 * `onActivated` fires so the host can move on to BankAccountScreen (if no
 * bank account on file yet) or straight to StepDashboardScreen.
 *
 * Uses expo-camera's CameraView with built-in barcode scanning.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { activateShoe } from '../api/stepSync';
import { colors } from '../../data/products';

export default function ActivateShoeScreen({ buyerPhone, onActivated }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [activating, setActivating] = useState(false);
  const [handled, setHandled] = useState(false);

  const handleScan = useCallback(
    async ({ data }) => {
      if (activating || handled) return;
      setActivating(true);
      try {
        const result = await activateShoe({ qrUuid: data, buyerPhone });
        setHandled(true);
        onActivated(result.sessionId);
      } catch (err) {
        Alert.alert('فعال‌سازی ناموفق بود', 'کد QR نامعتبر است یا پیش‌تر فعال شده. با پرسنل فروشگاه تماس بگیرید.');
      } finally {
        setActivating(false);
      }
    },
    [activating, handled, buyerPhone, onActivated],
  );

  if (!permission) return <ActivityIndicator style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>برای اسکن کد کفش به دسترسی دوربین نیاز است.</Text>
        <Text style={styles.link} onPress={requestPermission}>
          اجازه دسترسی به دوربین
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={activating || handled ? undefined : handleScan}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>{activating ? 'در حال فعال‌سازی…' : 'کد QR روی جعبه کفش را اسکن کنید'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.bg },
  overlay: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(31,58,61,0.9)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  text: { fontSize: 15, color: colors.primary, textAlign: 'center' },
  overlayText: { fontSize: 15, color: '#fff', textAlign: 'center' },
  link: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
});
