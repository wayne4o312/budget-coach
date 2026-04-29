export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const radius = {
  md: 14,
  lg: 18,
  xl: 22,
} as const;

export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Nunito_800ExtraBold', fontWeight: '800' as const },
  heading: { fontSize: 18, lineHeight: 24, fontFamily: 'Nunito_800ExtraBold', fontWeight: '800' as const },
  body: { fontSize: 15, lineHeight: 21, fontFamily: 'Nunito_600SemiBold', fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: 'Nunito_600SemiBold', fontWeight: '600' as const },
} as const;

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
} as const;

