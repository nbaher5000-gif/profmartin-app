import React, { useCallback, useMemo, useRef, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../data/products";
import {
  MINIMUM_POINTS,
  NativeFootScanView,
  footScanUnsupportedReason,
  isFootScanSupported,
  requestScanPermission,
} from "../../modules/foot-scan";
import { useFootScan } from "./FootScanContext";
import { qualityLabel, recommendSize } from "./sizing";

const PHASE_HINTS = {
  idle: "در حال آماده‌سازی دوربین…",
  waitingForFloor: "گوشی را آرام روی زمین بچرخانید تا کف اتاق شناسایی شود.",
  ready: "پای برهنه را داخل دایره بگذارید و دکمه‌ی شروع را بزنید.",
  scanning: "آرام دور پا بچرخید؛ از پاشنه تا نوک پنجه را ببینید.",
  finished: "در حال محاسبه‌ی اندازه‌ها…",
};

const STEPS = [
  "جوراب را دربیاورید و پا را روی زمین صاف (نه فرش پُرزدار) بگذارید.",
  "اتاق را روشن کنید؛ LiDAR در نور کم هم کار می‌کند ولی ردیابی حرکت بهتر می‌شود.",
  "گوشی را حدود ۳۰ تا ۵۰ سانتی‌متر بالای پا بگیرید.",
  "وزن را روی هر دو پا پخش کنید و تکان نخورید.",
  "در حین اسکن آرام نیم‌دور حول پا بچرخید تا پاشنه و پنجه هر دو دیده شوند.",
];

export default function FootScanScreen({ navigation }) {
  const { record, scans } = useFootScan();
  const supported = useMemo(() => isFootScanSupported(), []);
  const unsupportedReason = useMemo(() => footScanUnsupportedReason(), []);

  const viewRef = useRef(null);
  const [stage, setStage] = useState("intro");
  const [side, setSide] = useState("right");
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState({ pointCount: 0, ready: false });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const openScanner = useCallback(async () => {
    setError(null);
    const granted = await requestScanPermission();
    if (!granted) {
      setError("برای اسکن باید دسترسی دوربین را اجازه دهید. از تنظیمات iOS اجازه را فعال کنید.");
      return;
    }
    setProgress({ pointCount: 0, ready: false });
    setResult(null);
    setPhase("idle");
    setStage("scanning");
  }, []);

  const handleResult = useCallback(
    async (scan) => {
      setResult(scan);
      setStage("result");
      await record(scan);
    },
    [record]
  );

  // ---------- دستگاه پشتیبانی نمی‌کند ----------
  if (!supported) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.noticeCard}>
          <Feather name="alert-circle" size={22} color="#B5754B" />
          <Text style={styles.noticeTitle}>اسکن سه‌بعدی روی این دستگاه فعال نیست</Text>
          <Text style={styles.noticeText}>
            {unsupportedReason ?? "سنسور لازم برای اسکن پیدا نشد."}
          </Text>
          <Text style={styles.noticeText}>
            اسکن پا با سنسور LiDAR کار می‌کند و روی iPhone 12 Pro و بالاتر (از جمله iPhone 15 Pro Max) در نسخه‌ی
            نصبی اپ در دسترس است.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>تا آن موقع چه کنیم؟</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            می‌توانید سایز خود را از پشتیبانی واتساپ بپرسید؛ کافی است طول پا را با خط‌کش اندازه بگیرید و بفرستید.
          </Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => Linking.openURL("https://wa.me/989145000480")}
          >
            <Text style={styles.secondaryBtnText}>پیام به پشتیبانی در واتساپ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ---------- مرحله‌ی اسکن ----------
  if (stage === "scanning") {
    const canStart = phase === "ready";
    const scanning = phase === "scanning";
    const canFinish = scanning && progress.pointCount >= MINIMUM_POINTS;

    return (
      <View style={styles.scanRoot}>
        <NativeFootScanView
          ref={viewRef}
          style={styles.scanView}
          footSide={side}
          onScanStatus={(event) => setPhase(event.nativeEvent.phase)}
          onScanProgress={(event) => setProgress(event.nativeEvent)}
          onScanResult={(event) => handleResult(event.nativeEvent)}
          onScanError={(event) => setError(event.nativeEvent.message)}
        />

        <View style={styles.scanTop}>
          <Text style={styles.scanHint}>{PHASE_HINTS[phase] ?? ""}</Text>
          {scanning && (
            <Text style={styles.scanCounter}>
              {progress.pointCount.toLocaleString("fa-IR")} نقطه ثبت شد
              {progress.full ? " (حافظه پر شد، اسکن را تمام کنید)" : ""}
            </Text>
          )}
          {!!error && <Text style={styles.scanError}>{error}</Text>}
        </View>

        <View style={styles.scanBottom}>
          {!scanning ? (
            <TouchableOpacity
              style={[styles.primaryBtn, !canStart && styles.btnDisabled]}
              disabled={!canStart}
              onPress={() => {
                setError(null);
                viewRef.current?.start();
              }}
            >
              <Text style={[styles.primaryBtnText, !canStart && styles.btnTextDisabled]}>
                {canStart ? `شروع اسکن پای ${side === "right" ? "راست" : "چپ"}` : "در حال شناسایی کف…"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, !canFinish && styles.btnDisabled]}
              disabled={!canFinish}
              onPress={() => viewRef.current?.finish()}
            >
              <Text style={[styles.primaryBtnText, !canFinish && styles.btnTextDisabled]}>
                {canFinish ? "پایان اسکن و محاسبه" : "کمی بیشتر دور پا بچرخید…"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setStage("intro")}>
            <Text style={styles.cancelText}>انصراف</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------- مرحله‌ی نتیجه ----------
  if (stage === "result" && result) {
    const quality = qualityLabel(result.confidence);
    const recommendation = recommendSize(result);
    const rows = [
      ["طول پا", `${Math.round(result.lengthMm)} میلی‌متر`],
      ["عرض پنجه", `${Math.round(result.ballWidthMm)} میلی‌متر`],
      ["عریض‌ترین نقطه", `${Math.round(result.maxWidthMm)} میلی‌متر`],
      ["عرض پاشنه", `${Math.round(result.heelWidthMm)} میلی‌متر`],
      ["ارتفاع روی پا", `${Math.round(result.instepHeightMm)} میلی‌متر`],
      ["دور پنجه (تخمینی)", `${Math.round(result.ballGirthMm)} میلی‌متر`],
    ];

    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.resultHero}>
          <Text style={styles.resultLabel}>سایز پیشنهادی برای پای {side === "right" ? "راست" : "چپ"}</Text>
          <Text style={styles.resultSize}>{recommendation?.recommendedSize ?? "—"}</Text>
          <Text style={styles.resultSub}>
            عرض پا: {recommendation?.width.label} · کیفیت اسکن:{" "}
            <Text style={{ color: quality.color }}>{quality.label}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          {rows.map(([label, value], index) => (
            <View key={label} style={[styles.row, index !== rows.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowValue}>{value}</Text>
              <Text style={styles.rowLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {!!recommendation?.notes?.length && (
          <View style={[styles.card, { marginTop: 16 }]}>
            {recommendation.notes.map((note) => (
              <Text key={note} style={styles.noteText}>
                • {note}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, { marginTop: 24 }]}
          onPress={() => {
            setSide(side === "right" ? "left" : "right");
            setStage("intro");
          }}
        >
          <Text style={styles.primaryBtnText}>
            اسکن پای {side === "right" ? "چپ" : "راست"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>بازگشت به محصولات</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ---------- مرحله‌ی معرفی ----------
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.introHero}>
        <Feather name="box" size={28} color="#fff" />
        <Text style={styles.introTitle}>اسکن سه‌بعدی پا</Text>
        <Text style={styles.introText}>
          با سنسور LiDAR گوشی، طول و عرض و دور پنجه‌ی پا اندازه‌گیری می‌شود و سایز دقیق کفش پیشنهاد می‌گردد.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>کدام پا را اسکن می‌کنیم؟</Text>
      <View style={styles.sideRow}>
        {[
          ["right", "پای راست"],
          ["left", "پای چپ"],
        ].map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[styles.sideBtn, side === value && styles.sideBtnActive]}
            onPress={() => setSide(value)}
          >
            <Text style={[styles.sideText, side === value && styles.sideTextActive]}>{label}</Text>
            {!!scans?.[value] && (
              <Text style={[styles.sideDone, side === value && styles.sideTextActive]}>
                اسکن‌شده: {Math.round(scans[value].lengthMm)} م‌م
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>قبل از شروع</Text>
      <View style={styles.card}>
        {STEPS.map((step, index) => (
          <Text key={step} style={styles.noteText}>
            {index + 1}. {step}
          </Text>
        ))}
      </View>

      {!!error && <Text style={styles.inlineError}>{error}</Text>}

      <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={openScanner}>
        <Text style={styles.primaryBtnText}>باز کردن دوربین اسکن</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  introHero: { backgroundColor: colors.primary, borderRadius: 18, padding: 20, alignItems: "flex-end" },
  introTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 10, textAlign: "right" },
  introText: { color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 20, marginTop: 8, textAlign: "right" },

  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.primary, marginTop: 20, marginBottom: 8, textAlign: "right" },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: 14 },
  cardText: { fontSize: 12, color: colors.textMuted, lineHeight: 20, textAlign: "right" },
  noteText: { fontSize: 12, color: colors.textMuted, lineHeight: 21, textAlign: "right" },

  sideRow: { flexDirection: "row-reverse", gap: 10 },
  sideBtn: { flex: 1, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, padding: 14, alignItems: "center" },
  sideBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sideText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  sideTextActive: { color: "#fff" },
  sideDone: { fontSize: 10, color: colors.textFaint, marginTop: 4 },

  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  btnDisabled: { backgroundColor: "#E6E1D8" },
  btnTextDisabled: { color: "#A3A39A" },
  secondaryBtn: { paddingVertical: 14, alignItems: "center", marginTop: 8 },
  secondaryBtnText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  cancelText: { color: "rgba(255,255,255,0.8)", fontSize: 12, textAlign: "center", marginTop: 14 },
  inlineError: { color: "#B5754B", fontSize: 11, marginTop: 12, textAlign: "right" },

  scanRoot: { flex: 1, backgroundColor: "#000" },
  scanView: { ...StyleSheet.absoluteFillObject },
  scanTop: { position: "absolute", top: 0, left: 0, right: 0, padding: 20, paddingTop: 60, backgroundColor: "rgba(0,0,0,0.35)" },
  scanHint: { color: "#fff", fontSize: 13, fontWeight: "700", textAlign: "center", lineHeight: 22 },
  scanCounter: { color: "rgba(255,255,255,0.85)", fontSize: 11, textAlign: "center", marginTop: 6 },
  scanError: { color: "#FFD9C2", fontSize: 11, textAlign: "center", marginTop: 8 },
  scanBottom: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: "rgba(0,0,0,0.35)" },

  resultHero: { backgroundColor: colors.primary, borderRadius: 18, padding: 20, alignItems: "center" },
  resultLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  resultSize: { color: "#fff", fontSize: 40, fontWeight: "800", marginVertical: 4 },
  resultSub: { color: "rgba(255,255,255,0.85)", fontSize: 11 },

  row: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#EFEBE1" },
  rowLabel: { fontSize: 12, color: colors.textMuted },
  rowValue: { fontSize: 12, fontWeight: "700", color: colors.primary },

  noticeCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, alignItems: "flex-end" },
  noticeTitle: { fontSize: 13, fontWeight: "700", color: colors.primary, marginTop: 8, textAlign: "right" },
  noticeText: { fontSize: 12, color: colors.textMuted, lineHeight: 20, marginTop: 8, textAlign: "right" },
});
