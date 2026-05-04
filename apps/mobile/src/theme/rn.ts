import {
  Platform,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import Colors from "@/constants/Colors";

/** 当前应用以浅色为主；组件默认用 light token */
export const ui = Colors.light;

export const fonts = {
  sans: "DINPro-Regular",
  sansMedium: "DINPro-Medium",
  sansBold: "DINPro-Bold",
  serifTitle: "CormorantGaramond_700Bold",
  nunito: "Nunito_600SemiBold",
  nunitoBold: "Nunito_800ExtraBold",
} as const;

export function mergeText(
  ...styles: StyleProp<TextStyle>[]
): TextStyle {
  return StyleSheet.flatten(styles) as TextStyle;
}

export function mergeView(
  ...styles: StyleProp<ViewStyle>[]
): ViewStyle {
  return StyleSheet.flatten(styles) as ViewStyle;
}

/** 跨平台细线宽度 */
export const hairline = Platform.select({
  ios: StyleSheet.hairlineWidth,
  android: StyleSheet.hairlineWidth,
  default: 1,
});
