import type { PropsWithChildren } from 'react';
import { Pressable, type ViewStyle } from 'react-native';

import { Body } from '@/src/ui/components/Typography';

type Variant = 'primary' | 'secondary';

export function Button({
  children,
  onPress,
  disabled,
  variant = 'primary',
  style,
  className,
}: PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={[
        'rounded-2xl px-5 py-3 active:opacity-90',
        disabled ? 'opacity-50' : 'opacity-100',
        variant === 'primary'
          ? 'bg-primary'
          : 'border border-border bg-cardBg',
        className ?? '',
      ].join(' ')}
      style={style}>
      <Body className={variant === 'primary' ? 'text-white' : 'text-text'}>{children}</Body>
    </Pressable>
  );
}
