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
import { LinearGradient } from "expo-linear-gradient";
import { Check, SlidersHorizontal } from "lucide-react-native";
import { router } from "expo-router";
import WechatLogo from "@/assets/svgs/wechat.svg";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  getSession,
  onAuthStateChange,
  sendPhoneOtp,
  signOut,
  verifyPhoneOtp,
} from "@/src/auth/session";
import { normalizePhoneToE164 } from "@/src/auth/phone";
import { upsertCurrentAccountMeta } from "@/src/auth/accounts";
import { computeStreak, dateKeyOf } from "@/src/domain/streaks";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/src/ui/toast";
import { wechatTileGradient } from "@/src/theme/authGradients";
import { Palette } from "@/src/theme/palette";
import { meLoginStyles, meScreenStyles } from "@/src/theme/meLogin.styles";
import { ui } from "@/src/theme/rn";
import { GradientCtaFill } from "@/src/ui/GradientCtaFill";

const OTP_LEN = 6;

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [phoneRaw, setPhoneRaw] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const phoneE164 = useMemo(
    () => normalizePhoneToE164(phoneRaw),
    [phoneRaw]
  );
  const phoneHint = useMemo(() => {
    const s = phoneRaw.trim();
    if (!s) return "";
    return phoneE164 ? "" : "请输入有效手机号（可填 11 位或 +86…）";
  }, [phoneRaw, phoneE164]);

  const otpHint = useMemo(() => {
    if (!otp) return "";
    return otp.length === OTP_LEN ? "" : `请输入 ${OTP_LEN} 位验证码`;
  }, [otp]);

  const canSendOtp = Boolean(phoneE164) && !otpBusy && resendCooldown === 0;
  /** 手机号格式正确且已输入 6 位验证码（不要求勾选条款；条款在 onPress 里校验） */
  const otpComplete =
    Boolean(phoneE164) && otp.length === OTP_LEN;
  const continueInteractive =
    otpComplete && !verifyBusy && !otpBusy;
  /** 验证码填完后主按钮高亮；提交中保持渐变样式 */
  const primaryEmphasis =
    otpComplete ||
    (verifyBusy && Boolean(phoneE164) && otp.length === OTP_LEN);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const resetForm = () => {
    setPhoneRaw("");
    setOtp("");
    setAcceptedTerms(false);
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
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            meLoginStyles.scrollContent,
            { paddingTop: insets.top },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={meScreenStyles.headerBar}>
            <View style={meScreenStyles.spacerW40} />
            <Text style={meScreenStyles.brandTiny}>BUDGET COACH</Text>
            {loggedIn ? (
              <Pressable
                hitSlop={10}
                style={meScreenStyles.gearHit}
                onPress={() => router.push("/settings" as never)}
              >
                <SlidersHorizontal size={18} color="rgba(18,22,16,0.48)" />
              </Pressable>
            ) : (
              <View style={meScreenStyles.spacerW40} />
            )}
          </View>

        {loggedIn ? (
          <View style={meScreenStyles.loggedInWrap}>
            <View style={meScreenStyles.profileBlock}>
              <View style={meScreenStyles.avatar} />
              <Text style={meScreenStyles.accountTitle}>Account</Text>
              <Text variant="muted" style={meScreenStyles.userIdMuted}>
                {userId}
              </Text>
            </View>

            <GlassPanel style={meScreenStyles.glassPad16}>
                <Text variant="muted" style={meScreenStyles.sectionLabel}>
                  PROGRESS
                </Text>
                <Text style={meScreenStyles.streakNumber}>
                  {computeStreak(
                    [dateKeyOf(new Date())],
                    dateKeyOf(new Date())
                  )}{" "}
                  days
                </Text>
                <Text variant="muted" style={meScreenStyles.sectionFoot}>
                  More insights coming soon.
                </Text>
            </GlassPanel>

            <GlassPanel style={meScreenStyles.glassPad16}>
                <Text variant="muted" style={meScreenStyles.sectionLabel}>
                  UNLOCKED
                </Text>
                <View style={meScreenStyles.unlockedList}>
                  <Text variant="muted" style={meScreenStyles.bulletMuted}>
                    - Cloud sync (multi-device)
                  </Text>
                  <Text variant="muted" style={meScreenStyles.bulletMuted}>
                    - Quick Add templates
                  </Text>
                  <Text variant="muted" style={meScreenStyles.bulletMuted}>
                    - Reminders (push) — coming
                  </Text>
                </View>
            </GlassPanel>

            <Pressable
              style={meLoginStyles.signOutBtn}
              onPress={async () => {
                const { error } = await signOut();
                if (error)
                  showToast(`登出失败：${error.message}`, { variant: "error" });
                else showToast("已登出");
              }}
            >
              <GradientCtaFill>
                <Text style={meLoginStyles.signOutLabel}>Sign out</Text>
              </GradientCtaFill>
            </Pressable>
          </View>
        ) : (
          <View style={meLoginStyles.loggedOutColumn}>
            <Text style={meLoginStyles.title}>LOGIN OR REGISTER</Text>

            <View style={meLoginStyles.fieldColumn}>
              <View style={meLoginStyles.hintRow}>
                <View style={meLoginStyles.phoneRow}>
                  <Input
                    style={meLoginStyles.phoneInput}
                    value={phoneRaw}
                    onChangeText={setPhoneRaw}
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                    placeholder="手机号"
                    placeholderTextColor={Palette.foregroundMuted}
                  />
                  <Pressable
                    style={meLoginStyles.otpInlineBtn}
                    disabled={!canSendOtp}
                    onPress={async () => {
                      if (!phoneE164) {
                        showToast("请先填写有效手机号。", {
                          variant: "error",
                        });
                        return;
                      }
                      setOtpBusy(true);
                      try {
                        const { error } = await sendPhoneOtp(phoneE164);
                        if (error)
                          showToast(`发送失败：${error.message ?? "未知错误"}`, {
                            variant: "error",
                          });
                        else {
                          showToast("验证码已发送（开发环境请看 API 控制台）");
                          setResendCooldown(60);
                        }
                      } finally {
                        setOtpBusy(false);
                      }
                    }}
                  >
                    {canSendOtp ? (
                      <View
                        pointerEvents="none"
                        style={[
                          meLoginStyles.otpInlineLayer,
                          { backgroundColor: ui.primary },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          meLoginStyles.otpInlineLayer,
                          {
                            backgroundColor: ui.backgroundMuted,
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderRightWidth: StyleSheet.hairlineWidth,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderColor: ui.border,
                          },
                        ]}
                      />
                    )}
                    <View
                      style={meLoginStyles.otpInlineLabelWrap}
                      pointerEvents="none"
                    >
                      <Text
                        style={[
                          meLoginStyles.otpInlineLabel,
                          {
                            color: canSendOtp
                              ? ui.primaryText
                              : Palette.foregroundMuted,
                          },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {otpBusy
                          ? "发送中…"
                          : resendCooldown > 0
                            ? `${resendCooldown}s`
                            : "获取验证码"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
                {!!phoneHint ? (
                  <Text style={{ fontSize: 12, color: Palette.destructive }}>
                    {phoneHint}
                  </Text>
                ) : null}
              </View>

              <View style={meLoginStyles.hintRow}>
                <Input
                  style={meLoginStyles.otpField}
                  value={otp}
                  onChangeText={(v) =>
                    setOtp(v.replace(/\D/g, "").slice(0, OTP_LEN))
                  }
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  placeholder="6 位验证码"
                  placeholderTextColor={Palette.foregroundMuted}
                  maxLength={OTP_LEN}
                />
                {!!otpHint ? (
                  <Text style={{ fontSize: 12, color: Palette.destructive }}>
                    {otpHint}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={meLoginStyles.actionsColumn}>
              <Pressable
                style={[
                  meLoginStyles.primaryBtn,
                  {
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: primaryEmphasis ? "transparent" : ui.border,
                    backgroundColor: "transparent",
                  },
                ]}
                disabled={!continueInteractive}
                onPress={async () => {
                  if (!phoneE164 || otp.length !== OTP_LEN) {
                    showToast("请填写手机号与 6 位验证码。", {
                      variant: "error",
                    });
                    return;
                  }
                  if (!acceptedTerms) {
                    showToast("请先同意用户条款与隐私政策。", {
                      variant: "error",
                    });
                    return;
                  }
                  setVerifyBusy(true);
                  try {
                    const { error } = await verifyPhoneOtp(phoneE164, otp);
                    if (error)
                      showToast(`登录失败：${error.message}`, {
                        variant: "error",
                      });
                    else {
                      await upsertCurrentAccountMeta(phoneE164);
                      showToast("登录成功");
                      resetForm();
                    }
                  } finally {
                    setVerifyBusy(false);
                  }
                }}
              >
                {primaryEmphasis ? (
                  <View
                    pointerEvents="none"
                    style={[
                      meLoginStyles.otpInlineLayer,
                      { backgroundColor: ui.primary },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      meLoginStyles.otpInlineLayer,
                      { backgroundColor: ui.backgroundMuted },
                    ]}
                  />
                )}
                <View
                  style={meLoginStyles.primaryCtaLabelWrap}
                  pointerEvents="box-none"
                >
                  <Text
                    style={[
                      meLoginStyles.primaryLabel,
                      {
                        color: primaryEmphasis
                          ? ui.primaryText
                          : ui.mutedText,
                      },
                    ]}
                  >
                    {verifyBusy ? "CONTINUING..." : "CONTINUE"}
                  </Text>
                </View>
              </Pressable>

              <View style={meLoginStyles.dividerRow}>
                <View style={meLoginStyles.dividerLine} />
                <Text style={meLoginStyles.joinLabel}>Join with</Text>
                <View style={meLoginStyles.dividerLine} />
              </View>

              <View style={{ alignItems: "center" }}>
                <Pressable
                  style={[meLoginStyles.wechatBtn, { overflow: "hidden" }]}
                  onPress={() => {
                    showToast("微信登录即将支持。");
                  }}
                >
                  <View style={StyleSheet.absoluteFillObject}>
                    <LinearGradient
                      pointerEvents="none"
                      colors={[...wechatTileGradient.colors]}
                      start={wechatTileGradient.start}
                      end={wechatTileGradient.end}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        {
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <WechatLogo width={24} height={24} />
                    </View>
                  </View>
                </Pressable>
              </View>

              <View style={meLoginStyles.termsRow}>
                <Pressable
                  onPress={() => setAcceptedTerms((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedTerms }}
                >
                  <View
                    style={[
                      meLoginStyles.checkbox,
                      acceptedTerms
                        ? meLoginStyles.checkboxOn
                        : meLoginStyles.checkboxOff,
                    ]}
                  >
                    {acceptedTerms ? <Check size={12} color="#fff" /> : null}
                  </View>
                </Pressable>
                <Text style={meLoginStyles.termsText}>
                  By continuing, you agree to our{" "}
                  <Text
                    style={meLoginStyles.termsLink}
                    accessibilityRole="link"
                    onPress={() => router.push("/terms")}
                  >
                    Terms & Conditions
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={meLoginStyles.termsLink}
                    accessibilityRole="link"
                    onPress={() => router.push("/privacy")}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AuroraBackground>
  );
}
