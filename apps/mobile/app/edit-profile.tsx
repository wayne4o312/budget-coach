import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { Stack, router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/src/ui/toast";
import { apiFetch } from "@/src/lib/api";

type MeResponse = {
  ok: true;
  user: {
    email: string;
    name: string;
    nickname?: string | null;
    title?: string | null;
  } | null;
};

export default function EditProfileScreen() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiFetch<MeResponse>("/api/me")
      .then((res) => {
        if (!mounted) return;
        const u = res.user;
        setNickname((u?.nickname ?? u?.name ?? "").toString());
        setTitle((u?.title ?? "").toString());
      })
      .catch((e) => {
        if (!mounted) return;
        showToast(`读取失败：${e instanceof Error ? e.message : String(e)}`, {
          variant: "error",
        });
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const nicknameHint = useMemo(() => {
    if (!nickname.trim()) return "昵称不能为空";
    if (nickname.trim().length > 30) return "昵称最多 30 字";
    return "";
  }, [nickname]);
  const titleHint = useMemo(() => {
    if (!title.trim()) return "";
    if (title.trim().length > 30) return "头衔最多 30 字";
    return "";
  }, [title]);

  const canSave = !loading && !busy && !nicknameHint && !titleHint;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit profile",
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-6">
            <View className="rounded-none border border-border bg-card px-4 py-4">
              <Text variant="muted" className="text-[11px] tracking-[1.2px]">
                NICKNAME
              </Text>
              <Input
                className="mt-3 h-12 w-full rounded-none border border-border bg-background px-3 py-0"
                value={nickname}
                onChangeText={setNickname}
                placeholder="你的昵称"
              />
              {nicknameHint ? (
                <Text variant="muted" className="mt-2 text-[12px] text-destructive">
                  {nicknameHint}
                </Text>
              ) : null}
            </View>

            <View className="rounded-none border border-border bg-card px-4 py-4">
              <Text variant="muted" className="text-[11px] tracking-[1.2px]">
                TITLE
              </Text>
              <Input
                className="mt-3 h-12 w-full rounded-none border border-border bg-background px-3 py-0"
                value={title}
                onChangeText={setTitle}
                placeholder="比如：Product Designer"
              />
              {titleHint ? (
                <Text variant="muted" className="mt-2 text-[12px] text-destructive">
                  {titleHint}
                </Text>
              ) : null}
            </View>

            <Pressable
              className={`h-12 w-full items-center justify-center rounded-none active:opacity-90 ${
                canSave ? "bg-black" : "bg-muted"
              }`}
              disabled={!canSave}
              onPress={async () => {
                if (!canSave) return;
                setBusy(true);
                try {
                  await apiFetch("/api/me", {
                    method: "PATCH",
                    json: { nickname: nickname.trim(), title: title.trim() || undefined },
                  });
                  showToast("已保存");
                  router.back();
                } catch (e) {
                  showToast(`保存失败：${e instanceof Error ? e.message : String(e)}`, {
                    variant: "error",
                  });
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text
                className={`text-[15px] font-medium ${
                  canSave ? "text-white" : "text-muted-foreground"
                }`}
              >
                {busy ? "SAVING..." : "SAVE"}
              </Text>
            </Pressable>

            <Pressable className="items-center py-2 active:opacity-70" onPress={() => router.back()}>
              <Text variant="muted" className="text-[12px]">
                Cancel
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

