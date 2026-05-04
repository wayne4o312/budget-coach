import * as Slot from "@rn-primitives/slot";
import * as React from "react";
import {
  Platform,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";

import { fonts, mergeText, ui } from "@/src/theme/rn";

export const TextStyleContext = React.createContext<TextStyle | undefined>(
  undefined,
);

/** @deprecated use TextStyleContext */
export const TextClassContext = TextStyleContext;

const baseText: TextStyle = {
  fontSize: 16,
  lineHeight: 22,
  fontFamily: fonts.sans,
  color: ui.text,
};

const variantStyles: Record<string, TextStyle> = {
  default: {},
  h1: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fonts.serifTitle,
    letterSpacing: -0.3,
    color: ui.text,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fonts.serifTitle,
    letterSpacing: -0.2,
    color: ui.text,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.serifTitle,
    letterSpacing: -0.1,
    color: ui.text,
  },
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.sansMedium,
    color: ui.text,
  },
  p: { lineHeight: 28 },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: ui.border,
    paddingLeft: 12,
    fontStyle: "italic",
  },
  code: {
    backgroundColor: ui.backgroundMuted,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
    fontWeight: "600",
  },
  lead: {
    fontSize: 18,
    lineHeight: 24,
    color: ui.mutedText,
  },
  large: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.sansMedium,
    color: ui.text,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.sans,
    color: ui.text,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    color: ui.mutedText,
    fontFamily: fonts.sans,
  },
};

type Variant = keyof typeof variantStyles;

function Text({
  style,
  asChild = false,
  variant = "default",
  accessibilityRole,
  ...props
}: RNTextProps & {
  asChild?: boolean;
  variant?: Variant;
}) {
  const inherited = React.useContext(TextStyleContext);
  const Component = asChild ? Slot.Text : RNText;
  const v = variantStyles[variant] ?? variantStyles.default;

  return (
    <Component
      accessibilityRole={
        typeof variant === "string" && /^h[1-4]$/.test(variant)
          ? "header"
          : accessibilityRole
      }
      style={mergeText(baseText, v, inherited, style)}
      {...props}
    />
  );
}

export { Text };
