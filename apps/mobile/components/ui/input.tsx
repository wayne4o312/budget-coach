import * as React from "react";
import { Platform, TextInput, type TextInputProps, type TextStyle } from "react-native";

import { mergeText, ui } from "@/src/theme/rn";

const base: TextStyle = {
  borderWidth: 1,
  borderColor: ui.border,
  backgroundColor: ui.background,
  color: ui.text,
  minHeight: 40,
  width: "100%",
  minWidth: 0,
  borderRadius: 4,
  paddingHorizontal: 12,
  paddingVertical: Platform.OS === "ios" ? 10 : 8,
  fontSize: 16,
  lineHeight: 20,
};

function Input({ style, editable, ...props }: TextInputProps) {
  const disabled = editable === false;
  return (
    <TextInput
      placeholderTextColor={ui.mutedText}
      editable={editable}
      style={mergeText(
        base,
        disabled ? { opacity: 0.5 } : undefined,
        style,
      )}
      {...props}
    />
  );
}

export { Input };
