import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/src/ui/toast";
import { resetPassword } from "@/src/auth/password";

const formInput =
  "h-12 w-full rounded-none border border-border bg-card px-3 py-0";
const primaryButton =
  "h-12 w-full items-center justify-center rounded-none active:opacity-90";

const MIN_PASSWORD_LEN = 8;

const passwordRevealHitStyle: ViewStyle = {
  position: "absolute",
  right: 12,
  top: 0,
  height: 48,
  width: 44,
};

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
      <Stack.Screen
        options={{ title: "Reset password", headerShadowVisible: false }}
      />
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-6">
            {!token ? (
              <View className="gap-2">
                <Text className="text-[16px] font-sansMedium tracking-[0.6px]">
                  INVALID LINK
                </Text>
                <Text variant="muted" className="text-[12px] leading-5">
                  链接无效或已过期。{params.error ? `（${params.error}）` : ""}
                </Text>
                <Pressable
                  className="items-center py-2 active:opacity-70"
                  onPress={() => router.replace("/forgot-password" as never)}
                >
                  <Text className="text-[12px] font-sansMedium">
                    Request a new link
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text className="text-[16px] font-sansMedium tracking-[0.6px]">
                  SET A NEW PASSWORD
                </Text>

                <View className="gap-2">
                  <View className="relative w-full">
                    <Input
                      className={`${formInput} pr-14`}
                      value={p1}
                      onChangeText={setP1}
                      secureTextEntry={!showP1}
                      placeholder="New password"
                    />
                    <Pressable
                      accessibilityLabel={showP1 ? "隐藏新密码" : "显示新密码"}
                      style={passwordRevealHitStyle}
                      className="flex-row items-center justify-end pr-1 active:opacity-70"
                      onPress={() => setShowP1((v) => !v)}
                    >
                      {showP1 ? (
                        <EyeOff size={18} color="rgba(17,17,17,0.45)" />
                      ) : (
                        <Eye size={18} color="rgba(17,17,17,0.45)" />
                      )}
                    </Pressable>
                  </View>
                  <View className="relative w-full">
                    <Input
                      className={`${formInput} pr-14`}
                      value={p2}
                      onChangeText={setP2}
                      secureTextEntry={!showP2}
                      placeholder="Confirm password"
                    />
                    <Pressable
                      accessibilityLabel={
                        showP2 ? "隐藏确认密码" : "显示确认密码"
                      }
                      style={passwordRevealHitStyle}
                      className="flex-row items-center justify-end pr-1 active:opacity-70"
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
                      className="text-[12px] text-destructive"
                    >
                      {hint}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  className={`${primaryButton} ${
                    canSubmit ? "bg-black" : "bg-muted"
                  }`}
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
                    className={`text-[15px] font-medium ${
                      canSubmit ? "text-white" : "text-muted-foreground"
                    }`}
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
