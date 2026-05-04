import type { PropsWithChildren } from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";

import Colors from "@/constants/Colors";

const C = Colors.light;

const base: ViewStyle = {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: C.border,
  backgroundColor: C.card,
  padding: 16,
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export function Card({
  children,
  style,
}: PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
}>) {
  return <View style={[base, style]}>{children}</View>;
}
