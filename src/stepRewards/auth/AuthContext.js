/**
 * AuthContext.js
 * ------------------------------------------------------------------
 * Local source of truth for `buyerPhone` inside the step-rewards module.
 * Separate from the main app's own (still-mock, per README) checkout/
 * profile login — there is no shared real auth yet to plug into. Buyer's
 * phone = the same identifier already used on the backend (buyers /
 * shoe_activations tables) and in the n8n payout workflow, so "logging
 * in" here just means: ask once, validate the format, persist on-device.
 *
 * If real OTP auth is added to the main app later, swap signIn() below to
 * reuse it — no screen downstream needs to change.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'profmartin.step-rewards.buyerPhone';

export const IRAN_MOBILE_RE = /^09\d{9}$/;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [buyerPhone, setBuyerPhone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && stored && IRAN_MOBILE_RE.test(stored)) {
          setBuyerPhone(stored);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (phone) => {
    if (!IRAN_MOBILE_RE.test(phone)) {
      throw new Error('invalid phone format');
    }
    await AsyncStorage.setItem(STORAGE_KEY, phone);
    setBuyerPhone(phone);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setBuyerPhone(null);
  }, []);

  return (
    <AuthContext.Provider value={{ buyerPhone, loading, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
