import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Delete } from "lucide-react-native";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GlassPanel } from "@/components/ui/glass-panel";
import { getSession } from "@/src/auth/session";
import { insertQuickTransaction } from "@/src/domain/localTransactions";
import { apiFetch } from "@/src/lib/api";
import { useToast } from "@/src/ui/toast";
import { fonts, ui } from "@/src/theme/rn";

const ACCENT = "#FF9F0A";

const qe = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelPress: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  cancelText: { fontSize: 16, color: ACCENT, fontFamily: fonts.sansMedium },
  title: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.5,
    color: "rgba(28,24,20,0.7)",
  },
  titleSpacer: { width: 48 },
  keypadCol: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  displayGlass: {
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  displayText: {
    textAlign: "right",
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.5,
    color: ui.text,
  },
  rows: { gap: 10 },
  keyBase: {
    height: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  keyWide: { minWidth: "46%" },
  keyLabel: { fontSize: 22, fontFamily: fonts.sansMedium },
  keyShadow: {
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
});

function appendKey(buf: string, key: string): string {
  if (key === ".") {
    if (buf.includes(".")) return buf;
    return buf === "0" ? "0." : `${buf}.`;
  }
  const [intRaw, frac = ""] = buf.split(".");
  if (buf.includes(".")) {
    if (frac.length >= 2) return buf;
    return `${intRaw}.${frac}${key}`;
  }
  if (buf === "0") return key === "0" ? "0" : key;
  const intPart = intRaw ?? "0";
  if (intPart.length >= 7) return buf;
  return `${intPart}${key}`;
}

function backspace(buf: string): string {
  if (buf.length <= 1) return "0";
  const next = buf.slice(0, -1);
  if (next === "" || next === "-") return "0";
  if (next.endsWith(".")) return next.slice(0, -1) || "0";
  return next;
}

function parseYuan(buf: string): number | null {
  if (!buf || buf === "." || buf.endsWith(".")) {
    const n = Number(buf.replace(/\.$/, ""));
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }
  const n = Number(buf);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 9_999_999) return null;
  return n;
}

const rowStyle: ViewStyle = { flexDirection: "row", gap: 10 };

function keySurface(tone: "dark" | "muted" | "accent"): ViewStyle {
  /** 与极光底区分开，避免白键「隐形」只剩数字字 */
  const edge = {
    borderWidth: 1,
    borderColor: ui.border,
  };
  if (tone === "accent") {
    return {
      backgroundColor: ACCENT,
      ...edge,
      borderColor: "rgba(255,159,10,0.55)",
    };
  }
  if (tone === "muted") {
    return {
      backgroundColor: "#E8E4DC",
      ...edge,
    };
  }
  return {
    backgroundColor: ui.backgroundMuted,
    ...edge,
  };
}

function keyLabelColor(tone: "dark" | "muted" | "accent"): string {
  if (tone === "accent") return "#000";
  if (tone === "muted") return "rgba(28,24,20,0.7)";
  return ui.text;
}

const displayFont =
  Platform.OS === "ios"
    ? ({ fontFamily: "DINPro-Medium" } as const)
    : ({ fontFamily: "DINPro-Medium" } as const);

export type QuickEntryContentProps = {
  category: string;
  kind: "expense" | "income";
  onClose: () => void;
};

export function QuickEntryContent({
  category,
  kind,
  onClose,
}: QuickEntryContentProps) {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const { showToast } = useToast();
  const [buf, setBuf] = useState("0");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void category;
    void kind;
    setBuf("0");
    setBusy(false);
  }, [category, kind]);

  const display = useMemo(() => {
    if (buf === "0") return "0";
    return buf;
  }, [buf]);

  const onDigit = useCallback((k: string) => {
    setBuf((b) => appendKey(b, k));
  }, []);

  const onConfirm = useCallback(async () => {
    const yuan = parseYuan(buf);
    if (yuan == null) {
      showToast("请输入有效金额", { variant: "error" });
      return;
    }
    setBusy(true);
    try {
      const { data } = await getSession();
      const uid = data.session?.user?.id ?? null;
      const amountCents = Math.round(yuan * 100);
      await insertQuickTransaction({
        kind,
        category,
        amountYuan: yuan,
        userId: uid,
      });
      void apiFetch("/api/transactions", {
        method: "POST",
        json: {
          kind,
          amountCents,
          currency: "CNY",
          category,
          scene: "quick_entry",
          occurredAt: new Date().toISOString(),
          note: null,
        },
      }).catch((e) => {
        if (__DEV__) console.warn("[quick-entry] tx sync failed", e);
      });
      onClose();
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message ?? e)
          : String(e);
      showToast(msg, { variant: "error" });
    } finally {
      setBusy(false);
    }
  }, [buf, category, kind, onClose, showToast]);

  const Key = ({
    label,
    icon,
    accessibilityLabel,
    onPress,
    wide,
    tone = "dark",
  }: {
    label?: string;
    icon?: ReactNode;
    accessibilityLabel?: string;
    onPress: () => void;
    wide?: boolean;
    tone?: "dark" | "muted" | "accent";
  }) => (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        qe.keyBase,
        keySurface(tone),
        tone !== "accent" ? qe.keyShadow : undefined,
        wide ? qe.keyWide : undefined,
        pressed ? { opacity: 0.88 } : undefined,
      ]}
    >
      {icon ? (
        icon
      ) : (
        <Text style={[qe.keyLabel, { color: keyLabelColor(tone) }]}>
          {label ?? ""}
        </Text>
      )}
    </Pressable>
  );

  return (
    <AuroraBackground variant="clean" decorations={false} style={[qe.sheet, { minHeight: windowH }]}>
      <View
        style={[
          qe.inner,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <View style={qe.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [
              qe.cancelPress,
              pressed ? { opacity: 0.7 } : undefined,
            ]}
          >
            <Text style={qe.cancelText}>取消</Text>
          </Pressable>
          <Text style={qe.title} numberOfLines={1}>
            {category}
          </Text>
          <View style={qe.titleSpacer} />
        </View>

        <View style={qe.keypadCol}>
          <GlassPanel style={qe.displayGlass}>
            <Text
              style={[qe.displayText, displayFont]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {display}
            </Text>
          </GlassPanel>

          <View style={qe.rows}>
            <View style={rowStyle}>
              <Key label="7" onPress={() => onDigit("7")} />
              <Key label="8" onPress={() => onDigit("8")} />
              <Key label="9" onPress={() => onDigit("9")} />
              <Key
                tone="muted"
                accessibilityLabel="删除"
                icon={
                  <Delete
                    size={20}
                    strokeWidth={2.3}
                    color="rgba(28,24,20,0.82)"
                  />
                }
                onPress={() => setBuf(backspace)}
              />
            </View>
            <View style={rowStyle}>
              <Key label="4" onPress={() => onDigit("4")} />
              <Key label="5" onPress={() => onDigit("5")} />
              <Key label="6" onPress={() => onDigit("6")} />
              <Key label="C" tone="muted" onPress={() => setBuf("0")} />
            </View>
            <View style={rowStyle}>
              <Key label="1" onPress={() => onDigit("1")} />
              <Key label="2" onPress={() => onDigit("2")} />
              <Key label="3" onPress={() => onDigit("3")} />
              <Key label="." tone="muted" onPress={() => onDigit(".")} />
            </View>
            <View style={rowStyle}>
              <Key label="0" wide onPress={() => onDigit("0")} />
              <Key
                label="确定"
                tone="accent"
                wide
                onPress={() => void onConfirm()}
              />
            </View>
          </View>
        </View>
      </View>
    </AuroraBackground>
  );
}
