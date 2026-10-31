/**
 * StepDashboardScreen.js
 * ------------------------------------------------------------------
 * Daily/weekly step dashboard: cumulative steps, progress to next tier,
 * full reward ladder (with amounts, before they're earned), and reward
 * history. Combines server session status with live local step count
 * from usePedometer.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { usePedometer } from '../hooks/usePedometer';
import { getShoeStatus } from '../api/buyers';
import { REWARD_TIERS, faNumber } from '../content/programInfo';
import { colors } from '../../data/products';

const TIER_LABELS = ['۱', '۲', '۳'];
const REWARD_STATUS_FA = {
  pending: 'در حال پردازش واریز',
  sent: 'واریز شد ✅',
  failed: 'خطا در واریز — با فروشگاه تماس بگیرید',
};

export default function StepDashboardScreen({ sessionId }) {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const status = await getShoeStatus(sessionId);
      setData(status);
    } catch (err) {
      console.warn('[dashboard] failed to load status', err);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const { todaySteps, status: pedometerStatus } = usePedometer({
    sessionId,
    onSynced: () => load(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const progressToNext = data.nextTierSteps != null ? Math.min(1, data.cumulativeSteps / data.nextTierSteps) : 1;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.heroNumber}>{faNumber(data.cumulativeSteps)}</Text>
      <Text style={styles.heroLabel}>قدم ثبت‌شده از این کفش</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progressToNext * 100)}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {data.stepsRemainingToNextTier != null
          ? `${faNumber(data.stepsRemainingToNextTier)} قدم تا پاداش بعدی`
          : 'به هر سه سطح پاداش رسیدید 🎉'}
      </Text>

      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>قدم امروز (دستگاه شما)</Text>
        <Text style={styles.todayValue}>{faNumber(todaySteps)}</Text>
        <Text style={styles.todayStatus}>وضعیت گام‌شمار: {pedometerStatus}</Text>
      </View>

      <Text style={styles.sectionTitle}>سطوح پاداش</Text>
      {REWARD_TIERS.map((t) => {
        const earned = data.lastTierPaid >= t.tier;
        return (
          <View key={t.tier} style={styles.tierLadderRow}>
            <Text style={styles.tierLadderStatus}>{earned ? '✅' : '○'}</Text>
            <Text style={styles.tierLadderLabel}>
              سطح {TIER_LABELS[t.tier - 1]} · {faNumber(t.steps)} قدم
            </Text>
            <Text style={styles.tierLadderAmount}>{faNumber(t.amountToman)} تومان</Text>
          </View>
        );
      })}

      <Text style={styles.sectionTitle}>سابقه پاداش‌ها</Text>
      {data.rewards.length === 0 && <Text style={styles.muted}>هنوز به اولین سطح (۵۰٬۰۰۰ قدم) نرسیده‌اید.</Text>}
      {data.rewards.map((r) => (
        <View key={r.tier} style={styles.rewardRow}>
          <Text style={styles.rewardTier}>سطح {TIER_LABELS[r.tier - 1]}</Text>
          <Text style={styles.rewardAmount}>{faNumber(r.amountToman)} تومان</Text>
          <Text style={styles.rewardStatus}>{REWARD_STATUS_FA[r.status] ?? r.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  heroNumber: { fontSize: 42, fontWeight: '800', color: colors.accent, textAlign: 'center' },
  heroLabel: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 16 },
  progressTrack: { height: 10, backgroundColor: colors.chipBg, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressLabel: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  todayCard: { backgroundColor: colors.chipBg, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 20 },
  todayLabel: { fontSize: 13, color: colors.primary },
  todayValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  todayStatus: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, textAlign: 'right', marginBottom: 8 },
  muted: { fontSize: 13, color: colors.textFaint, textAlign: 'right' },
  rewardRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.chipBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rewardTier: { fontWeight: '700', color: colors.primary },
  rewardAmount: { fontWeight: '700', color: colors.accent },
  rewardStatus: { fontSize: 12, color: colors.textMuted },
  tierLadderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  tierLadderStatus: { fontSize: 14, width: 24, textAlign: 'center' },
  tierLadderLabel: { fontSize: 13, color: colors.primary, flex: 1, textAlign: 'right' },
  tierLadderAmount: { fontSize: 13, fontWeight: '700', color: colors.accent },
});
