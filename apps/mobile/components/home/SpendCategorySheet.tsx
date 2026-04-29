import { BlurView } from "expo-blur";
import {
  Modal,
  Pressable,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { SPEND_CATEGORIES } from "@/src/domain/spendCategories";

type Props = {
  open: boolean;
  onClose: () => void;
  kind?: "expense" | "income";
  /** 返回中文类目名，写入本地流水 */
  onSelect: (categoryLabel: string) => void;
};

export function SpendCategorySheet({ open, onClose, onSelect }: Props) {
  const colorScheme = useColorScheme();
  const tint = colorScheme === "dark" ? "dark" : "light";
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* 全屏玻璃背景 */}
        <BlurView
          intensity={tint === "dark" ? 46 : 86}
          tint={tint}
          className="absolute inset-0"
        >
          {/* subtle grain/highlight layers (no hard lines) */}
          <View className="absolute inset-0 bg-white/10" />
          <View className="absolute -top-24 left-[-40px] h-72 w-72 rounded-full bg-white/18" />
          <View className="absolute -bottom-24 right-[-60px] h-80 w-80 rounded-full bg-white/10" />
        </BlurView>

        {/* 点击空白关闭 */}
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel="关闭菜单"
        />

        {/* 顶部：标题 + 关闭 */}
        <View
          className="px-5"
          style={{ paddingTop: Math.max(18, insets.top + 14) }}
          pointerEvents="box-none"
        >
          <View className="flex-row items-center justify-between">
            <View className="w-10" />
            <View className="items-center">
              <Text className="text-[12px] tracking-[1px] text-foreground/60">
                记一笔
              </Text>
              <Text className="mt-1 text-[18px] font-sansMedium tracking-[0.2px] text-foreground">
                选择消费类型
              </Text>
            </View>
            <Pressable
              accessibilityLabel="关闭"
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/18 active:opacity-70"
              hitSlop={10}
            >
              <X size={18} color="rgba(28,24,20,0.9)" strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        {/* 中间：App 菜单面板 */}
        <View className="flex-1 items-center justify-center px-6" pointerEvents="box-none">
          <BlurView
            intensity={tint === "dark" ? 52 : 92}
            tint={tint}
            className="w-full max-w-[520px] overflow-hidden rounded-[28px]"
          >
            <View className="absolute inset-0 bg-white/10" />
            <View className="px-5 pb-6 pt-6">
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {SPEND_CATEGORIES.map((c) => {
                  const Icon = c.Icon;
                  return (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      accessibilityLabel={c.label}
                      onPress={() => onSelect(c.label)}
                      className="w-[23%] items-center justify-center gap-2 rounded-3xl bg-white/12 py-3 active:opacity-70"
                    >
                      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/16">
                        <Icon
                          size={22}
                          color="rgba(28,24,20,0.90)"
                          strokeWidth={2.1}
                        />
                      </View>
                      <Text className="text-[12px] font-sansMedium text-foreground/90">
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="mt-5 text-center text-[12px] text-foreground/55">
                点击空白处关闭
              </Text>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}
