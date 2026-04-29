import type { TextProps as RNTextProps } from 'react-native';
import { Text } from 'react-native';

export type TypographyProps = RNTextProps & {
  tone?: 'default' | 'muted' | 'primary';
  className?: string;
};

function toneClass(tone: TypographyProps['tone']) {
  switch (tone) {
    case 'primary':
      return 'text-primary';
    case 'muted':
      return 'text-muted';
    default:
      return 'text-text';
  }
}

export function Title({ className, tone = 'default', ...props }: TypographyProps) {
  return (
    <Text
      className={`font-nunitoBold text-[32px] leading-[38px] tracking-[-0.2px] ${toneClass(tone)} ${
        className ?? ''
      }`}
      {...props}
    />
  );
}

export function Heading({ className, tone = 'default', ...props }: TypographyProps) {
  return (
    <Text
      className={`font-nunitoBold text-[18px] leading-[24px] ${toneClass(tone)} ${className ?? ''}`}
      {...props}
    />
  );
}

export function Body({ className, tone = 'default', ...props }: TypographyProps) {
  return (
    <Text className={`font-nunito text-[15px] leading-[21px] ${toneClass(tone)} ${className ?? ''}`} {...props} />
  );
}

export function Caption({ className, tone = 'muted', ...props }: TypographyProps) {
  return (
    <Text
      className={`font-nunito text-[13px] leading-[18px] ${toneClass(tone)} ${className ?? ''}`}
      {...props}
    />
  );
}

export function Label({ className, tone = 'muted', ...props }: TypographyProps) {
  return (
    <Text
      className={`font-nunitoBold text-[12px] leading-[16px] tracking-[0.2px] ${toneClass(tone)} ${
        className ?? ''
      }`}
      {...props}
    />
  );
}

