/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS variable–backed colours — dark/light themes flip by swapping vars on <html>
        'packd-bg':           'rgb(var(--packd-bg) / <alpha-value>)',
        'packd-card':         'rgb(var(--packd-card) / <alpha-value>)',
        'packd-card2':        'rgb(var(--packd-card2) / <alpha-value>)',
        'packd-orange':       'rgb(var(--packd-orange) / <alpha-value>)',
        'packd-orange-light': 'rgb(var(--packd-orange-light) / <alpha-value>)',
        'packd-border':       'rgb(var(--packd-border) / <alpha-value>)',
        'packd-gray':         'rgb(var(--packd-gray) / <alpha-value>)',
        'packd-text':         'rgb(var(--packd-text) / <alpha-value>)',
        'packd-gold':         'rgb(var(--packd-gold) / <alpha-value>)',
        'packd-green':        'rgb(var(--packd-green) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'orange-glow': 'radial-gradient(ellipse at center, rgba(232,69,26,0.15) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, #1c2333 0%, #161b22 100%)',
        'hero-gradient': 'linear-gradient(180deg, #0d1117 0%, #1a0a05 50%, #0d1117 100%)',
      },
      animation: {
        'pulse-orange': 'pulse-orange 2s infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-orange': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232,69,26,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(232,69,26,0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
