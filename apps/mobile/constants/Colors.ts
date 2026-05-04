// Cinema amber (warm, low-saturation, premium) — app UI tokens for StyleSheet.
const primaryLight = '#AB7942'; // rgb(171,121,66)
const primaryDark = '#AB7942';

export default {
  light: {
    text: '#1C1814', // rgb(28,24,20)
    mutedText: '#7A6959', // rgb(122,105,89)
    background: '#F6F0E6', // rgb(246,240,230)
    backgroundMuted: '#EFE7DA', // rgb(239,231,218)
    card: '#FCF9F4', // rgb(252,249,244)
    border: '#D0BEAA', // rgb(208,190,170)

    primary: primaryLight,
    primaryText: '#FCF9F4',
    // Tabs: use a calmer cocoa tone than the primary brass.
    tint: '#7A6959', // muted-foreground
    tabIconDefault: 'rgba(28,24,20,0.45)',
    tabIconSelected: '#7A6959',
  },
  dark: {
    // Keep dark close to light for now since the app's main aesthetic is warm-light.
    // (If you later add true dark tokens, mirror them here.)
    text: '#1C1814',
    mutedText: '#7A6959',
    background: '#F6F0E6',
    backgroundMuted: '#EFE7DA',
    card: '#FCF9F4',
    border: '#D0BEAA',

    primary: primaryDark,
    primaryText: '#FCF9F4',
    tint: '#7A6959',
    tabIconDefault: 'rgba(28,24,20,0.45)',
    tabIconSelected: '#7A6959',
  },
};
