import * as React from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";

import { Text, TextStyleContext } from "@/components/ui/text";
import { mergeText, mergeView, ui } from "@/src/theme/rn";

const cardBase: ViewStyle = {
  backgroundColor: ui.card,
  borderWidth: 1,
  borderColor: ui.border,
  borderRadius: 8,
  paddingVertical: 24,
  gap: 24,
  flexDirection: "column",
};

function Card({ style, ...props }: ViewProps) {
  return (
    <TextStyleContext.Provider value={{ color: ui.text }}>
      <View style={mergeView(cardBase, style)} {...props} />
    </TextStyleContext.Provider>
  );
}

const headerStyle: ViewStyle = {
  flexDirection: "column",
  gap: 6,
  paddingHorizontal: 24,
};

function CardHeader({ style, ...props }: ViewProps) {
  return <View style={mergeView(headerStyle, style)} {...props} />;
}

function CardTitle({ style, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      accessibilityRole="header"
      style={mergeText({ fontWeight: "600", paddingTop: 1 }, style)}
      {...props}
    />
  );
}

function CardDescription({ style, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      variant="muted"
      style={mergeText({ fontSize: 14 }, style)}
      {...props}
    />
  );
}

function CardContent({ style, ...props }: ViewProps) {
  return <View style={mergeView({ paddingHorizontal: 24 }, style)} {...props} />;
}

const footerStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 24,
};

function CardFooter({ style, ...props }: ViewProps) {
  return <View style={mergeView(footerStyle, style)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
