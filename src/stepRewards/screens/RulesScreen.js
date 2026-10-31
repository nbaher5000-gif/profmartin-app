/**
 * RulesScreen.js
 * ------------------------------------------------------------------
 * Static "راهنما و قوانین" content, opened from the step-rewards tab
 * header. Pure content screen — no API calls.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Alert } from 'react-native';
import { REWARD_TIERS, TOTAL_REWARD_TOMAN, DAILY_STEP_CAP, SUPPORT_WHATSAPP_NUMBER, faNumber } from '../content/programInfo';
import { colors } from '../../data/products';

const TIER_LABELS = ['۱', '۲', '۳'];

export default function RulesScreen({ onClose }) {
  const openSupport = () => {
    if (SUPPORT_WHATSAPP_NUMBER.startsWith('REPLACE_WITH')) {
      Alert.alert(
        'پشتیبانی',
        'شماره واتس‌اپ پشتیبانی هنوز در اپ تنظیم نشده. فعلاً از همان واتس‌اپ فروشگاه پروفسور مارتین پیام بدهید.',
      );
      return;
    }
    Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>راهنما و قوانین</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.close}>بستن</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.sectionTitle}>سطوح پاداش</Text>
        {REWARD_TIERS.map((t) => (
          <Text key={t.tier} style={styles.body}>
            • سطح {TIER_LABELS[t.tier - 1]}: رسیدن به {faNumber(t.steps)} قدم از این کفش ← {faNumber(t.amountToman)}{' '}
            تومان
          </Text>
        ))}
        <Text style={[styles.body, styles.bold]}>
          در مجموع تا {faNumber(TOTAL_REWARD_TOMAN)} تومان پاداش از یک جفت کفش قابل دریافت است.
        </Text>

        <Text style={styles.sectionTitle}>قدم‌ها چطور شمرده می‌شوند؟</Text>
        <Text style={styles.body}>
          قدم‌ها فقط از گام‌شمار همان گوشی که کفش را با آن فعال کرده‌اید خوانده می‌شود. برای عدالت بین
          کاربران، حداکثر {faNumber(DAILY_STEP_CAP)} قدم در روز در محاسبه پاداش منظور می‌شود.
        </Text>
        <Text style={styles.body}>
          لازم نیست اپ همیشه باز باشد؛ فقط گاهی آن را باز کنید تا قدم‌های ثبت‌شده با سرور همگام شوند.
        </Text>

        <Text style={styles.sectionTitle}>حریم خصوصی</Text>
        <Text style={styles.body}>
          هیچ موقعیت مکانی (GPS) شما ذخیره یا ارسال نمی‌شود — فقط تعداد قدم. شماره شبای شما فقط برای واریز
          پاداش استفاده می‌شود و در جای دیگری به اشتراک گذاشته نمی‌شود.
        </Text>

        <Text style={styles.sectionTitle}>واریز پاداش</Text>
        <Text style={styles.body}>
          پس از رسیدن به هر سطح، واریز طی چند روز کاری توسط تیم مالی فروشگاه انجام می‌شود. وضعیت آن در همین
          اپ («در حال پردازش واریز» → «واریز شد») قابل پیگیری است.
        </Text>

        <Text style={styles.sectionTitle}>پشتیبانی</Text>
        <Text style={styles.body}>
          اگر کد QR اسکن نشد، قدم‌ها درست ثبت نشد، یا واریز دیر شد، با پشتیبانی پروفسور مارتین تماس بگیرید.
        </Text>
        <Pressable style={styles.supportButton} onPress={openSupport}>
          <Text style={styles.supportButtonText}>تماس با پشتیبانی</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.chipBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: colors.primary },
  close: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  container: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.primary, textAlign: 'right', marginTop: 18, marginBottom: 6 },
  body: { fontSize: 13, color: colors.textMuted, textAlign: 'right', lineHeight: 21, marginBottom: 4 },
  bold: { fontWeight: '800', color: colors.primary, marginTop: 4 },
  supportButton: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  supportButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
