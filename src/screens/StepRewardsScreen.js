/**
 * StepRewardsScreen.js
 * ------------------------------------------------------------------
 * The "پاداش قدم" tab — entry point for the step-rewards module inside
 * the main Professor Martin app. Resolves the signed-in buyer's phone
 * (persisted on-device, see stepRewards/auth/AuthContext.js) before
 * anything else renders:
 *  - no phone on file yet -> PhoneLoginScreen
 *  - phone on file        -> StepRewardFlow (with the last resolved
 *                             session id, so relaunching doesn't force
 *                             a QR re-scan)
 *
 * This module has its own lightweight phone-only "login" — separate
 * from this app's own (still-mock, per README) checkout/profile auth.
 * See stepRewards/auth/AuthContext.js for why, and how to merge them
 * later once real OTP auth exists for the main app.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../stepRewards/auth/AuthContext';
import PhoneLoginScreen from '../stepRewards/screens/PhoneLoginScreen';
import RulesScreen from '../stepRewards/screens/RulesScreen';
import StepRewardFlow from '../stepRewards/StepRewardFlow';
import { colors } from '../data/products';

const SESSION_STORAGE_KEY = 'profmartin.step-rewards.sessionId';

function Authed() {
  const { buyerPhone, signOut } = useAuth();
  const [sessionId, setSessionId] = useState(undefined); // undefined = still loading
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SESSION_STORAGE_KEY).then((v) => {
      if (!cancelled) setSessionId(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSessionResolved = useCallback((id) => {
    setSessionId(id);
    AsyncStorage.setItem(SESSION_STORAGE_KEY, id).catch(() => {});
  }, []);

  const handleSignOut = () => {
    Alert.alert('تغییر شماره', 'آیا می‌خواهید با شماره دیگری وارد شوید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'بله، خارج شو',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
          await signOut();
        },
      },
    ]);
  };

  if (sessionId === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (showRules) {
    return <RulesScreen onClose={() => setShowRules(false)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerPhone}>{buyerPhone}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowRules(true)}>
            <Text style={styles.headerActionNeutral}>راهنما و قوانین</Text>
          </Pressable>
          <Pressable onPress={handleSignOut}>
            <Text style={styles.headerAction}>تغییر شماره</Text>
          </Pressable>
        </View>
      </View>
      <StepRewardFlow buyerPhone={buyerPhone} existingSessionId={sessionId ?? undefined} onSessionResolved={handleSessionResolved} />
    </View>
  );
}

function Root() {
  const { buyerPhone, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return buyerPhone ? <Authed /> : <PhoneLoginScreen />;
}

export default function StepRewardsScreen() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.chipBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerPhone: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  headerActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 16 },
  headerAction: { fontSize: 12, color: '#b91c1c' },
  headerActionNeutral: { fontSize: 12, color: colors.primary, fontWeight: '700' },
});
