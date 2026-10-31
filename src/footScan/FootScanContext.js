import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearScans, loadScans, saveScan } from "./storage";
import { recommendSize } from "./sizing";

const FootScanContext = createContext(null);

export function FootScanProvider({ children }) {
  const [scans, setScans] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans()
      .then(setScans)
      .finally(() => setLoading(false));
  }, []);

  const record = useCallback(async (scan) => {
    const next = await saveScan(scan);
    setScans(next);
    return next;
  }, []);

  const reset = useCallback(async () => {
    await clearScans();
    setScans(null);
  }, []);

  // پای بزرگ‌تر مبنای انتخاب سایز است؛ معمولاً دو پا چند میلی‌متر اختلاف دارند.
  const primaryScan = useMemo(() => {
    const right = scans?.right;
    const left = scans?.left;
    if (right && left) return left.lengthMm > right.lengthMm ? left : right;
    return right ?? left ?? null;
  }, [scans]);

  const value = useMemo(
    () => ({
      scans,
      primaryScan,
      loading,
      hasScan: !!primaryScan,
      record,
      reset,
      /** پیشنهاد سایز برای یک محصول مشخص */
      sizeFor: (availableSizes) => (primaryScan ? recommendSize(primaryScan, availableSizes) : null),
    }),
    [scans, primaryScan, loading, record, reset]
  );

  return <FootScanContext.Provider value={value}>{children}</FootScanContext.Provider>;
}

export function useFootScan() {
  const ctx = useContext(FootScanContext);
  if (!ctx) throw new Error("useFootScan باید داخل FootScanProvider استفاده شود");
  return ctx;
}
