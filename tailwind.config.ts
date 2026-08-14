import type { Config } from 'tailwindcss';

// Токены синхронизированы с docs/design.md — единственным источником правды по дизайн-системе.
// Breakpoints намеренно не переопределяются: docs/design.md фиксирует, что bp-sm..bp-2xl
// совпадают один-в-один со стандартной шкалой Tailwind (sm/md/lg/xl/2xl).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F51C7',
          hover: '#4647AF',
          active: '#3E3F9B',
          tint: '#F4F5FC',
        },
        paw: '#685393',
        secondary: {
          DEFAULT: '#9BC53D',
          tint: '#F9FCF3',
          'on-tint': '#77982D',
        },
        'on-secondary': '#33421C',
        tertiary: {
          DEFAULT: '#6F6FE0',
          tint: '#F6F6FD',
          'on-tint': '#6161DD',
        },
        neutral: {
          900: '#0E0E12',
          700: '#4A4A4D',
          500: '#7A7A7D',
          300: '#DBDBDB',
          200: '#E7E7E7',
          100: '#F1F1F1',
        },
        surface: '#FFFFFF',
        error: {
          DEFAULT: '#D92D20',
          tint: '#FCEEED',
          'on-tint': '#D02B1F',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      fontSize: {
        display: ['40px', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '700' }],
        h1: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '1.25', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1.2', fontWeight: '600' }],
        'label-caps': ['12px', { lineHeight: '1', letterSpacing: '0.06em', fontWeight: '600' }],
        'section-heading': [
          '21px',
          { lineHeight: '1.3', letterSpacing: '0.03em', fontWeight: '700' },
        ],
        price: ['18px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      borderRadius: {
        sm: '8px',
        card: '10px',
        md: '12px',
        lg: '20px',
        'footer-mobile': '24px',
        xl: '32px',
        '2xl': '40px',
      },
      // ВАЖНО: эти именованные ключи (xs/sm/md/lg/xl/2xl/3xl) коллизируют в Tailwind v4 с
      // одноимённым встроенным набором maxWidth — max-w-xs резолвится в 4px (это значение),
      // а не в дефолтные 20rem Tailwind. Проверено эмпирически на Header (2026-08-12). Не
      // использовать голые max-w-xs/sm/md/lg/xl/2xl/3xl нигде в проекте — только
      // max-w-container/max-w-reading (см. ниже) или произвольное max-w-[Npx].
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        '2xl': '64px',
        '3xl': '100px',
        gutter: '24px',
      },
      maxWidth: {
        container: '1280px',
        reading: '680px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
