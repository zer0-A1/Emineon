import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emineon Brand Colors - Exact specification
        primary: {
          DEFAULT: '#0A2F5A', // Deep Navy Blue - professionalism, reliability, expertise
          50: '#F0F4F8',
          100: '#E1E9F1',
          200: '#C3D3E3',
          300: '#A5BDD5',
          400: '#6691B9',
          500: '#0A2F5A',
          600: '#092951',
          700: '#072040',
          800: '#051730',
          900: '#040E20',
        },
        secondary: {
          DEFAULT: '#444B54', // Steel Gray - modern, industrial feel
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#444B54',
          800: '#343A40',
          900: '#232629', // Charcoal Black
        },
        accent: {
          DEFAULT: '#C75B12', // Burnt Orange - creativity, enthusiasm, energy
          50: '#FEF4ED',
          100: '#FDE8D7',
          200: '#FBCEB0',
          300: '#F8B088',
          400: '#F4985F',
          500: '#C75B12',
          600: '#B8520F',
          700: '#A8490D',
          800: '#98400A',
          900: '#893708',
        },
        teal: {
          DEFAULT: '#008080', // Teal - balance, tranquility, sophistication
          50: '#E6F7F7',
          100: '#CCEEEE',
          200: '#99DDDD',
          300: '#66CCCC',
          400: '#33BBBB',
          500: '#008080',
          600: '#007373',
          700: '#006666',
          800: '#005959',
          900: '#004D4D',
        },
        neutral: {
          DEFAULT: '#F8F9FA', // Off-White - balance, clarity, modern appeal
          50: '#FFFFFF',
          100: '#F8F9FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#232629', // Charcoal Black
        },
        // Functional colors
        success: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(10, 47, 90, 0.07), 0 10px 20px -2px rgba(10, 47, 90, 0.04)',
        'medium': '0 4px 25px -5px rgba(10, 47, 90, 0.1), 0 10px 30px -5px rgba(10, 47, 90, 0.08)',
        'large': '0 10px 40px -10px rgba(10, 47, 90, 0.15), 0 20px 50px -10px rgba(10, 47, 90, 0.1)',
        'emineon': '0 4px 20px -2px rgba(10, 47, 90, 0.12), 0 8px 30px -4px rgba(68, 75, 84, 0.08)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

export default config; 