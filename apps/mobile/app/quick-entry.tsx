import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Delete } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { getSession } from "@/src/auth/session";
import { insertQuickTransaction } from "@/src/domain/localTransactions";
import { apiFetch } from "@/src/lib/api";
import { useToast } from "@/src/ui/toast";

const displayFont =
  Platform.OS === "ios"
    ? ({ fontFamily: "DINPro-Medium" } as const)
    : ({ fontFamily: "DINPro-Medium" } as const);

const keyText = "text-[22px] font-sansMedium";

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

export default function QuickEntryScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ category?: string; kind?: string }>();
  const category =
    typeof params.category === "string" && params.category.length > 0
      ? params.category
      : "未分类";
  const kind: "expense" | "income" =
    params.kind === "income" ? "income" : "expense";

  const [buf, setBuf] = useState("0");
  const [busy, setBusy] = useState(false);

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
      // v1 sync: fire-and-forget, local-first.
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
      router.back();
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message ?? e)
          : String(e);
      showToast(msg, { variant: "error" });
    } finally {
      setBusy(false);
    }
  }, [buf, category, kind, showToast]);

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
  }) => {
    const bg =
      tone === "accent"
        ? "bg-[#FF9F0A]"
        : tone === "muted"
          ? "bg-[#EFF0F3]"
          : "bg-[#FFFFFF]";
    const border =
      tone === "accent"
        ? "border border-[#FF9F0A]/55"
        : tone === "muted"
          ? "border border-border/70"
          : "border border-border/70";
    const fg =
      tone === "accent"
        ? "text-black"
        : tone === "muted"
          ? "text-foreground/70"
          : "text-foreground";
    return (
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityLabel={accessibilityLabel ?? label}
        className={`h-[52px] flex-1 items-center justify-center rounded-xl active:opacity-85 ${bg} ${border} ${
          wide ? "min-w-[46%]" : ""
        }`}
      >
        {icon ? (
          icon
        ) : (
          <Text className={`${keyText} ${fg}`}>{label ?? ""}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 8 }}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="rounded-lg px-2 py-2 active:opacity-70"
          >
            <Text className="text-[16px] text-[#FF9F0A]">取消</Text>
          </Pressable>
          <Text className="text-center text-[14px] font-sansMedium tracking-wide text-foreground/70">
            {category}
          </Text>
          <View className="w-12" />
        </View>

        <View className="flex-1 justify-end px-3 pb-2">
          <View className="mb-5 min-h-[72px] justify-end px-2">
            <Text
              className="text-right text-[48px] leading-[52px] tracking-tight text-foreground"
              style={displayFont}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {display}
            </Text>
          </View>

          <View className="gap-2.5">
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
    </>
  );
}
