import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import type { BudgetInputs } from "@/src/domain/budget";
import { computeBudgetAdvice } from "@/src/domain/budgetAdvice";
import {
  loadBudgetInputs,
  saveBudgetInputs,
} from "@/src/domain/userBudgetSettings";
import { Palette } from "@/src/theme/palette";
import { meLoginStyles, meScreenStyles } from "@/src/theme/meLogin.styles";
import { ui } from "@/src/theme/rn";

function yuanFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parseYuanInput(s: string): number | null {
  const t = s.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

type Props = {
  onSaved: () => void;
};

export function BudgetSettingsForm({ onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [capYuan, setCapYuan] = useState("");
  const [busy, setBusy] = useState(false);
  const [capError, setCapError] = useState<string | null>(null);

  const advice = useMemo(() => computeBudgetAdvice(), []);

  useEffect(() => {
    setCapError(null);
    void (async () => {
      const b = await loadBudgetInputs();
      setCapYuan(
        b.monthlySpendCapCents > 0 ? yuanFromCents(b.monthlySpendCapCents) : "",
      );
    })();
  }, []);

  const canSave = useMemo(() => {
    const c = parseYuanInput(capYuan);
    return c != null && c > 0;
  }, [capYuan]);

  const onSave = async () => {
    const capCents = parseYuanInput(capYuan);
    if (capCents == null || capCents <= 0) {
      setCapError("请填写大于 0 的每月支出上限");
      return;
    }
    setCapError(null);
    setBusy(true);
    try {
      const base = await loadBudgetInputs();
      const next: BudgetInputs = {
        ...base,
        budgetMode: "manual_spend_cap",
        monthlySpendCapCents: capCents,
        /** 不再采集月收入；清空历史字段，避免误以为会做推算 */
        monthlyIncomeCents: 0,
      };
      await saveBudgetInputs(next);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          meLoginStyles.scrollContent,
          {
            paddingTop: 12,
            paddingBottom: Math.max(32, insets.bottom + 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={meLoginStyles.fieldColumn}>
          <View style={meLoginStyles.hintRow}>
            <Text style={meLoginStyles.formFieldLabel}>
              每月支出上限（元）
            </Text>
            <Input
              style={meLoginStyles.otpField}
              value={capYuan}
              onChangeText={(t) => {
                setCapYuan(t);
                setCapError(null);
              }}
              keyboardType="decimal-pad"
              placeholder="例如 3000"
              placeholderTextColor={Palette.foregroundMuted}
            />
            {capError ? (
              <Text style={{ fontSize: 12, color: Palette.destructive }}>
                {capError}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.adviceBlock, { marginTop: 20 }]}>
          <Text style={[meScreenStyles.sectionLabel, styles.adviceTitle]}>
            参考说明
          </Text>
          <Text style={styles.adviceBody}>{advice.summaryZh}</Text>
          {advice.detailZh ? (
            <Text
              variant="muted"
              style={{ marginTop: 10, fontSize: 11, lineHeight: 16 }}
            >
              {advice.detailZh}
            </Text>
          ) : null}
        </View>

        <View style={[meLoginStyles.actionsColumn, { marginTop: 16 }]}>
          <Pressable
            style={[
              meLoginStyles.primaryBtn,
              canSave && !busy
                ? {
                    backgroundColor: Palette.authInk,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: Palette.authInk,
                  }
                : {
                    backgroundColor: ui.backgroundMuted,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: ui.border,
                  },
            ]}
            disabled={!canSave || busy}
            onPress={() => void onSave()}
          >
            {busy ? (
              <Text
                style={[meLoginStyles.primaryLabel, { color: ui.mutedText }]}
              >
                保存中…
              </Text>
            ) : canSave ? (
              <Text
                style={[meLoginStyles.primaryLabel, { color: "#fcf9f4" }]}
              >
                保存
              </Text>
            ) : (
              <Text
                style={[meLoginStyles.primaryLabel, { color: ui.mutedText }]}
              >
                保存
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  adviceBlock: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(208, 190, 170, 0.45)",
    backgroundColor: "rgba(252, 249, 244, 0.55)",
    borderRadius: 2,
  },
  adviceTitle: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: "rgba(122, 105, 89, 0.75)",
  },
  adviceBody: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(122, 105, 89, 0.88)",
  },
});
