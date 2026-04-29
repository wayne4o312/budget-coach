import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#94A3B8"
      {...props}
      className="rounded-2xl border border-border bg-surfaceMuted px-4 py-3 font-nunito text-[15px] leading-[21px] text-text"
      style={props.style}
    />
  );
}
