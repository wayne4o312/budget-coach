import type { TextProps as RNTextProps, TextStyle } from "react-native";
import { Text } from "react-native";

import Colors from "@/constants/Colors";

const C = Colors.light;

function toneColor(tone: "default" | "muted" | "primary" | undefined) {
  switch (tone) {
    case "primary":
      return C.primary;
    case "muted":
      return C.mutedText;
    default:
      return C.text;
  }
}

export type TypographyProps = RNTextProps & {
  tone?: "default" | "muted" | "primary";
};

const title: TextStyle = {
  fontFamily: "Nunito_800ExtraBold",
  fontSize: 32,
  lineHeight: 38,
  letterSpacing: -0.2,
};
const heading: TextStyle = {
  fontFamily: "Nunito_800ExtraBold",
  fontSize: 18,
  lineHeight: 24,
};
const body: TextStyle = {
  fontFamily: "Nunito_600SemiBold",
  fontSize: 15,
  lineHeight: 21,
};
const caption: TextStyle = {
  fontFamily: "Nunito_600SemiBold",
  fontSize: 13,
  lineHeight: 18,
};
const label: TextStyle = {
  fontFamily: "Nunito_800ExtraBold",
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 0.2,
};

export function Title({ style, tone = "default", ...props }: TypographyProps) {
  return (
    <Text
      style={[title, { color: toneColor(tone) }, style]}
      {...props}
    />
  );
}

export function Heading({ style, tone = "default", ...props }: TypographyProps) {
  return (
    <Text
      style={[heading, { color: toneColor(tone) }, style]}
      {...props}
    />
  );
}

export function Body({ style, tone = "default", ...props }: TypographyProps) {
  return (
    <Text style={[body, { color: toneColor(tone) }, style]} {...props} />
  );
}

export function Caption({ style, tone = "muted", ...props }: TypographyProps) {
  return (
    <Text
      style={[caption, { color: toneColor(tone) }, style]}
      {...props}
    />
  );
}

export function Label({ style, tone = "muted", ...props }: TypographyProps) {
  return (
    <Text style={[label, { color: toneColor(tone) }, style]} {...props} />
  );
}
