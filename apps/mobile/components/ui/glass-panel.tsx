import { BlurView } from "expo-blur";
import type { PropsWithChildren } from "react";
import { Platform, View, type ViewStyle } from "react-native";

type GlassPanelProps = PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
}>;

export function GlassPanel({
  children,
  style,
  intensity = 30,
}: GlassPanelProps) {
  const baseStyle: ViewStyle = {
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(236, 243, 232, 0.72)",
    shadowColor: "rgba(0,0,0,1)",
    shadowOpacity: 0.06,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  };

  return (
    <View style={[baseStyle, style]}>
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={intensity}
          tint="light"
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
      ) : null}

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 42,
          backgroundColor: "rgba(255,255,255,0.14)",
        }}
      />

      <View style={{ position: "relative" }}>{children}</View>
    </View>
  );
}
