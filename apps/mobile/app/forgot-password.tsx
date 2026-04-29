import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { Stack, router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/src/ui/toast";
import { requestPasswordReset } from "@/src/auth/password";

const formInput = "h-12 w-full rounded-none border border-border bg-card px-3 py-0";
const primaryButton =
  "h-12 w-full items-center justify-center rounded-none active:opacity-90";

export default function ForgotPasswordScreen() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const emailHint = useMemo(() => {
    const e = email.trim();
    if (!e) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? "" : "请输入有效邮箱";
  }, [email]);

  const canSubmit = !busy && !!email.trim() && !emailHint;

  return (
    <>
      <Stack.Screen options={{ title: "Forgot password", headerShadowVisible: false }} />
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
            <Text className="text-[16px] font-sansMedium tracking-[0.6px]">
              RESET YOUR PASSWORD
            </Text>
            <Text variant="muted" className="text-[12px] leading-5">
              我们会向你的邮箱发送一条重置链接（如果该邮箱存在于系统中）。
            </Text>

            <View className="gap-2">
              <Input
                className={formInput}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Enter your email address"
              />
              {emailHint ? (
                <Text variant="muted" className="text-[12px] text-destructive">
                  {emailHint}
                </Text>
              ) : null}
            </View>

            <Pressable
              className={`${primaryButton} ${canSubmit ? "bg-black" : "bg-muted"}`}
              disabled={!canSubmit}
              onPress={async () => {
                if (!canSubmit) return;
                setBusy(true);
                try {
                  const { error } = await requestPasswordReset(email.trim());
                  if (error) {
                    showToast(`发送失败：${error.message ?? "Unknown error"}`, {
                      variant: "error",
                    });
                    return;
                  }
                  showToast("已发送（请检查邮箱或垃圾箱）");
                  router.back();
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
                {busy ? "SENDING..." : "SEND RESET LINK"}
              </Text>
            </Pressable>

            <Pressable className="items-center py-2 active:opacity-70" onPress={() => router.back()}>
              <Text variant="muted" className="text-[12px]">
                Back
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

