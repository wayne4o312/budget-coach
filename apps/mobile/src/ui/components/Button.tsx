import type { PropsWithChildren } from "react";
import { Pressable, type ViewStyle } from "react-native";

import { Body } from "@/src/ui/components/Typography";
import Colors from "@/constants/Colors";

const C = Colors.light;

type Variant = "primary" | "secondary";

export function Button({
  children,
  onPress,
  disabled,
  variant = "primary",
  style,
}: PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle | ViewStyle[];
}>) {
  const surface: ViewStyle =
    variant === "primary"
      ? {
          backgroundColor: C.primary,
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 12,
        }
      : {
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.card,
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 12,
        };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        surface,
        disabled ? { opacity: 0.5 } : undefined,
        !disabled && pressed ? { opacity: 0.9 } : undefined,
        style,
      ]}
    >
      <Body
        style={{
          color: variant === "primary" ? C.primaryText : C.text,
          textAlign: "center",
        }}
      >
        {children}
      </Body>
    </Pressable>
  );
}
