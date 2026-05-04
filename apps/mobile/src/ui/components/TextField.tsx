import type { TextInputProps, TextStyle } from "react-native";
import { TextInput } from "react-native";

import Colors from "@/constants/Colors";

const C = Colors.light;

const base: TextStyle = {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: C.border,
  backgroundColor: C.backgroundMuted,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontFamily: "Nunito_600SemiBold",
  fontSize: 15,
  lineHeight: 21,
  color: C.text,
};

export function TextField({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={C.mutedText}
      style={[base, style]}
      {...props}
    />
  );
}
