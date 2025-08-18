import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.gray.700'),
            h1: {
              color: theme('colors.gray.900'),
              fontWeight: '800',
              fontSize: theme('fontSize.3xl')[0],
              marginTop: theme('spacing.8'),
              marginBottom: theme('spacing.4'),
            },
            h2: {
              color: theme('colors.gray.900'),
              fontWeight: '700',
              fontSize: theme('fontSize.2xl')[0],
              marginTop: theme('spacing.6'),
              marginBottom: theme('spacing.3'),
            },
            h3: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
              fontSize: theme('fontSize.xl')[0],
              marginTop: theme('spacing.5'),
              marginBottom: theme('spacing.2'),
            },
            h4: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
              fontSize: theme('fontSize.lg')[0],
              marginTop: theme('spacing.4'),
              marginBottom: theme('spacing.2'),
            },
            h5: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
              marginTop: theme('spacing.4'),
              marginBottom: theme('spacing.2'),
            },
            h6: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
              marginTop: theme('spacing.4'),
              marginBottom: theme('spacing.2'),
            },
            a: {
              color: theme('colors.blue.600'),
              textDecoration: 'underline',
              fontWeight: '500',
              '&:hover': {
                color: theme('colors.blue.800'),
              },
            },
            strong: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
            },
            code: {
              color: theme('colors.gray.900'),
              backgroundColor: theme('colors.gray.100'),
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
              fontWeight: '500',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: theme('colors.gray.900'),
              color: theme('colors.gray.100'),
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0',
              fontSize: 'inherit',
              fontWeight: 'inherit',
            },
            blockquote: {
              borderLeftColor: theme('colors.gray.300'),
              borderLeftWidth: '4px',
              paddingLeft: theme('spacing.4'),
              fontStyle: 'italic',
              color: theme('colors.gray.600'),
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: theme('spacing.6'),
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: theme('spacing.6'),
            },
            li: {
              marginTop: theme('spacing.1'),
              marginBottom: theme('spacing.1'),
            },
          },
        },
        invert: {
          css: {
            color: theme('colors.gray.300'),
            h1: {
              color: theme('colors.white'),
            },
            h2: {
              color: theme('colors.white'),
            },
            h3: {
              color: theme('colors.white'),
            },
            h4: {
              color: theme('colors.white'),
            },
            h5: {
              color: theme('colors.white'),
            },
            h6: {
              color: theme('colors.white'),
            },
            a: {
              color: theme('colors.blue.400'),
              '&:hover': {
                color: theme('colors.blue.300'),
              },
            },
            strong: {
              color: theme('colors.white'),
            },
            code: {
              color: theme('colors.gray.100'),
              backgroundColor: theme('colors.gray.800'),
            },
            blockquote: {
              borderLeftColor: theme('colors.gray.600'),
              color: theme('colors.gray.400'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;