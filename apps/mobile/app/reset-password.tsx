import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/src/ui/toast";
import { resetPassword } from "@/src/auth/password";
import { Palette } from "@/src/theme/palette";
import { fonts, mergeText, ui } from "@/src/theme/rn";

const MIN_PASSWORD_LEN = 8;

const passwordRevealHitStyle: ViewStyle = {
  position: "absolute",
  right: 12,
  top: 0,
  height: 48,
  width: 44,
};

const formInput: TextStyle = {
  height: 48,
  borderRadius: 0,
  borderWidth: 1,
  borderColor: ui.border,
  backgroundColor: ui.card,
  paddingHorizontal: 12,
  paddingVertical: 0,
  paddingRight: 56,
};

const s = StyleSheet.create({
  kav: { flex: 1, backgroundColor: ui.background },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 },
  stack: { gap: 24 },
  sectionGap: { gap: 8 },
  title: {
    fontSize: 16,
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.6,
    color: ui.text,
  },
  body: { fontSize: 12, lineHeight: 20 },
  ghostPress: { alignItems: "center", paddingVertical: 8 },
  ghostLabel: { fontSize: 12, fontFamily: fonts.sansMedium, color: ui.text },
  primaryBtn: {
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
  },
  primaryOn: { backgroundColor: "#000" },
  primaryOff: { backgroundColor: ui.backgroundMuted },
  primaryLabel: { fontSize: 15, fontWeight: "600" },
  revealPress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 4,
  },
  wrap: { position: "relative", width: "100%" },
});

export default function ResetPasswordScreen() {
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    token?: string | string[];
    error?: string;
  }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);

  const hint = useMemo(() => {
    if (!p1 && !p2) return "";
    if (p1.length < MIN_PASSWORD_LEN) return `密码至少 ${MIN_PASSWORD_LEN} 位`;
    if (p2 && p1 !== p2) return "两次密码不一致";
    return "";
  }, [p1, p2]);

  const canSubmit =
    Boolean(token) &&
    !hint &&
    !busy &&
    p1.length >= MIN_PASSWORD_LEN &&
    p1 === p2;

  return (
    <>
      <Stack.Screen options={{ title: "Reset password", headerShadowVisible: false }} />
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.stack}>
            {!token ? (
              <View style={s.sectionGap}>
                <Text style={s.title}>INVALID LINK</Text>
                <Text variant="muted" style={s.body}>
                  链接无效或已过期。{params.error ? `（${params.error}）` : ""}
                </Text>
                <Pressable
                  style={s.ghostPress}
                  onPress={() => router.replace("/forgot-password" as never)}
                >
                  <Text style={s.ghostLabel}>Request a new link</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={s.title}>SET A NEW PASSWORD</Text>

                <View style={s.sectionGap}>
                  <View style={s.wrap}>
                    <Input
                      style={mergeText(formInput)}
                      value={p1}
                      onChangeText={setP1}
                      secureTextEntry={!showP1}
                      placeholder="New password"
                    />
                    <Pressable
                      accessibilityLabel={showP1 ? "隐藏新密码" : "显示新密码"}
                      style={[passwordRevealHitStyle, s.revealPress]}
                      onPress={() => setShowP1((v) => !v)}
                    >
                      {showP1 ? (
                        <EyeOff size={18} color="rgba(17,17,17,0.45)" />
                      ) : (
                        <Eye size={18} color="rgba(17,17,17,0.45)" />
                      )}
                    </Pressable>
                  </View>
                  <View style={s.wrap}>
                    <Input
                      style={mergeText(formInput)}
                      value={p2}
                      onChangeText={setP2}
                      secureTextEntry={!showP2}
                      placeholder="Confirm password"
                    />
                    <Pressable
                      accessibilityLabel={
                        showP2 ? "隐藏确认密码" : "显示确认密码"
                      }
                      style={[passwordRevealHitStyle, s.revealPress]}
                      onPress={() => setShowP2((v) => !v)}
                    >
                      {showP2 ? (
                        <EyeOff size={18} color="rgba(17,17,17,0.45)" />
                      ) : (
                        <Eye size={18} color="rgba(17,17,17,0.45)" />
                      )}
                    </Pressable>
                  </View>
                  {hint ? (
                    <Text
                      variant="muted"
                      style={{ fontSize: 12, color: Palette.destructive }}
                    >
                      {hint}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  style={[s.primaryBtn, canSubmit ? s.primaryOn : s.primaryOff]}
                  disabled={!canSubmit}
                  onPress={async () => {
                    if (!token) return;
                    setBusy(true);
                    try {
                      const { error } = await resetPassword(token, p1);
                      if (error) {
                        showToast(
                          `重置失败：${error.message ?? "Unknown error"}`,
                          {
                            variant: "error",
                          }
                        );
                        return;
                      }
                      showToast("密码已更新，请重新登录");
                      router.replace("/(tabs)/me" as never);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Text
                    style={mergeText(s.primaryLabel, {
                      color: canSubmit ? "#fff" : ui.mutedText,
                      fontFamily: fonts.sansMedium,
                    })}
                  >
                    {busy ? "UPDATING..." : "UPDATE PASSWORD"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
