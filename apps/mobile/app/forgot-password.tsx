import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import { Text } from "@/components/ui/text";
import { fonts, ui } from "@/src/theme/rn";

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 },
  stack: { gap: 24 },
  title: {
    fontSize: 16,
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.6,
    color: ui.text,
  },
  body: { fontSize: 12, lineHeight: 20 },
  primaryBtn: {
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  primaryLabel: { fontSize: 15, fontWeight: "600", color: "#fff" },
  ghostPress: { alignItems: "center", paddingVertical: 8 },
  ghostText: { fontSize: 12 },
});

export default function ForgotPasswordScreen() {
  return (
    <>
      <Stack.Screen
        options={{ title: "登录帮助", headerShadowVisible: false }}
      />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.stack}>
          <Text style={s.title}>手机号验证码登录</Text>
          <Text variant="muted" style={s.body}>
            当前已使用「手机号 + 短信验证码」登录，无需密码。请打开「我的」页，输入手机号后点击「获取验证码」，凭短信中的
            6 位数字完成登录或注册。
          </Text>
          <Pressable
            style={s.primaryBtn}
            onPress={() => router.replace("/(tabs)/me" as never)}
          >
            <Text style={s.primaryLabel}>前往「我的」登录</Text>
          </Pressable>
          <Pressable style={s.ghostPress} onPress={() => router.back()}>
            <Text variant="muted" style={s.ghostText}>
              返回
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
