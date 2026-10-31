/**
 * PhoneLoginScreen.js
 * ------------------------------------------------------------------
 * First screen the buyer sees in the step-rewards tab. Asks for the
 * mobile number used at purchase — that's the key everything downstream
 * (buyers table, shoe_activations, n8n payouts) is keyed on. No OTP yet
 * (see AuthContext.js for why).
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth, IRAN_MOBILE_RE } from '../auth/AuthContext';
import { REWARD_TIERS, TOTAL_REWARD_TOMAN, faNumber } from '../content/programInfo';
import { colors } from '../../data/products';

const TIER_LABELS = ['۱', '۲', '۳'];

export default function PhoneLoginScreen() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const valid = IRAN_MOBILE_RE.test(phone);

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(phone);
    } catch {
      setError('ثبت شماره ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>گام‌پاداش پروفسور مارتین</Text>
      <Text style={styles.subtitle}>
        شماره موبایلی که هنگام خرید کفش ثبت کردید را وارد کنید تا بتوانید کفش خود را فعال کرده و پاداش هر
        ۵۰٬۰۰۰ قدم را دریافت کنید.
      </Text>

      <View style={styles.tiersCard}>
        {REWARD_TIERS.map((t) => (
          <Text key={t.tier} style={styles.tierLine}>
            سطح {TIER_LABELS[t.tier - 1]} · {faNumber(t.steps)} قدم ← {faNumber(t.amountToman)} تومان
          </Text>
        ))}
        <Text style={styles.tierTotal}>مجموع تا {faNumber(TOTAL_REWARD_TOMAN)} تومان از یک جفت کفش</Text>
      </View>

      <Text style={styles.label}>شماره موبایل</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={(v) => setPhone(v.replace(/[^\d]/g, ''))}
        placeholder="09xxxxxxxxx"
        keyboardType="number-pad"
        maxLength={11}
        textAlign="right"
      />
      {!valid && phone.length > 0 && <Text style={styles.error}>شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.button, !valid && styles.buttonDisabled]} onPress={handleSubmit} disabled={!valid}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ورود</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 10, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'right', lineHeight: 20, marginBottom: 16 },
  tiersCard: { backgroundColor: colors.chipBg, borderRadius: 16, padding: 14, marginBottom: 20, gap: 4 },
  tierLine: { fontSize: 12, color: colors.primary, textAlign: 'right' },
  tierTotal: { fontSize: 12, color: colors.accent, fontWeight: '800', textAlign: 'right', marginTop: 6 },
  label: { fontSize: 13, color: colors.primary, textAlign: 'right' },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
    letterSpacing: 1,
    backgroundColor: '#fff',
  },
  error: { color: '#b91c1c', fontSize: 12, textAlign: 'right' },
  button: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
