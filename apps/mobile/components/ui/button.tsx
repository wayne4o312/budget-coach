import * as React from "react";
import {
  Pressable,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { TextStyleContext } from "@/components/ui/text";
import { mergeView, ui } from "@/src/theme/rn";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

const containerByVariant: Record<Variant, ViewStyle> = {
  default: {
    backgroundColor: ui.primary,
    borderRadius: 4,
  },
  destructive: {
    backgroundColor: "#a32f2d",
    borderRadius: 4,
  },
  outline: {
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.background,
    borderRadius: 4,
  },
  secondary: {
    backgroundColor: ui.backgroundMuted,
    borderRadius: 4,
  },
  ghost: {
    backgroundColor: "transparent",
    borderRadius: 4,
  },
  link: {
    backgroundColor: "transparent",
  },
};

const containerBySize: Record<Size, ViewStyle> = {
  default: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 4,
  },
  lg: {
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  icon: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
};

const labelByVariant: Record<Variant, TextStyle> = {
  default: { color: ui.primaryText, fontSize: 14, fontWeight: "600" },
  destructive: { color: "#fff", fontSize: 14, fontWeight: "600" },
  outline: { color: ui.text, fontSize: 14, fontWeight: "600" },
  secondary: { color: ui.text, fontSize: 14, fontWeight: "600" },
  ghost: { color: ui.text, fontSize: 14, fontWeight: "600" },
  link: {
    color: ui.primary,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
};

type ButtonProps = PressableProps & {
  variant?: Variant;
  size?: Size;
};

function Button({
  style,
  disabled,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const labelStyle = labelByVariant[variant];
  return (
    <TextStyleContext.Provider value={labelStyle}>
      <Pressable
        role="button"
        disabled={disabled}
        style={({ pressed }) =>
          mergeView(
            containerByVariant[variant],
            containerBySize[size],
            disabled ? { opacity: 0.5 } : undefined,
            pressed && variant !== "link" ? { opacity: 0.92 } : undefined,
            style as ViewStyle,
          )
        }
        {...props}
      />
    </TextStyleContext.Provider>
  );
}

export { Button };
export type { ButtonProps };
