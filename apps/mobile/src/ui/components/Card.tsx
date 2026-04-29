import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';

export function Card({
  children,
  style,
  className,
}: PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  className?: string;
}>) {
  return (
    <View
      className={`rounded-2xl border border-border bg-cardBg p-4 shadow-sm ${className ?? ''}`}
      style={style}>
      {children}
    </View>
  );
}
