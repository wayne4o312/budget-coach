/** @type {import('tailwindcss').Config} */
const { hairlineWidth, platformSelect } = require('nativewind/theme');

// Align spacing scale with popmart-online: 0..200, each step = 4px
const generateSpacing = () => {
  const spacing = {};
  for (let i = 0; i <= 200; i++) spacing[i] = `${i * 4}px`;
  return spacing;
};

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return platformSelect({
        ios: `rgb(var(--${variableName}) / ${opacityValue})`,
        android: `rgb(var(--android-${variableName}) / ${opacityValue})`,
      });
    }
    return platformSelect({
      ios: `rgb(var(--${variableName}))`,
      android: `rgb(var(--android-${variableName}))`,
    });
  };
}

module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      spacing: generateSpacing(),
      fontFamily: {
        nunito: ['Nunito_600SemiBold'],
        nunitoBold: ['Nunito_800ExtraBold'],
        // Popmart-like mapping: explicit weights -> DINPro font files
        sans: ['DINPro-Regular'],
        sansMedium: ['DINPro-Medium'],
        sansBold: ['DINPro-Bold'],
        serifTitle: ['CormorantGaramond_700Bold'],
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      colors: {
        border: withOpacity('border'),
        input: withOpacity('input'),
        ring: withOpacity('ring'),
        background: withOpacity('background'),
        foreground: withOpacity('foreground'),
        primary: {
          DEFAULT: withOpacity('primary'),
          foreground: withOpacity('primary-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('secondary'),
          foreground: withOpacity('secondary-foreground'),
        },
        destructive: {
          DEFAULT: withOpacity('destructive'),
          foreground: withOpacity('destructive-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('muted'),
          foreground: withOpacity('muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('accent'),
          foreground: withOpacity('accent-foreground'),
        },
        popover: {
          DEFAULT: withOpacity('popover'),
          foreground: withOpacity('popover-foreground'),
        },
        card: {
          DEFAULT: withOpacity('card'),
          foreground: withOpacity('card-foreground'),
        },
      },
    },
  },
  plugins: [],
};

