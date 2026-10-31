/**
 * StepRewardFlow.js
 * ------------------------------------------------------------------
 * Orchestration component tying the three in-flow screens together:
 *   ActivateShoeScreen -> (BankAccountScreen if needed) -> StepDashboardScreen
 * Manages its own internal step state; no react-navigation props needed.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import ActivateShoeScreen from './screens/ActivateShoeScreen';
import BankAccountScreen from './screens/BankAccountScreen';
import StepDashboardScreen from './screens/StepDashboardScreen';
import { getBuyer } from './api/buyers';

export default function StepRewardFlow({ buyerPhone, existingSessionId, onSessionResolved }) {
  const [step, setStep] = useState({ kind: 'loading' });

  const resolveNextStep = useCallback(
    async (sessionId) => {
      onSessionResolved?.(sessionId);
      try {
        const buyer = await getBuyer(buyerPhone);
        if (!buyer || !buyer.hasBankAccount) {
          setStep({ kind: 'bank-account', sessionId });
        } else {
          setStep({ kind: 'dashboard', sessionId });
        }
      } catch {
        setStep({ kind: 'dashboard', sessionId });
      }
    },
    [buyerPhone, onSessionResolved],
  );

  useEffect(() => {
    if (existingSessionId) {
      resolveNextStep(existingSessionId);
    } else {
      setStep({ kind: 'activate' });
    }
  }, [existingSessionId, resolveNextStep]);

  if (step.kind === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (step.kind === 'activate') {
    return <ActivateShoeScreen buyerPhone={buyerPhone} onActivated={(sessionId) => resolveNextStep(sessionId)} />;
  }

  if (step.kind === 'bank-account') {
    const { sessionId } = step;
    return <BankAccountScreen buyerPhone={buyerPhone} onDone={() => setStep({ kind: 'dashboard', sessionId })} />;
  }

  return <StepDashboardScreen sessionId={step.sessionId} />;
}
