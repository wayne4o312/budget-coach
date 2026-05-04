import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/src/ui/toast";
import { apiFetch } from "@/src/lib/api";
import { Palette } from "@/src/theme/palette";
import { fonts, mergeText, ui } from "@/src/theme/rn";

type MeResponse = {
  ok: true;
  user: {
    email: string;
    name: string;
    nickname?: string | null;
    title?: string | null;
  } | null;
};

const s = StyleSheet.create({
  kav: { flex: 1, backgroundColor: ui.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingVertical: 24 },
  stack: { gap: 24 },
  card: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: ui.mutedText,
  },
  input: {
    marginTop: 12,
    height: 48,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.background,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  hint: { marginTop: 8, fontSize: 12, color: Palette.destructive },
  saveBtn: {
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
  },
  saveBtnOn: { backgroundColor: "#000" },
  saveBtnOff: { backgroundColor: ui.backgroundMuted },
  saveLabel: { fontSize: 15, fontWeight: "600" },
  cancelPress: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 12 },
});

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
            <View style={s.card}>
              <Text variant="muted" style={s.label}>
                NICKNAME
              </Text>
              <Input
                style={mergeText(s.input)}
                value={nickname}
                onChangeText={setNickname}
                placeholder="你的昵称"
              />
              {nicknameHint ? (
                <Text variant="muted" style={s.hint}>
                  {nicknameHint}
                </Text>
              ) : null}
            </View>

            <View style={s.card}>
              <Text variant="muted" style={s.label}>
                TITLE
              </Text>
              <Input
                style={mergeText(s.input)}
                value={title}
                onChangeText={setTitle}
                placeholder="比如：Product Designer"
              />
              {titleHint ? (
                <Text variant="muted" style={s.hint}>
                  {titleHint}
                </Text>
              ) : null}
            </View>

            <Pressable
              style={[s.saveBtn, canSave ? s.saveBtnOn : s.saveBtnOff]}
              disabled={!canSave}
              onPress={async () => {
                if (!canSave) return;
                setBusy(true);
                try {
                  await apiFetch("/api/me", {
                    method: "PATCH",
                    json: {
                      nickname: nickname.trim(),
                      title: title.trim() || undefined,
                    },
                  });
                  showToast("已保存");
                  router.back();
                } catch (e) {
                  showToast(
                    `保存失败：${e instanceof Error ? e.message : String(e)}`,
                    {
                      variant: "error",
                    }
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text
                style={mergeText(s.saveLabel, {
                  color: canSave ? "#fff" : ui.mutedText,
                  fontFamily: fonts.sansMedium,
                })}
              >
                {busy ? "SAVING..." : "SAVE"}
              </Text>
            </Pressable>

            <Pressable
              style={s.cancelPress}
              onPress={() => router.back()}
            >
              <Text variant="muted" style={s.cancelText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
