import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Eye, EyeOff, SlidersHorizontal } from "lucide-react-native";
import { router } from "expo-router";
import WechatLogo from "@/assets/svgs/wechat.svg";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  getSession,
  onAuthStateChange,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "@/src/auth/session";
import { upsertCurrentAccountMeta } from "@/src/auth/accounts";
import { computeStreak, dateKeyOf } from "@/src/domain/streaks";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/src/ui/toast";

const formInput =
  "h-12 w-full rounded-2xl bg-[#EAF3E7]/85 px-4 py-0 shadow-sm shadow-black/10";
const primaryButton =
  "h-12 w-full items-center justify-center rounded-2xl active:opacity-90";

const MIN_PASSWORD_LEN = 8;

/** NativeWind `right` on Pressable 可能不生效，用 RN style 保证贴在输入框右侧 */
const passwordRevealHitStyle: ViewStyle = {
  position: "absolute",
  right: 12,
  top: 0,
  height: 48,
  width: 44,
};

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authBusy, setAuthBusy] = useState<"idle" | "signIn" | "signUp">(
    "idle"
  );
  const inputsValid = useMemo(() => {
    const e = email.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const isPasswordValid = password.length >= MIN_PASSWORD_LEN;
    return isEmailValid && isPasswordValid;
  }, [email, password]);
  const canSignIn = inputsValid;
  const canSignUp = inputsValid && acceptedTerms;
  const emailHint = useMemo(() => {
    const e = email.trim();
    if (!e) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? "" : "请输入有效邮箱";
  }, [email]);
  const passwordHint = useMemo(() => {
    if (!password) return "";
    return password.length >= MIN_PASSWORD_LEN
      ? ""
      : `密码至少 ${MIN_PASSWORD_LEN} 位`;
  }, [password]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setAcceptedTerms(false);
    setShowPassword(false);
  };

  useEffect(() => {
    let mounted = true;
    getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error)
          showToast(`读取会话失败：${error.message}`, { variant: "error" });
        setUserId(data.session?.user?.id ?? null);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        showToast(
          `读取会话失败：${e instanceof Error ? e.message : String(e)}`,
          { variant: "error" }
        );
      });

    const { data } = onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [showToast]);

  const loggedIn = Boolean(userId);

  return (
    <AuroraBackground variant="clean" decorations={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-6 pb-10 "
          contentContainerStyle={{ paddingTop: insets.top }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 flex-row items-center justify-between">
            <View className="w-10" />
            <Text
              className="text-center text-xs tracking-[1.6px]"
              style={{ color: "rgba(15,18,14,0.52)" }}
            >
              BUDGET COACH
            </Text>
            {loggedIn ? (
              <Pressable
                hitSlop={10}
                className="h-10 w-10 items-end justify-center active:opacity-70"
                onPress={() => router.push("/settings" as never)}
              >
                <SlidersHorizontal size={18} color="rgba(18,22,16,0.48)" />
              </Pressable>
            ) : (
              <View className="w-10" />
            )}
          </View>

        {loggedIn ? (
          <View className="gap-6">
            <View className="items-center gap-3">
              <View className="h-16 w-16 rounded-full bg-secondary" />
              <Text className="text-center text-[18px] font-sans tracking-[0.2px]">
                Account
              </Text>
              <Text variant="muted" className="text-center text-[12px]">
                {userId}
              </Text>
            </View>

            <GlassPanel className="px-4 py-4">
                <Text variant="muted" className="text-xs tracking-[1.2px]">
                  PROGRESS
                </Text>
                <Text className="mt-2 text-left text-[22px] leading-[28px] font-sans">
                  {computeStreak(
                    [dateKeyOf(new Date())],
                    dateKeyOf(new Date())
                  )}{" "}
                  days
                </Text>
                <Text variant="muted" className="mt-1 text-[12px]">
                  More insights coming soon.
                </Text>
            </GlassPanel>

            <GlassPanel className="px-4 py-4">
                <Text variant="muted" className="text-xs tracking-[1.2px]">
                  UNLOCKED
                </Text>
                <View className="mt-3 gap-2">
                  <Text variant="muted" className="text-[12px]">
                    - Cloud sync (multi-device)
                  </Text>
                  <Text variant="muted" className="text-[12px]">
                    - Quick Add templates
                  </Text>
                  <Text variant="muted" className="text-[12px]">
                    - Reminders (push) — coming
                  </Text>
                </View>
            </GlassPanel>

            <Pressable
              className={primaryButton}
              onPress={async () => {
                const { error } = await signOut();
                if (error)
                  showToast(`登出失败：${error.message}`, { variant: "error" });
                else showToast("已登出");
              }}
            >
              <Text className="text-[15px] font-medium text-white">
                Sign out
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-1 justify-center gap-10">
            <Text className="text-center text-[16px] font-medium tracking-[1.6px]">
              LOGIN OR REGISTER
            </Text>

            <View className="gap-4">
              {authMode === "signUp" ? (
                <Pressable
                  className="self-start py-2 active:opacity-70"
                  disabled={authBusy !== "idle"}
                  onPress={() => {
                    resetForm();
                    setAuthMode("signIn");
                  }}
                >
                  <Text
                    variant="muted"
                    className={`text-[12px] ${
                      authBusy === "idle" ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    ← Back to sign in
                  </Text>
                </Pressable>
              ) : null}

              <View className="gap-2">
                <Input
                  className={formInput}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Enter your email address"
                />
                {!!emailHint ? (
                  <Text
                    variant="muted"
                    className="text-[12px] text-destructive"
                  >
                    {emailHint}
                  </Text>
                ) : null}
              </View>

              <View className="gap-2">
                <View className="relative w-full">
                  <Input
                    className={`${formInput} pr-14`}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                    }}
                    autoCapitalize="none"
                    secureTextEntry={!showPassword}
                    placeholder="Password"
                  />
                  <Pressable
                    accessibilityLabel={showPassword ? "隐藏密码" : "显示密码"}
                    style={passwordRevealHitStyle}
                    className="flex-row items-center justify-end pr-1 active:opacity-70"
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="rgba(17,17,17,0.45)" />
                    ) : (
                      <Eye size={18} color="rgba(17,17,17,0.45)" />
                    )}
                  </Pressable>
                </View>
                {!!passwordHint ? (
                  <Text
                    variant="muted"
                    className="text-[12px] text-destructive"
                  >
                    {passwordHint}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="gap-6">
              {authMode === "signIn" ? (
                <Pressable
                  className="items-center py-1 active:opacity-70"
                  disabled={authBusy !== "idle"}
                  onPress={() => router.push("/forgot-password" as never)}
                >
                  <Text variant="muted" className="text-[12px] underline">
                    Forgot password?
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                className={`${primaryButton} ${
                  authMode === "signIn"
                    ? canSignIn && authBusy === "idle"
                      ? "bg-black/85"
                      : "bg-white/16"
                    : canSignUp && authBusy === "idle"
                    ? "bg-black/85"
                    : "bg-white/16"
                } `}
                disabled={
                  authMode === "signIn"
                    ? !canSignIn || authBusy !== "idle"
                    : !canSignUp || authBusy !== "idle"
                }
                onPress={async () => {
                  if (!inputsValid) {
                    showToast(
                      `请填写有效邮箱，密码至少 ${MIN_PASSWORD_LEN} 位。`,
                      { variant: "error" }
                    );
                    return;
                  }
                  if (authMode === "signIn") {
                    setAuthBusy("signIn");
                    try {
                      const { error } = await signInWithPassword(
                        email.trim(),
                        password
                      );
                      if (error)
                        showToast(`登录失败：${error.message}`, {
                          variant: "error",
                        });
                      else {
                        await upsertCurrentAccountMeta(email.trim());
                        showToast(`登录成功`);
                      }
                    } finally {
                      setAuthBusy("idle");
                    }
                    return;
                  }

                  if (!acceptedTerms) {
                    showToast(
                      "注册前请同意 Terms & Conditions 与 Privacy Policy。",
                      { variant: "error" }
                    );
                    return;
                  }

                  setAuthBusy("signUp");
                  try {
                    const { error } = await signUpWithPassword(
                      email.trim(),
                      password
                    );
                    if (error)
                      showToast(`注册失败：${error.message}`, {
                        variant: "error",
                      });
                    else {
                      await upsertCurrentAccountMeta(email.trim());
                      showToast(
                        `注册成功。若项目开启了邮箱确认，请到邮箱里点链接后再登录。`
                      );
                    }
                  } finally {
                    setAuthBusy("idle");
                  }
                }}
              >
                <Text
                  className={`text-[15px] font-medium ${
                    authMode === "signIn"
                      ? canSignIn && authBusy === "idle"
                        ? "text-white"
                        : "text-foreground/45"
                      : canSignUp && authBusy === "idle"
                      ? "text-white"
                      : "text-foreground/45"
                  }`}
                >
                  {authMode === "signIn"
                    ? authBusy === "signIn"
                      ? "CONTINUING..."
                      : "CONTINUE"
                    : authBusy === "signUp"
                    ? "SUBMITTING..."
                    : "REGISTER"}
                </Text>
              </Pressable>

              <View className="flex-row items-center justify-center gap-3">
                <View className="h-px flex-1 bg-border" />
                <Text variant="muted" className="text-[10px] tracking-[1px]">
                  Join with
                </Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <View className="flex-row items-center justify-center">
                <Pressable
                  className="h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-white/14 active:opacity-80"
                  onPress={() => {
                    showToast("微信登录即将支持。");
                  }}
                >
                  <WechatLogo width={24} height={24} />
                </Pressable>
              </View>

              <Pressable
                className="items-center py-2 active:opacity-70"
                disabled={authBusy !== "idle"}
                onPress={() => {
                  resetForm();
                  setAuthMode((m) => (m === "signIn" ? "signUp" : "signIn"));
                }}
              >
                <Text
                  className={`text-[12px] ${
                    authBusy === "idle"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {authMode === "signIn"
                    ? "REGISTER INSTEAD"
                    : "BACK TO SIGN IN"}
                </Text>
              </Pressable>

              {authMode === "signUp" ? (
                <Pressable
                  className="flex-row items-start gap-3"
                  onPress={() => setAcceptedTerms((v) => !v)}
                >
                  <View
                    className={`mt-[2px] h-[18px] w-[18px] items-center justify-center border ${
                      acceptedTerms
                        ? "border-black bg-black"
                        : "border-white/40 bg-white/10"
                    }`}
                  >
                    {acceptedTerms ? <Check size={12} color="#fff" /> : null}
                  </View>
                  <Text
                    variant="muted"
                    className="flex-1 text-[12px] leading-5"
                  >
                    By creating an account, you agree to our{" "}
                    <Text className="text-foreground underline">
                      Terms & Conditions
                    </Text>{" "}
                    and{" "}
                    <Text className="text-foreground underline">
                      Privacy Policy
                    </Text>
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* 去掉底部文案区，保持页面干净 */}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AuroraBackground>
  );
}
