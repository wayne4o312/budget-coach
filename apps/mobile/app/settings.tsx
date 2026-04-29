import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
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
      className="flex-row items-center justify-between px-4 py-3 active:opacity-80"
      disabled={!onPress}
      onPress={onPress}
    >
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-sansBold">{title}</Text>
        {subtitle ? (
          <Text variant="muted" className="mt-[2px] text-xs">
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
    <View className="gap-2">
      <Text variant="muted" className="px-1 text-[11px] tracking-[1.2px]">
        {title}
      </Text>
      <View className="rounded-none border border-border bg-card">
        {children}
      </View>
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
    apiFetch<{ ok: true; user: { email: string } | null }>("/api/me")
      .then(async (me) => {
        const email = me.user?.email;
        if (!email) return;
        await upsertCurrentAccountMeta(email);
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
        className="flex-1 bg-background"
        contentContainerClassName="px-6 py-6"
      >
        <View className="gap-6">
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
                              <Text
                                variant="muted"
                                className="text-[11px] tracking-[1px]"
                              >
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
                          <View className="h-px bg-border" />
                        ) : null}
                      </View>
                    ))}
                    <View className="h-px bg-border" />
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
                <View className="h-px bg-border" />
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
            <View className="h-px bg-border" />
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

          <Pressable
            className="items-center py-2 active:opacity-70"
            onPress={() => router.back()}
          >
            <Text variant="muted" className="text-[12px]">
              Back
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
