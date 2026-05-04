import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text as RNText,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import * as SecureStore from "expo-secure-store";
import { useToast } from "@/src/ui/toast";
import {
  createNewAccountSlot,
  getActiveAccountPrefix,
  loadAccounts,
  removeAccount,
  setActiveAccountPrefix,
  switchToAccount,
  type StoredAccount,
} from "@/src/auth/accounts";
import { getSession, signOut } from "@/src/auth/session";
import { upsertCurrentAccountMeta } from "@/src/auth/accounts";
import { apiFetch } from "@/src/lib/api";
import { ui } from "@/src/theme/rn";
import { DEFAULT_SCENES } from "@/src/domain/scenes";
import type { SceneId } from "@/src/domain/scenes";
import {
  loadDailyReminderPrefs,
  saveDailyReminderFromRule,
  type StoredDailyReminder,
} from "@/src/notifications/dailyReminderStorage";
import { requestReminderPermissions } from "@/src/notifications/reminders";
import type { ReminderRule } from "@/src/notifications/reminders";
import { settingsStyles } from "@/src/screenStyles/settingsScreen.styles";

function Row({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        settingsStyles.row,
        !onPress ? undefined : pressed ? { opacity: 0.8 } : undefined,
      ]}
      disabled={!onPress}
      onPress={onPress}
    >
      <View style={settingsStyles.rowLeft}>
        <Text style={settingsStyles.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text variant="muted" style={settingsStyles.rowSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? <ChevronRight size={18} color="#9CA3AF" />}
    </Pressable>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={settingsStyles.sectionGap}>
      <Text variant="muted" style={settingsStyles.sectionLabel}>
        {title}
      </Text>
      <View style={settingsStyles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [activePrefix, setActivePrefixState] = useState<string>("");
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [isAuthed, setIsAuthed] = useState(false);
  const [autoSavedOnce, setAutoSavedOnce] = useState(false);
  const [dailyReminder, setDailyReminder] = useState<StoredDailyReminder>({
    enabled: false,
    hour: 21,
    minute: 0,
    scene: "bedtime",
  });

  const persistDailyReminder = useCallback(
    async (next: Omit<ReminderRule, "notificationId">) => {
      try {
        const prev = await loadDailyReminderPrefs();
        const saved = await saveDailyReminderFromRule(prev, next);
        setDailyReminder(saved);
      } catch {
        showToast(
          lang === "zh" ? "保存提醒失败" : "Could not save reminder",
          { variant: "error" },
        );
      }
    },
    [lang, showToast],
  );

  const refresh = useCallback(async () => {
    const [list, active] = await Promise.all([
      loadAccounts(),
      getActiveAccountPrefix(),
    ]);
    setAccounts(list);
    setActivePrefixState(active);
    const storedLang = await SecureStore.getItemAsync("budgetcoach.lang.v1");
    if (storedLang === "en" || storedLang === "zh") setLang(storedLang);

    const s = await getSession();
    setIsAuthed(Boolean(s.data.session));

    const rem = await loadDailyReminderPrefs();
    setDailyReminder(rem);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.storagePrefix === activePrefix) ?? null,
    [accounts, activePrefix]
  );

  // If user is signed in but current account isn't in the local list yet,
  // silently save it once so the user only sees "Switch account / Sign out".
  useEffect(() => {
    if (!isAuthed || activeAccount || autoSavedOnce) return;
    setAutoSavedOnce(true);
    apiFetch<{
      ok: true;
      user: { email: string; phoneNumber?: string | null } | null;
    }>("/api/me")
      .then(async (me) => {
        const id = me.user?.phoneNumber ?? me.user?.email;
        if (!id) return;
        await upsertCurrentAccountMeta(id);
        await refresh();
      })
      .catch(() => {});
  }, [isAuthed, activeAccount, autoSavedOnce, refresh]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={settingsStyles.scroll}
        contentContainerStyle={settingsStyles.scrollContent}
      >
        <View style={settingsStyles.stackGap6}>
          <Section title="ACCOUNTS">
            {isAuthed ? (
              <>
                {accounts.length >= 2 ? (
                  <>
                    {accounts.map((a, idx) => (
                      <View key={a.storagePrefix}>
                        <Row
                          title={a.label}
                          subtitle={a.email}
                          right={
                            a.storagePrefix === activePrefix ? (
                              <Text variant="muted" style={settingsStyles.badgeMuted}>
                                当前
                              </Text>
                            ) : (
                              <ChevronRight size={18} color="#9CA3AF" />
                            )
                          }
                          onPress={async () => {
                            if (a.storagePrefix === activePrefix) return;
                            try {
                              await switchToAccount(a.storagePrefix);
                              showToast("已切换账号");
                              await refresh();
                              router.back();
                            } catch (e) {
                              showToast(
                                `切换失败：${
                                  e instanceof Error ? e.message : String(e)
                                }`,
                                { variant: "error" }
                              );
                            }
                          }}
                        />
                        {idx !== accounts.length - 1 ? (
                          <View style={settingsStyles.hairline} />
                        ) : null}
                      </View>
                    ))}
                    <View style={settingsStyles.hairline} />
                  </>
                ) : null}

                <Row
                  title="切换/新增账号"
                  subtitle="登录另一个账号并保存到本机"
                  onPress={async () => {
                    await createNewAccountSlot("");
                    showToast("请登录新账号");
                    router.back();
                  }}
                />
                <View style={settingsStyles.hairline} />
                <Row
                  title="登出"
                  subtitle={
                    activeAccount
                      ? `当前：${activeAccount.email}`
                      : "退出当前账号"
                  }
                  onPress={async () => {
                    const { error } = await signOut();
                    if (error)
                      showToast(`登出失败：${error.message}`, {
                        variant: "error",
                      });
                    else showToast("已登出");
                  }}
                />
              </>
            ) : (
              <Row
                title="登录"
                subtitle="登录后可云同步、多设备使用"
                onPress={() => router.push("/(tabs)/me" as never)}
              />
            )}
          </Section>

          <Section title="ACCOUNT">
            <Row
              title="Edit profile"
              subtitle="Name, avatar and more"
              onPress={() => router.push("/edit-profile" as never)}
            />
            <View style={settingsStyles.hairline} />
            <Row
              title="Deactivate account"
              subtitle="Soft delete (can be recovered later)"
              onPress={() => {
                Alert.alert(
                  "注销账号？",
                  "这会将账号标记为已注销，并退出所有设备。你之后需要联系支持恢复。",
                  [
                    { text: "取消", style: "cancel" },
                    {
                      text: "确认注销",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await apiFetch("/api/me/deactivate", {
                            method: "POST",
                          });
                          if (activePrefix) {
                            await removeAccount(activePrefix);
                          }
                          await signOut();
                          showToast("账号已注销");
                          // Switch to base prefix so app isn't stuck on a deleted slot.
                          await setActiveAccountPrefix("budgetcoach");
                          await refresh();
                          router.back();
                        } catch (e) {
                          showToast(
                            `注销失败：${
                              e instanceof Error ? e.message : String(e)
                            }`,
                            { variant: "error" }
                          );
                        }
                      },
                    },
                  ]
                );
              }}
            />
          </Section>

          <Section title="BUDGET">
            <Row
              title={lang === "zh" ? "月度预算" : "Monthly budget"}
              subtitle={
                lang === "zh"
                  ? "支出上限与参考说明"
                  : "Spend cap and reference notes"
              }
              onPress={() => router.push("/budget-settings" as never)}
            />
          </Section>

          <Section title="NOTIFICATIONS">
            <View style={settingsStyles.row}>
              <View style={settingsStyles.rowLeft}>
                <Text style={settingsStyles.rowTitle}>
                  {lang === "zh" ? "每日记账提醒" : "Daily reminder"}
                </Text>
                <Text variant="muted" style={settingsStyles.rowSubtitle}>
                  {lang === "zh"
                    ? "本地定时通知，固定时间提醒打开记账"
                    : "Local notification at a fixed time"}
                </Text>
              </View>
              <Switch
                value={dailyReminder.enabled}
                onValueChange={async (v) => {
                  if (v) {
                    const ok = await requestReminderPermissions();
                    if (!ok) {
                      showToast(
                        lang === "zh"
                          ? "需要通知权限"
                          : "Notification permission required",
                        { variant: "error" },
                      );
                      return;
                    }
                  }
                  await persistDailyReminder({
                    enabled: v,
                    hour: dailyReminder.hour,
                    minute: dailyReminder.minute,
                    scene: dailyReminder.scene,
                  });
                }}
              />
            </View>

            {dailyReminder.enabled ? (
              <>
                <View style={settingsStyles.hairline} />
                <View style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
                  <RNText style={{ fontSize: 12, color: ui.mutedText }}>
                    {lang === "zh" ? "时间（本地定时）" : "Time (local)"}
                  </RNText>
                  <View style={settingsStyles.reminderTools}>
                    <RNText style={{ width: 36, fontSize: 13, color: ui.mutedText }}>
                      {lang === "zh" ? "时" : "H"}
                    </RNText>
                    <Pressable
                      style={({ pressed }) => [
                        settingsStyles.stepperBtn,
                        pressed ? { opacity: 0.85 } : undefined,
                      ]}
                      onPress={() =>
                        void persistDailyReminder({
                          enabled: true,
                          hour: (dailyReminder.hour + 23) % 24,
                          minute: dailyReminder.minute,
                          scene: dailyReminder.scene,
                        })
                      }
                    >
                      <RNText style={settingsStyles.stepperVal}>−</RNText>
                    </Pressable>
                    <RNText style={[settingsStyles.stepperVal, { minWidth: 36, textAlign: "center" }]}>
                      {String(dailyReminder.hour).padStart(2, "0")}
                    </RNText>
                    <Pressable
                      style={({ pressed }) => [
                        settingsStyles.stepperBtn,
                        pressed ? { opacity: 0.85 } : undefined,
                      ]}
                      onPress={() =>
                        void persistDailyReminder({
                          enabled: true,
                          hour: (dailyReminder.hour + 1) % 24,
                          minute: dailyReminder.minute,
                          scene: dailyReminder.scene,
                        })
                      }
                    >
                      <RNText style={settingsStyles.stepperVal}>+</RNText>
                    </Pressable>
                  </View>
                  <View style={settingsStyles.reminderTools}>
                    <RNText style={{ width: 36, fontSize: 13, color: ui.mutedText }}>
                      {lang === "zh" ? "分" : "M"}
                    </RNText>
                    <Pressable
                      style={({ pressed }) => [
                        settingsStyles.stepperBtn,
                        pressed ? { opacity: 0.85 } : undefined,
                      ]}
                      onPress={() =>
                        void persistDailyReminder({
                          enabled: true,
                          hour: dailyReminder.hour,
                          minute: (dailyReminder.minute + 59) % 60,
                          scene: dailyReminder.scene,
                        })
                      }
                    >
                      <RNText style={settingsStyles.stepperVal}>−</RNText>
                    </Pressable>
                    <RNText style={[settingsStyles.stepperVal, { minWidth: 36, textAlign: "center" }]}>
                      {String(dailyReminder.minute).padStart(2, "0")}
                    </RNText>
                    <Pressable
                      style={({ pressed }) => [
                        settingsStyles.stepperBtn,
                        pressed ? { opacity: 0.85 } : undefined,
                      ]}
                      onPress={() =>
                        void persistDailyReminder({
                          enabled: true,
                          hour: dailyReminder.hour,
                          minute: (dailyReminder.minute + 1) % 60,
                          scene: dailyReminder.scene,
                        })
                      }
                    >
                      <RNText style={settingsStyles.stepperVal}>+</RNText>
                    </Pressable>
                  </View>
                </View>
                <View style={settingsStyles.hairline} />
                <Pressable
                  style={({ pressed }) => [
                    settingsStyles.row,
                    pressed ? { opacity: 0.85 } : undefined,
                  ]}
                  onPress={() => {
                    const idx = DEFAULT_SCENES.findIndex(
                      (s) => s.id === dailyReminder.scene,
                    );
                    const nextScene = DEFAULT_SCENES[
                      (idx + 1) % DEFAULT_SCENES.length
                    ].id as SceneId;
                    void persistDailyReminder({
                      enabled: true,
                      hour: dailyReminder.hour,
                      minute: dailyReminder.minute,
                      scene: nextScene,
                    });
                  }}
                >
                  <View style={settingsStyles.rowLeft}>
                    <Text style={settingsStyles.rowTitle}>
                      {lang === "zh" ? "提醒场景" : "Scene"}
                    </Text>
                    <Text variant="muted" style={settingsStyles.rowSubtitle}>
                      {DEFAULT_SCENES.find((s) => s.id === dailyReminder.scene)
                        ?.title ?? dailyReminder.scene}
                    </Text>
                  </View>
                  <RNText style={{ color: ui.mutedText }}>›</RNText>
                </Pressable>
              </>
            ) : null}
          </Section>

          <Section title="PREFERENCES">
            <Row
              title="Language"
              subtitle={lang === "zh" ? "Chinese" : "English"}
              onPress={async () => {
                const next = lang === "zh" ? "en" : "zh";
                setLang(next);
                await SecureStore.setItemAsync("budgetcoach.lang.v1", next);
                showToast(
                  next === "zh" ? "已切换为中文" : "Switched to English"
                );
              }}
            />
          </Section>

          <Pressable style={settingsStyles.backPress} onPress={() => router.back()}>
            <Text variant="muted" style={settingsStyles.backText}>
              Back
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
