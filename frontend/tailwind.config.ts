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
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        sage: {
          50: '#f6f7f4',
          100: '#e3e7dc',
          200: '#c8d1bb',
          300: '#a6b494',
          400: '#879973',
          500: '#6b7d59',
          600: '#546345',
          700: '#424d37',
          800: '#373f2f',
          900: '#2f3629',
        },
        terracotta: {
          500: '#c87941',
          600: '#b06835',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

