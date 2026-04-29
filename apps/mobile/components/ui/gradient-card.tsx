import { LinearGradient } from "expo-linear-gradient";
import * as React from "react";
import type { PropsWithChildren } from "react";
import { View, Text, type ViewStyle } from "react-native";

import { cn } from "@/components/lib/utils";

type BoundaryState = { hasError: boolean };

class LinearGradientBoundary extends React.PureComponent<
  PropsWithChildren<{ fallback: React.ReactNode }>,
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) {
      console.warn(
        "[GradientCard] LinearGradient crashed; falling back to solid background.",
        error
      );
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function GradientCard({
  children,
  className,
  style,
  colors = ["#FCF7EF", "#F2E5D6"],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: PropsWithChildren<{
  className?: string;
  style?: ViewStyle | ViewStyle[];
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}>) {
  const fallback = (
    <View
      className={cn("border-border rounded-lg border bg-card", className)}
      style={[{ backgroundColor: colors[0] }, style]}
    >
      {__DEV__ ? (
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: "rgba(0,0,0,0.45)",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#FFB020",
            }}
          />
          <Text
            style={{
              color: "rgba(255,255,255,0.92)",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            GRADIENT OFF
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <LinearGradientBoundary fallback={fallback}>
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        className={cn("border-border rounded-lg border", className)}
        style={style}
      >
        {children}
      </LinearGradient>
    </LinearGradientBoundary>
  );
}
