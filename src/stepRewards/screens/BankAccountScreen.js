/**
 * BankAccountScreen.js
 * ------------------------------------------------------------------
 * Collects the buyer's Sheba (IBAN) once, right after shoe activation —
 * n8n cannot pay out a reward tier without this on file. Shown if
 * getBuyer(phone).hasBankAccount comes back false.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { setBankAccount } from '../api/buyers';
import { colors } from '../../data/products';

export default function BankAccountScreen({ buyerPhone, onDone }) {
  const [sheba, setSheba] = useState('IR');
  const [ownerName, setOwnerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const shebaValid = /^IR\d{24}$/.test(sheba.replace(/\s/g, ''));
  const canSubmit = shebaValid && ownerName.trim().length >= 2 && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await setBankAccount(buyerPhone, sheba.replace(/\s/g, ''), ownerName.trim());
      onDone();
    } catch (err) {
      Alert.alert('خطا', 'ثبت شماره شبا ناموفق بود. شماره را دوباره بررسی کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>حساب بانکی برای دریافت پاداش</Text>
      <Text style={styles.subtitle}>
        برای واریز پاداش نقدی هر ۵۰٬۰۰۰ قدم، شماره شبا و نام صاحب حساب را وارد کنید. این اطلاعات فقط برای واریز
        وجه استفاده می‌شود.
      </Text>

      <Text style={styles.label}>شماره شبا (IBAN)</Text>
      <TextInput
        style={styles.input}
        value={sheba}
        onChangeText={(v) => setSheba(v.toUpperCase())}
        placeholder="IR XXXXXXXXXXXXXXXXXXXXXXXX"
        autoCapitalize="characters"
        keyboardType="default"
        maxLength={26}
      />
      {!shebaValid && sheba.length > 2 && <Text style={styles.error}>فرمت باید IR + ۲۴ رقم باشد</Text>}

      <Text style={styles.label}>نام صاحب حساب</Text>
      <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="مطابق کارت بانکی" />

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ثبت و ادامه</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 10, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: '800', color: colors.primary, textAlign: 'right' },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'right', lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 13, color: colors.primary, textAlign: 'right', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    fontSize: 15,
    backgroundColor: '#fff',
  },
  error: { color: '#b91c1c', fontSize: 12, textAlign: 'right' },
  button: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
