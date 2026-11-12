/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── SkillBridge design system ─────────────────────────────────────────
        brand: {
          green:      '#16A34A',  // primary CTA / accent
          'green-lt': '#DCFCE7',  // tag backgrounds, highlights
          amber:      '#D97706',  // gap / missing skill badges
          'amber-lt': '#FEF3C7',
        },
        surface: '#F9F8F6',       // warm off-white page background
        border:  '#E5E7EB',
        text: {
          primary:   '#1A1A1A',
          secondary: '#57606A',
          muted:     '#8B949E',
        },
      },
      fontFamily: {
        sans: ['-apple-system', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['15px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
