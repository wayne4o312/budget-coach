import { BlurView } from "expo-blur";
import {
  Modal,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { SPEND_CATEGORIES } from "@/src/domain/spendCategories";
import { fonts, ui } from "@/src/theme/rn";

type Props = {
  open: boolean;
  onClose: () => void;
  kind?: "expense" | "income";
  /** 返回中文类目名，写入本地流水 */
  onSelect: (categoryLabel: string) => void;
};

const abs = StyleSheet.absoluteFillObject;

const s = StyleSheet.create({
  root: { flex: 1 },
  grain: { ...abs, backgroundColor: "rgba(255,255,255,0.10)" },
  blobTop: {
    position: "absolute",
    top: -96,
    left: -40,
    width: 288,
    height: 288,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  blobBot: {
    position: "absolute",
    bottom: -96,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  headerPad: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  w40: { width: 40 },
  headerCenter: { alignItems: "center" },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1,
    color: "rgba(28,24,20,0.6)",
  },
  title: {
    marginTop: 4,
    fontSize: 18,
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.2,
    color: ui.text,
  },
  closeBtn: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  panelWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  panelOuter: {
    width: "100%",
    maxWidth: 520,
    overflow: "hidden",
    borderRadius: 28,
  },
  panelGrain: { ...abs, backgroundColor: "rgba(255,255,255,0.10)" },
  panelInner: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 24 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  tile: {
    width: "23%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 12,
  },
  iconWrap: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  tileLabel: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: "rgba(28,24,20,0.9)",
  },
  footnote: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 12,
    color: "rgba(28,24,20,0.55)",
  },
});

export function SpendCategorySheet({ open, onClose, onSelect }: Props) {
  const colorScheme = useColorScheme();
  const tint = colorScheme === "dark" ? "dark" : "light";
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      /** 关闭时若用 fade，会盖在 stack 上需等动画结束才看到计算器；选分类后应立刻进下一页 */
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <BlurView
          intensity={tint === "dark" ? 46 : 86}
          tint={tint}
          style={abs}
        >
          <View style={s.grain} />
          <View style={s.blobTop} />
          <View style={s.blobBot} />
        </BlurView>

        <Pressable style={abs} onPress={onClose} accessibilityLabel="关闭菜单" />

        <View
          style={[s.headerPad, { paddingTop: Math.max(18, insets.top + 14) }]}
          pointerEvents="box-none"
        >
          <View style={s.headerRow}>
            <View style={s.w40} />
            <View style={s.headerCenter}>
              <Text style={s.eyebrow}>记一笔</Text>
              <Text style={s.title}>选择消费类型</Text>
            </View>
            <Pressable
              accessibilityLabel="关闭"
              onPress={onClose}
              style={({ pressed }) => [s.closeBtn, pressed ? { opacity: 0.7 } : undefined]}
              hitSlop={10}
            >
              <X size={18} color="rgba(28,24,20,0.9)" strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <View style={s.panelWrap} pointerEvents="box-none">
          <BlurView
            intensity={tint === "dark" ? 52 : 92}
            tint={tint}
            style={s.panelOuter}
          >
            <View style={s.panelGrain} />
            <View style={s.panelInner}>
              <View style={s.grid}>
                {SPEND_CATEGORIES.map((c) => {
                  const Icon = c.Icon;
                  return (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      accessibilityLabel={c.label}
                      onPress={() => onSelect(c.label)}
                      style={({ pressed }) => [
                        s.tile,
                        pressed ? { opacity: 0.7 } : undefined,
                      ]}
                    >
                      <View style={s.iconWrap}>
                        <Icon
                          size={22}
                          color="rgba(28,24,20,0.90)"
                          strokeWidth={2.1}
                        />
                      </View>
                      <Text style={s.tileLabel}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={s.footnote}>点击空白处关闭</Text>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}
