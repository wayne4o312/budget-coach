import { ScrollView, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Text } from "@/components/ui/text";
import { fonts, ui } from "@/src/theme/rn";

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: ui.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
    gap: 16,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
    color: ui.mutedText,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.sansMedium,
    color: ui.text,
    marginTop: 8,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 22,
    color: ui.mutedText,
  },
});

export function LegalDocumentScreen({
  stackTitle,
  lastUpdated,
  children,
}: {
  stackTitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Stack.Screen
        options={{ title: stackTitle, headerShadowVisible: false }}
      />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.meta}>最后更新：{lastUpdated}</Text>
        <View style={{ gap: 12 }}>{children}</View>
      </ScrollView>
    </>
  );
}

export function LegalSection({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text variant="muted" style={s.paragraph}>
        {body}
      </Text>
    </View>
  );
}

export const legalStyles = s;
